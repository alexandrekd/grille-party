import type { Server as HttpServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import {
  REVEAL_DISPLAY_MS,
  LEADERBOARD_DISPLAY_MS,
  decodeMessage,
  encodeMessage,
  type ClientMessage,
  type ErrorMessage,
} from "@grille/shared";
import { RoomManager } from "../rooms/RoomManager.js";
import type { Room } from "../rooms/Room.js";
import { ConnectionRegistry } from "./registry.js";
import { sendHost, sendPlayer } from "./connection.js";
import {
  broadcastLeaderboard,
  broadcastRoomState,
  broadcastRoundResolved,
  broadcastVoteProgress,
  leaderboardMessage,
  roundResolvedMessage,
  sendPlayTrackToHost,
  sendStopTrackToHost,
} from "./broadcast.js";
import { newId } from "../util/id.js";
import { trackUriFor } from "../integrations/spotify/oauth.js";

/** Fires the host-only Spotify play command for whatever round is now current —
 * a no-op on the host side if it never connected Spotify (see PlayTrackMessage's
 * doc comment: the host silently ignores it, same as the pre-integration MVP). */
function playCurrentRound(registry: ConnectionRegistry, room: Room): void {
  const round = room.currentRound;
  if (round) sendPlayTrackToHost(registry, room, trackUriFor(round.track.id));
}

const SCHEDULER_TICK_MS = 500;
// Many free-tier hosts/proxies (Render included) silently drop a WebSocket that's
// gone quiet for a while, without either side ever seeing a close event — the
// connection just stops delivering frames. Rounds can now run for minutes with no
// traffic on their own (a song's length, not a fixed 20s), so this isn't rare.
// A heartbeat every 10s keeps bytes flowing (resets the proxy's idle timer) and
// lets us detect and terminate a truly-dead connection quickly instead of leaving
// a player stuck on a stale screen. Sent two ways: a raw WS ping/pong (cheap, but
// some proxies handle control frames unreliably) and an application-level
// heartbeat/heartbeat_ack data message (a normal frame no proxy special-cases) —
// either counts as "alive".
const HEARTBEAT_INTERVAL_MS = 10_000;

export function startWsServer(httpServer: HttpServer, roomManager: RoomManager): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer });
  const registry = new ConnectionRegistry();
  const alive = new WeakSet<WebSocket>();

  wss.on("connection", (raw, req) => {
    const connectionId = newId();
    const url = new URL(req.url ?? "/", "http://internal");
    const role = url.pathname === "/ws/host" ? "host" : "player";
    registry.add(connectionId, raw, { role, roomCode: null, playerId: null });
    alive.add(raw);

    raw.on("pong", () => alive.add(raw));

    raw.on("message", (data) => {
      const parsed = decodeMessage<ClientMessage>(String(data));
      if (!parsed) return;
      if (parsed.type === "heartbeat_ack") {
        alive.add(raw);
        return;
      }
      handleMessage(registry, roomManager, connectionId, raw, parsed);
    });

    raw.on("close", () => {
      handleDisconnect(registry, roomManager, connectionId);
    });
  });

  const heartbeatFrame = encodeMessage({ type: "heartbeat" });
  const heartbeatTimer = setInterval(() => {
    for (const client of wss.clients) {
      if (!alive.has(client)) {
        client.terminate();
        continue;
      }
      alive.delete(client);
      client.ping();
      if (client.readyState === client.OPEN) client.send(heartbeatFrame);
    }
  }, HEARTBEAT_INTERVAL_MS);

  const schedulerTimer = setInterval(() => tickAll(registry, roomManager), SCHEDULER_TICK_MS);
  wss.on("close", () => {
    clearInterval(schedulerTimer);
    clearInterval(heartbeatTimer);
  });

  return wss;
}

/** A (re)joining connection only gets `room_state` (phase + aggregate info) from
 * the broadcast that follows — if the room is already mid-REVEAL or
 * mid-LEADERBOARD/GAME_OVER, it also needs the phase-specific detail message that
 * was only ever broadcast once, at the moment of that transition, or its screen has
 * nothing to render. */
