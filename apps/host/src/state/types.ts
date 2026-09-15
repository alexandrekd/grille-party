import type {
  LeaderboardMessage,
  RoomStateMessage,
  RoundResolvedMessage,
  VoteProgressMessage,
} from "@grille/shared";

/** What every screen renders from — identical shape whether it's driven by the mock
 * (this milestone) or the real `useHostSocket()` (wired in a later milestone), so
 * swapping the data source touches only the hook, not the screens. */
export interface HostView {
  roomState: RoomStateMessage | null;
  voteProgress: VoteProgressMessage | null;
  roundResolved: RoundResolvedMessage | null;
  leaderboard: LeaderboardMessage | null;
}

export interface HostActions {
  startGame: (maxRounds?: number) => void;
  advance: () => void;
}
