import type { DancerTraits, Reaction } from "./traits.js";

export type RoomPhase = "LOBBY" | "VOTING" | "REVEAL" | "LEADERBOARD" | "GAME_OVER";

export type PlayerStatus = "JOINED" | "READY";

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  ownerPlayerId: string;
}

/** Player summary safe to broadcast to everyone at any time (no secrets). */
export interface PublicPlayerSummary {
  id: string;
  name: string;
  status: PlayerStatus;
  traits: DancerTraits | null;
  score: number;
  connected: boolean;
  /** The first player to join controls the game from their phone (start, skip) —
   * the TV has no clickable controls. */
  isLeader: boolean;
}

export interface ScoreDelta {
  playerId: string;
  delta: number;
  reason: "correct_guess" | "wrong_guess" | "self_correct" | "self_wrong" | "unnoticed_bonus";
}

export interface ResolvedVote {
  voterId: string;
  choiceId: string | null;
}

export interface StandingEntry {
  playerId: string;
  name: string;
  score: number;
  rank: number;
}

/** A single flanking/podium character reaction derived client-side isn't needed —
 * the server computes it once at resolution time so host and mobile agree. */
export interface ReactionAssignment {
  playerId: string;
  reaction: Reaction;
}
