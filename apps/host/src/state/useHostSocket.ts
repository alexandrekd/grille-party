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
import type { HostActions, HostView } from "./types.js";

const RECONNECT_DELAY_MS = 1500;

/** Real counterpart to `useMockHostState()` — identical `HostView`/`HostActions`
 * shape, so `App.tsx` doesn't change when this replaces the mock. Registers as the
 * room's host over `/ws/host`; auto-reconnects (last-connection-wins per room,
 * matching the MVP's no-host-auth design) if the connection drops. */
export function useHostSocket(): HostView & { actions: HostActions } {
  const [roomState, setRoomState] = useState<RoomStateMessage | null>(null);
  const [voteProgress, setVoteProgress] = useState<VoteProgressMessage | null>(null);
  const [roundResolved, setRoundResolved] = useState<RoundResolvedMessage | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const socket = new WebSocket(`${serverWsBase()}/ws/host`);
      wsRef.current = socket;

      socket.addEventListener("open", () => {
        socket.send(encodeMessage({ type: "host_join" }));
      });

      socket.addEventListener("message", (ev) => {
        const msg = decodeMessage<HostBoundMessage>(String(ev.data));
        if (!msg) return;
        switch (msg.type) {
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
          case "error":
            console.error("[host] server error:", msg.code, msg.message);
            break;
          default:
            break;
        }
      });

      socket.addEventListener("close", () => {
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      });
    }

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  const startGame = useCallback((maxRounds?: number) => {
    wsRef.current?.send(encodeMessage({ type: "host_start_game", maxRounds }));
  }, []);

  const advance = useCallback(() => {
    wsRef.current?.send(encodeMessage({ type: "host_advance" }));
  }, []);

  return { roomState, voteProgress, roundResolved, leaderboard, actions: { startGame, advance } };
}
