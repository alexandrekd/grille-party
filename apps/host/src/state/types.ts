import type {
  LeaderboardMessage,
  RoomStateMessage,
  RoundResolvedMessage,
  VoteProgressMessage,
} from "@grille/shared";

/** What every screen renders from — identical shape whether it's driven by the mock
 * (this milestone) or the real `useHostSocket()` (wired in a later milestone), so
 * swapping the data source touches only the hook, not the screens. */
/** A one-off Spotify playback command from the server, with an incrementing `seq`
 * so the host's effect re-fires even if the same command (e.g. two "stop"s in a
 * row) arrives twice. */
export type SpotifyCommand = { type: "play"; trackUri: string; seq: number } | { type: "stop"; seq: number };

export interface HostView {
  roomState: RoomStateMessage | null;
  voteProgress: VoteProgressMessage | null;
  roundResolved: RoundResolvedMessage | null;
  leaderboard: LeaderboardMessage | null;
  spotifyCommand: SpotifyCommand | null;
}

export interface HostActions {
  startGame: (maxRounds?: number) => void;
  advance: () => void;
}