function resyncConnection(raw: WebSocket, room: Room, role: "host" | "player"): void {
  const send = role === "host" ? sendHost : sendPlayer;
  if (room.phase === "REVEAL") {
    const msg = roundResolvedMessage(room);
    if (msg) send(raw, msg);
  } else if (room.phase === "LEADERBOARD" || room.phase === "GAME_OVER") {
    send(raw, leaderboardMessage(room, room.phase === "GAME_OVER"));
  } else if (role === "host" && room.phase === "VOTING" && room.currentRound) {
    // A reloaded host needs Spotify told to resume this round's track — it isn't
    // still playing on its own after a page reload re-inits the Web Playback SDK.
    sendHost(raw, { type: "play_track", trackUri: trackUriFor(room.currentRound.track.id) });
  }
}

function sendError(raw: WebSocket, code: string, message: string): void {
  const msg: ErrorMessage = { type: "error", code, message };
  raw.send(JSON.stringify(msg));
}

function handleMessage(
  registry: ConnectionRegistry,
  roomManager: RoomManager,
  connectionId: string,
  raw: WebSocket,
  msg: ClientMessage,
): void {
  const meta = registry.getMeta(connectionId);
  if (!meta) return;

  switch (msg.type) {
    case "host_join": {
      const room = msg.roomCode ? roomManager.get(msg.roomCode) : roomManager.createRoom();
      if (!room) {
        sendError(raw, "room_not_found", "Code de partie introuvable.");
        return;
      }
      room.setHostConnection(connectionId);
      registry.setMeta(connectionId, { role: "host", roomCode: room.code, playerId: null });
      sendHost(raw, { type: "host_registered", roomCode: room.code });
      resyncConnection(raw, room, "host");
      broadcastRoomState(registry, room);
      return;
    }

    case "join_room": {
      const room = roomManager.get(msg.roomCode);
      if (!room) {
        sendError(raw, "room_not_found", "Code de partie introuvable.");
        return;
      }
      let player = msg.rejoinToken ? room.findByRejoinToken(msg.rejoinToken) : null;
      if (!player) player = room.addPlayer(msg.playerName ?? "");
      room.setPlayerConnection(player.id, connectionId);
      registry.setMeta(connectionId, { role: "player", roomCode: room.code, playerId: player.id });
      sendPlayer(raw, {
        type: "joined",
        playerId: player.id,
        rejoinToken: player.rejoinToken,
        roomCode: room.code,
      });
      const round = room.currentRound;
      if (round && room.phase === "VOTING") {
        sendPlayer(raw, {
          type: "my_vote",
          roundId: round.id,
          votedForPlayerId: round.votes.get(player.id) ?? null,
        });
      }
      resyncConnection(raw, room, "player");
      broadcastRoomState(registry, room);
      return;
    }

    case "submit_traits": {
      const room = roomForMeta(roomManager, meta);
      if (!room || meta.role !== "player" || !meta.playerId) return;
      room.submitTraits(meta.playerId, msg.traits, msg.name);
      broadcastRoomState(registry, room);
      return;
    }

    case "host_start_game": {
      const room = roomForMeta(roomManager, meta);
      if (!room || meta.role !== "host") return;
      const started = room.startGame(msg.maxRounds, Date.now());
      broadcastRoomState(registry, room);
      if (started) {
        broadcastVoteProgress(registry, room);
        playCurrentRound(registry, room);
      }
      return;
    }

    case "host_advance": {
      const room = roomForMeta(roomManager, meta);
      if (!room || meta.role !== "host") return;
      advancePhase(registry, room);
      return;
    }

    case "player_start_game": {
      const room = roomForMeta(roomManager, meta);
      if (!room || meta.role !== "player") return;
      if (meta.playerId !== room.leaderPlayerId) {
        sendError(raw, "not_leader", "Seul le joueur principal peut lancer la partie.");
        return;
      }
      const started = room.startGame(msg.maxRounds, Date.now());
      if (!started) {
        sendError(raw, "start_failed", "La partie ne peut pas démarrer pour le moment.");
      }
      broadcastRoomState(registry, room);
      if (started) {
        broadcastVoteProgress(registry, room);
        playCurrentRound(registry, room);
      }
      return;
    }

    case "player_advance": {
      const room = roomForMeta(roomManager, meta);
      if (!room || meta.role !== "player") return;
      if (meta.playerId !== room.leaderPlayerId) {
        sendError(raw, "not_leader", "Seul le joueur principal peut passer.");
        return;
      }
      advancePhase(registry, room);
      return;
    }

    case "player_reset_game": {
      const room = roomForMeta(roomManager, meta);
      if (!room || meta.role !== "player") return;
      if (meta.playerId !== room.leaderPlayerId) {
        sendError(raw, "not_leader", "Seul le joueur principal peut réinitialiser la partie.");
        return;
      }
      room.resetGame(Date.now());
      sendStopTrackToHost(registry, room);
      broadcastRoomState(registry, room);
      return;
    }

    case "submit_vote": {
      const room = roomForMeta(roomManager, meta);
      if (!room || meta.role !== "player" || !meta.playerId) return;
      const wasVoting = room.phase === "VOTING";
      const ok = room.submitVote(meta.playerId, msg.roundId, msg.votedForPlayerId, Date.now());
      if (!ok) return;
      sendPlayer(raw, { type: "vote_ack", roundId: msg.roundId, votedForPlayerId: msg.votedForPlayerId });
      if (wasVoting && room.phase === "REVEAL") {
        // submitVote's own resolution (last vote in) already flipped the phase.
        sendStopTrackToHost(registry, room);
        broadcastRoomState(registry, room);
        broadcastRoundResolved(registry, room);
      } else {
        broadcastVoteProgress(registry, room);
      }
      return;
    }

    case "leave_room": {
      const room = roomForMeta(roomManager, meta);
      if (!room) return;
      if (meta.role === "host") {
        room.clearHostConnection();
      } else if (meta.playerId) {
        room.setPlayerConnection(meta.playerId, null);
      }
      broadcastRoomState(registry, room);
      return;
    }

    default:
      return;
  }
}

