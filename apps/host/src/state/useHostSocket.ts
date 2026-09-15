import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeMessage,
  encodeMessage,
  type HostBoundMessage,
  type LeaderboardMessage,
  type RoomStateMessage,
  type RoundResolvedMessage,
  type VoteProgressMessage,
} from "@grille/shared";
import { serverWsBase } from "../lib/wsUrl.js";
import { serverHttpBase } from "../lib/serverHttpBase.js";
import type { HostActions, HostView, SpotifyCommand } from "./types.js";

const RECONNECT_DELAY_MS = 1500;
const ROOM_CODE_STORAGE_KEY = "grille:hostRoomCode";
// Plain HTTP backstop polled alongside the WebSocket — see the server's
// /room/sync doc comment. Deliberately doesn't touch spotifyCommand: polling
// must never re-trigger play_track/stop_track, or every tick would restart
// the song. It only keeps the display (phase, reveal, leaderboard) in sync.
const POLL_INTERVAL_MS = 2000;

/** Real counterpart to `useMockHostState()` — identical `HostView`/`HostActions`
 * shape, so `App.tsx` doesn't change when this replaces the mock. Registers as the
 * room's host over `/ws/host`; auto-reconnects (last-connection-wins per room,
 * matching the MVP's no-host-auth design) if the connection drops. */
export function useHostSocket(): HostView & { actions: HostActions } {
  const [roomState, setRoomState] = useState<RoomStateMessage | null>(null);
  const [voteProgress, setVoteProgress] = useState<VoteProgressMessage | null>(null);
  const [roundResolved, setRoundResolved] = useState<RoundResolvedMessage | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardMessage | null>(null);
  const [spotifyCommand, setSpotifyCommand] = useState<SpotifyCommand | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(0);

  const connectRef = useRef<() => void>(() => {});
  const suppressAutoReconnectRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const socket = new WebSocket(`${serverWsBase()}/ws/host`);
      wsRef.current = socket;

      socket.addEventListener("open", () => {
        const storedRoomCode = sessionStorage.getItem(ROOM_CODE_STORAGE_KEY) ?? undefined;
        socket.send(encodeMessage({ type: "host_join", roomCode: storedRoomCode }));
      });

      socket.addEventListener("message", (ev) => {
        const msg = decodeMessage<HostBoundMessage>(String(ev.data));
        if (!msg) return;
        switch (msg.type) {
          case "host_registered":
            sessionStorage.setItem(ROOM_CODE_STORAGE_KEY, msg.roomCode);
            break;
          case "room_state":
            setRoomState(msg);
            break;
          case "vote_progress":
            setVoteProgress(msg);
            break;
          case "round_resolved":
            setRoundResolved(msg);
            break;
          case "leaderboard":
            setLeaderboard(msg);
            break;
          case "play_track":
            seqRef.current += 1;
            setSpotifyCommand({ type: "play", trackUri: msg.trackUri, seq: seqRef.current });
            break;
          case "stop_track":
            seqRef.current += 1;
            setSpotifyCommand({ type: "stop", seq: seqRef.current });
            break;
          case "error":
            console.error("[host] server error:", msg.code, msg.message);
            if (msg.code === "room_not_found") {
              // Stored room no longer exists server-side (e.g. server restarted) —
              // drop it and immediately retry on this same socket so we don't get
              // stuck unregistered until something else closes the connection.
              sessionStorage.removeItem(ROOM_CODE_STORAGE_KEY);
              socket.send(encodeMessage({ type: "host_join" }));
            }
            break;
          case "heartbeat":
            socket.send(encodeMessage({ type: "heartbeat_ack" }));
            break;
          default:
            break;
        }
      });

      socket.addEventListener("close", () => {
        if (cancelled) return;
        if (suppressAutoReconnectRef.current) {
          // This close was triggered by connectRef.current() below, which is
          // already reconnecting itself — don't also schedule a second one.
          suppressAutoReconnectRef.current = false;
          return;
        }
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      });
    }

    connectRef.current = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        suppressAutoReconnectRef.current = true;
        wsRef.current.close();
      }
      connect();
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  // A backgrounded tab can freeze its WebSocket without ever firing a "close"
  // event — it just silently stops receiving frames. Force a fresh connection
  // (which re-triggers the server's full resync) whenever this tab regains focus,
  // instead of waiting on the reconnect timer or staying stuck on a stale phase.
  useEffect(() => {
    function resync() {
      if (document.visibilityState === "visible") connectRef.current();
    }
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    window.addEventListener("pageshow", resync);
    return () => {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
      window.removeEventListener("pageshow", resync);
    };
  }, []);

  useEffect(() => {
    const roomCode = roomState?.roomCode;
    if (!roomCode) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`${serverHttpBase()}/room/sync?roomCode=${encodeURIComponent(roomCode!)}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          roomState: RoomStateMessage;
          voteProgress: VoteProgressMessage | null;
          roundResolved: RoundResolvedMessage | null;
          leaderboard: LeaderboardMessage | null;
        };
        if (cancelled) return;
        setRoomState(data.roomState);
        if (data.voteProgress) setVoteProgress(data.voteProgress);
        setRoundResolved(data.roundResolved);
        setLeaderboard(data.leaderboard);
      } catch {
        // Ignore — this is a backstop on top of the WebSocket, not the only path;
        // the next tick just tries again.
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [roomState?.roomCode]);

  const startGame = useCallback((maxRounds?: number) => {
    wsRef.current?.send(encodeMessage({ type: "host_start_game", maxRounds }));
  }, []);

  const advance = useCallback(() => {
    wsRef.current?.send(encodeMessage({ type: "host_advance" }));
  }, []);

  return {
    roomState,
    voteProgress,
    roundResolved,
    leaderboard,
    spotifyCommand,
    actions: { startGame, advance },
  };
}
