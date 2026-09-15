import {
  LEADERBOARD_DISPLAY_MS,
  type HostBoundMessage,
  type LeaderboardMessage,
  type PlayerBoundMessage,
  type RoomStateMessage,
  type RoundResolvedMessage,
  type VoteProgressMessage,
} from "@grille/shared";
import type { Room } from "../rooms/Room.js";
import { sendHost, sendPlayer } from "./connection.js";
import type { ConnectionRegistry } from "./registry.js";

/** Sends the same message to the host connection and every connected player —
 * the shared server-message types (see packages/shared) are structured so this is
 * always safe pre-resolution (no vote fields to leak). */
function broadcastToRoom(
  registry: ConnectionRegistry,
  room: Room,
  msg: HostBoundMessage & PlayerBoundMessage,
): void {
  if (room.hostConnectionId) {
    const ws = registry.getSocket(room.hostConnectionId);
    if (ws) sendHost(ws, msg);
  }
  for (const p of room.players.values()) {
    if (!p.connectionId) continue;
    const ws = registry.getSocket(p.connectionId);
    if (ws) sendPlayer(ws, msg);
  }
}

export function roomStateMessage(room: Room): RoomStateMessage {
  return {
    type: "room_state",
    roomCode: room.code,
    phase: room.phase,
    players: room.publicPlayers,
    round: room.roundPublicInfo,
    maxRounds: room.maxRounds,
    roundIndex: room.currentRoundIndex,
    allReady: room.allReady,
  };
}

export function broadcastRoomState(registry: ConnectionRegistry, room: Room): void {
  broadcastToRoom(registry, room, roomStateMessage(room));
}

export function broadcastVoteProgress(registry: ConnectionRegistry, room: Room): void {
  const vp = room.voteProgress;
  if (!vp) return;
  const msg: VoteProgressMessage = { type: "vote_progress", ...vp };
  broadcastToRoom(registry, room, msg);
}

/** `null` if the current round isn't resolved yet — used both to broadcast right
 * after resolution and to resync a (re)joining connection mid-REVEAL. */
export function roundResolvedMessage(room: Room): RoundResolvedMessage | null {
  const round = room.currentRound;
  if (!round || !round.resolved || !round.scoreDeltas || !round.reactions) return null;
  return {
    type: "round_resolved",
    roundId: round.id,
    ownerPlayerId: round.ownerPlayerId,
    track: { title: round.track.title, artist: round.track.artist, coverUrl: round.track.coverUrl },
    votes: room.resolvedVotesFor(round),
    scoreDeltas: round.scoreDeltas,
    newScores: [...room.players.values()].map((p) => ({ playerId: p.id, score: p.score })),
    reactions: round.reactions,
  };
}

export function broadcastRoundResolved(registry: ConnectionRegistry, room: Room): void {
  const msg = roundResolvedMessage(room);
  if (msg) broadcastToRoom(registry, room, msg);
}

export function leaderboardMessage(room: Room, isFinal: boolean): LeaderboardMessage {
  return {
    type: "leaderboard",
    standings: room.standings,
    isFinal,
    nextRoundAtTs: isFinal ? undefined : room.phaseEnteredAt + LEADERBOARD_DISPLAY_MS,
  };
}

export function broadcastLeaderboard(registry: ConnectionRegistry, room: Room, isFinal: boolean): void {
  broadcastToRoom(registry, room, leaderboardMessage(room, isFinal));
}

function sendToHost(registry: ConnectionRegistry, room: Room, msg: HostBoundMessage): void {
  if (!room.hostConnectionId) return;
  const ws = registry.getSocket(room.hostConnectionId);
  if (ws) sendHost(ws, msg);
}

/** Host-only — see `PlayTrackMessage`'s doc comment in packages/shared for why this
 * never reaches players. */
export function sendPlayTrackToHost(registry: ConnectionRegistry, room: Room, trackUri: string): void {
  sendToHost(registry, room, { type: "play_track", trackUri });
}

export function sendStopTrackToHost(registry: ConnectionRegistry, room: Room): void {
  sendToHost(registry, room, { type: "stop_track" });
}
