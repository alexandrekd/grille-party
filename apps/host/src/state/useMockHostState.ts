import { useCallback, useMemo, useState } from "react";
import type {
  LeaderboardMessage,
  PublicPlayerSummary,
  RoomStateMessage,
  RoundResolvedMessage,
  VoteProgressMessage,
} from "@grille/shared";
import { DEFAULT_MAX_ROUNDS } from "@grille/shared";

const MOCK_TOTAL_VOTE_MS = 20_000;
import { CHAR_FIXTURES, byId, toPublicPlayer } from "./fixtures.js";
import type { HostActions, HostView } from "./types.js";

export type Scene = "LOBBY" | "VOTING" | "REVEAL" | "LEADERBOARD" | "GAME_OVER";

const ROOM_CODE = "4821";
const ROUND_INDEX = 2; // "round 3"

function lobbyPlayers(joinedCount: number): PublicPlayerSummary[] {
  return CHAR_FIXTURES.slice(0, joinedCount).map((c) =>
    toPublicPlayer(c, { status: "READY" }),
  );
}

function allPlayers(): PublicPlayerSummary[] {
  return CHAR_FIXTURES.map((c) => toPublicPlayer(c));
}

/**
 * Hand-steppable fixture data standing in for `useHostSocket()` until the real
 * WebSocket wiring lands — same `HostView`/`HostActions` shape, so screens don't
 * change when the mock is swapped for the real hook. Mirrors the DA mockup's
 * content (same 8 characters, round 3/8, "Salomé grillée par 3 joueurs sur 7") for
 * a faithful side-by-side visual check.
 */
export function useMockHostState(): HostView & {
  actions: HostActions;
  devScene: Scene;
  devSetScene: (scene: Scene) => void;
} {
  const [scene, setScene] = useState<Scene>("LOBBY");
  const [deadline, setDeadline] = useState(() => Date.now() + MOCK_TOTAL_VOTE_MS);

  const startGame = useCallback(() => {
    setDeadline(Date.now() + MOCK_TOTAL_VOTE_MS);
    setScene("VOTING");
  }, []);

  const advance = useCallback(() => {
    setScene((s) => {
      if (s === "VOTING") return "REVEAL";
      if (s === "REVEAL") return "LEADERBOARD";
      if (s === "LEADERBOARD") return "GAME_OVER";
      return s;
    });
  }, []);

  const view = useMemo<HostView>(() => {
    const roomStateBase = {
      roomCode: ROOM_CODE,
      maxRounds: DEFAULT_MAX_ROUNDS,
      roundIndex: ROUND_INDEX,
      musicSource: "recent" as const,
    };

    if (scene === "LOBBY") {
      const players = lobbyPlayers(5);
      const roomState: RoomStateMessage = {
        type: "room_state",
        ...roomStateBase,
        phase: "LOBBY",
        players,
        round: null,
        allReady: players.length === CHAR_FIXTURES.length,
      };
      return { roomState, voteProgress: null, roundResolved: null, leaderboard: null, spotifyCommand: null };
    }

    if (scene === "VOTING") {
      const roundId = "round-3";
      const roomState: RoomStateMessage = {
        type: "room_state",
        ...roomStateBase,
        phase: "VOTING",
        players: allPlayers(),
        round: { roundId, roundIndex: ROUND_INDEX, votingDeadlineTs: deadline, totalVoteMs: MOCK_TOTAL_VOTE_MS },
        allReady: true,
      };
      const voteProgress: VoteProgressMessage = {
        type: "vote_progress",
        roundId,
        votesReceived: 6,
        votesExpected: 8,
      };
      return { roomState, voteProgress, roundResolved: null, leaderboard: null, spotifyCommand: null };
    }

    if (scene === "REVEAL") {
      const roomState: RoomStateMessage = {
        type: "room_state",
        ...roomStateBase,
        phase: "REVEAL",
        players: allPlayers(),
        round: { roundId: "round-3", roundIndex: ROUND_INDEX, votingDeadlineTs: deadline, totalVoteMs: MOCK_TOTAL_VOTE_MS },
        allReady: true,
      };
      const roundResolved: RoundResolvedMessage = {
        type: "round_resolved",
        roundId: "round-3",
        ownerPlayerId: "salome",
        track: { title: "Titre Mystère", artist: "Ava & Noé", coverUrl: "#F7A8B8" },
        votes: [
          { voterId: "marin", choiceId: "salome" },
          { voterId: "lila", choiceId: "noe" },
          { voterId: "noe", choiceId: null },
          { voterId: "salome", choiceId: "salome" },
          { voterId: "theo", choiceId: "marin" },
          { voterId: "ava", choiceId: "salome" },
          { voterId: "kenza", choiceId: "salome" },
          { voterId: "basile", choiceId: null },
        ],
        scoreDeltas: [
          { playerId: "marin", delta: 10, reason: "correct_guess" },
          { playerId: "lila", delta: 0, reason: "wrong_guess" },
          { playerId: "noe", delta: 0, reason: "wrong_guess" },
          { playerId: "theo", delta: 0, reason: "wrong_guess" },
          { playerId: "ava", delta: 10, reason: "correct_guess" },
          { playerId: "kenza", delta: 10, reason: "correct_guess" },
          { playerId: "basile", delta: 0, reason: "wrong_guess" },
          { playerId: "salome", delta: 0, reason: "self_correct" },
          { playerId: "salome", delta: 20, reason: "unnoticed_bonus" },
        ],
        newScores: CHAR_FIXTURES.map((c) => ({ playerId: c.id, score: c.score })),
        reactions: [
          { playerId: "salome", reaction: "caught" },
          { playerId: "marin", reaction: "surprise" },
          { playerId: "lila", reaction: "dodge" },
          { playerId: "noe", reaction: "sad" },
          { playerId: "theo", reaction: "dodge" },
          { playerId: "ava", reaction: "laugh" },
          { playerId: "kenza", reaction: "surprise" },
          { playerId: "basile", reaction: "sad" },
        ],
      };
      return { roomState, voteProgress: null, roundResolved, leaderboard: null, spotifyCommand: null };
    }

    const isFinal = scene === "GAME_OVER";
    const roomState: RoomStateMessage = {
      type: "room_state",
      ...roomStateBase,
      phase: isFinal ? "GAME_OVER" : "LEADERBOARD",
      players: allPlayers(),
      round: null,
      allReady: true,
    };
    const standings = [...CHAR_FIXTURES]
      .sort((a, b) => b.score - a.score)
      .map((c, i) => ({ playerId: c.id, name: c.name, score: c.score, rank: i + 1 }));
    const leaderboard: LeaderboardMessage = {
      type: "leaderboard",
      standings,
      isFinal,
      nextRoundAtTs: isFinal ? undefined : Date.now() + 5000,
    };
    return { roomState, voteProgress: null, roundResolved: null, leaderboard, spotifyCommand: null };
  }, [scene, deadline]);

  return { ...view, actions: { startGame, advance }, devScene: scene, devSetScene: setScene };
}

export { byId };
