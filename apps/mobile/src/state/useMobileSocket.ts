import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeMessage,
  encodeMessage,
  type DancerTraits,
  type LeaderboardMessage,
  type PlayerBoundMessage,
  type RoomStateMessage,
  type RoundResolvedMessage,
  type VoteProgressMessage,
} from "@grille/shared";
import { serverWsBase } from "../lib/wsUrl.js";
import { loadStoredRejoin, saveStoredRejoin } from "./rejoinStorage.js";

const RECONNECT_DELAY_MS = 1500;

export interface MobileView {
  roomState: RoomStateMessage | null;
  voteProgress: VoteProgressMessage | null;
  roundResolved: RoundResolvedMessage | null;
  leaderboard: LeaderboardMessage | null;
  myPlayerId: string | null;
  /** The voter's own choice as known by the server — set from `vote_ack` right
   * after sending, or from `my_vote` on (re)join mid-round. Distinct from any
   * local "currently highlighted but not sent yet" selection, which is UI state
   * layered on top by the screen, same pattern as the character editor's draft. */
  myVote: string | null;
  joinError: string | null;
}

export interface MobileActions {
  join: (roomCode: string, playerName?: string) => void;
  submitTraits: (traits: DancerTraits, name: string) => void;
  submitVote: (roundId: string, votedForPlayerId: string) => void;
  /** Leader-only (see PublicPlayerSummary.isLeader) — the server silently ignores
   * these from anyone else. */
  startGame: (maxRounds?: number) => void;
  advance: () => void;
  resetGame: () => void;
}

/**
 * Real counterpart to `useMockMobileState()`. Connects lazily to `/ws/player` —
 * either when `join()` is called from the join screen, or eagerly on mount if a
 * rejoin token is already stored (reload mid-game). Auto-reconnects and re-sends
 * the stored rejoin token so one phone dropping doesn't lose that player's traits,
 * score, or in-flight vote.
 */
export function useMobileSocket(): MobileView & { actions: MobileActions } {
  const [roomState, setRoomState] = useState<RoomStateMessage | null>(null);
  const [voteProgress, setVoteProgress] = useState<VoteProgressMessage | null>(null);
  const [roundResolved, setRoundResolved] = useState<RoundResolvedMessage | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardMessage | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingJoinRef = useRef<{ roomCode: string; playerName?: string; rejoinToken?: string } | null>(null);
  const suppressAutoReconnectRef = useRef(false);

  const ensureSocket = useCallback((opts?: { force?: boolean }): WebSocket => {
    const existing = wsRef.current;
    if (!opts?.force && existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return existing;
    }
    if (opts?.force && existing && existing.readyState !== WebSocket.CLOSED) {
      // A forced reconnect (e.g. tab regained visibility) below already opens a
      // fresh socket — suppress the old one's own close-triggered reconnect so we
      // don't end up scheduling a second, redundant one.
      suppressAutoReconnectRef.current = true;
      existing.close();
    }
    const socket = new WebSocket(`${serverWsBase()}/ws/player`);
    wsRef.current = socket;

    socket.addEventListener("open", () => {
      const pending = pendingJoinRef.current;
      if (pending) socket.send(encodeMessage({ type: "join_room", ...pending }));
    });

    socket.addEventListener("message", (ev) => {
      const msg = decodeMessage<PlayerBoundMessage>(String(ev.data));
      if (!msg) return;
      switch (msg.type) {
        case "joined":
          setMyPlayerId(msg.playerId);
          setJoinError(null);
          saveStoredRejoin({ roomCode: msg.roomCode, rejoinToken: msg.rejoinToken });
          pendingJoinRef.current = { roomCode: msg.roomCode, rejoinToken: msg.rejoinToken };
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
        case "vote_ack":
        case "my_vote":
          setMyVote(msg.votedForPlayerId);
          break;
        case "error":
          // join_room failures show inline on JoinScreen; anything else (e.g. a
          // non-leader's stray player_start_game/player_advance) has no dedicated
          // UI yet, but at least isn't silent for whoever's debugging via devtools.
          if (msg.code === "room_not_found") setJoinError(msg.message);
          else console.error("[mobile] server error:", msg.code, msg.message);
          break;
        default:
          break;
      }
    });

    socket.addEventListener("close", () => {
      if (suppressAutoReconnectRef.current) {
        suppressAutoReconnectRef.current = false;
        return;
      }
      if (pendingJoinRef.current) setTimeout(() => ensureSocket(), RECONNECT_DELAY_MS);
    });

    return socket;
  }, []);

  // On mount, if a rejoin token is already stored (reload mid-game), reconnect
  // automatically instead of waiting for the join screen.
  useEffect(() => {
    const stored = loadStoredRejoin();
    if (stored) {
      pendingJoinRef.current = { roomCode: stored.roomCode, rejoinToken: stored.rejoinToken };
      ensureSocket();
    }
    return () => {
      pendingJoinRef.current = null;
      wsRef.current?.close();
    };
  }, [ensureSocket]);

  // A backgrounded/locked phone can freeze its WebSocket without ever firing a
  // "close" event — the tab just silently stops receiving frames, so the player
  // can be stuck on a stale phase until something wakes the JS event loop. Force a
  // fresh connection (which re-triggers the server's full resync) whenever the
  // player looks back at their phone, instead of waiting on the reconnect timer.
  useEffect(() => {
    function resync() {
      if (document.visibilityState !== "visible" || !pendingJoinRef.current) return;
      ensureSocket({ force: true });
    }
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    window.addEventListener("pageshow", resync);
    return () => {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
      window.removeEventListener("pageshow", resync);
    };
  }, [ensureSocket]);

  const join = useCallback(
    (roomCode: string, playerName?: string) => {
      pendingJoinRef.current = { roomCode, playerName };
      const socket = ensureSocket();
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(encodeMessage({ type: "join_room", roomCode, playerName }));
      }
    },
    [ensureSocket],
  );

  const submitTraits = useCallback((traits: DancerTraits, name: string) => {
    wsRef.current?.send(encodeMessage({ type: "submit_traits", traits, name }));
  }, []);

  const submitVote = useCallback((roundId: string, votedForPlayerId: string) => {
    wsRef.current?.send(encodeMessage({ type: "submit_vote", roundId, votedForPlayerId }));
  }, []);

  const startGame = useCallback((maxRounds?: number) => {
    wsRef.current?.send(encodeMessage({ type: "player_start_game", maxRounds }));
  }, []);

  const advance = useCallback(() => {
    wsRef.current?.send(encodeMessage({ type: "player_advance" }));
  }, []);

  const resetGame = useCallback(() => {
    wsRef.current?.send(encodeMessage({ type: "player_reset_game" }));
  }, []);

  return {
    roomState,
    voteProgress,
    roundResolved,
    leaderboard,
    myPlayerId,
    myVote,
    joinError,
    actions: { join, submitTraits, submitVote, startGame, advance, resetGame },
  };
}