function roomForMeta(
  roomManager: RoomManager,
  meta: { roomCode: string | null },
): Room | null {
  return meta.roomCode ? roomManager.get(meta.roomCode) : null;
}

/** Shared by `host_advance` and the scheduler's auto-advance — REVEAL->LEADERBOARD
 * and LEADERBOARD->(next VOTING | GAME_OVER) both broadcast the same way regardless
 * of what triggered the transition. */
function advancePhase(registry: ConnectionRegistry, room: Room): void {
  const now = Date.now();
  if (room.phase === "REVEAL") {
    if (!room.advanceFromReveal(now)) return;
    broadcastRoomState(registry, room);
    broadcastLeaderboard(registry, room, false);
    return;
  }
  if (room.phase === "LEADERBOARD") {
    const startedNext = room.advanceFromLeaderboard(now);
    broadcastRoomState(registry, room);
    if (startedNext) {
      broadcastVoteProgress(registry, room);
      playCurrentRound(registry, room);
    } else {
      const phaseAfter: string = room.phase;
      if (phaseAfter === "GAME_OVER") broadcastLeaderboard(registry, room, true);
    }
  }
}

function handleDisconnect(registry: ConnectionRegistry, roomManager: RoomManager, connectionId: string): void {
  const meta = registry.getMeta(connectionId);
  registry.remove(connectionId);
  if (!meta) return;
  const room = roomForMeta(roomManager, meta);
  if (!room) return;
  if (meta.role === "host" && room.hostConnectionId === connectionId) {
    room.clearHostConnection();
  } else if (meta.role === "player" && meta.playerId) {
    room.setPlayerConnection(meta.playerId, null);
  }
  broadcastRoomState(registry, room);
}

/** Polls every room for elapsed vote deadlines and REVEAL/LEADERBOARD display
 * durations — the only place Room's otherwise-timerless state machine gets driven
 * by wall-clock time. */
function tickAll(registry: ConnectionRegistry, roomManager: RoomManager): void {
  const now = Date.now();
  for (const room of roomManager.all()) {
    if (room.phase === "VOTING") {
      const resolved = room.maybeExpireVote(now);
      if (resolved) {
        sendStopTrackToHost(registry, room);
        broadcastRoomState(registry, room);
        broadcastRoundResolved(registry, room);
      }
      continue;
    }
    if (room.phase === "REVEAL" && now - room.phaseEnteredAt >= REVEAL_DISPLAY_MS) {
      advancePhase(registry, room);
      continue;
    }
    if (room.phase === "LEADERBOARD" && now - room.phaseEnteredAt >= LEADERBOARD_DISPLAY_MS) {
      advancePhase(registry, room);
    }
  }
}
