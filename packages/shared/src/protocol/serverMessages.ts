import type {
  MusicSource,
  PublicPlayerSummary,
  ResolvedVote,
  RoomPhase,
  ScoreDelta,
  StandingEntry,
  ReactionAssignment,
} from "../domain/room.js";

export interface JoinedAckMessage {
  type: "joined";
  playerId: string;
  rejoinToken: string;
  roomCode: string;
}

export interface HostRegisteredMessage {
  type: "host_registered";
  roomCode: string;
}

/** Public round info visible to EVERY audience before resolution — deliberately has no
 * track title/artist and no vote data, so it is safe to broadcast identically to the
 * host and to every player (including the song's owner). */
export interface RoundPublicInfo {
  roundId: string;
  roundIndex: number;
  votingDeadlineTs: number;
  /** The full voting window in ms (the track's own duration — see
   * Room.startNextRound) — clients derive the countdown ring's fraction from this
   * rather than a shared constant, since it now varies per round. */
  totalVoteMs: number;
}

/**
 * Full room snapshot. This type is shared verbatim by host and player connections —
 * it structurally has no field capable of carrying a `voterId`/`choiceId` pair, which
 * is what makes "the host never receives individual votes before resolution" a
 * property of the type system rather than a broadcast-time filter that could be
 * bypassed by a future refactor. Individual vote data only ever appears in
 * `RoundResolvedMessage`, sent once a round is fully resolved.
 */
export interface RoomStateMessage {
  type: "room_state";
  roomCode: string;
  phase: RoomPhase;
  players: PublicPlayerSummary[];
  round: RoundPublicInfo | null;
  maxRounds: number;
  roundIndex: number;
  allReady: boolean;
  /** Leader-set, applied to a player's track pool as of when *they* connect
   * Spotify — see MusicSource's doc comment. */
  musicSource: MusicSource;
}

/** Aggregate-only vote progress — identical shape/content for host and every player. */
export interface VoteProgressMessage {
  type: "vote_progress";
  roundId: string;
  votesReceived: number;
  votesExpected: number;
}

/** Sent only back to the voter who cast it — never broadcast. */
export interface VoteAckMessage {
  type: "vote_ack";
  roundId: string;
  votedForPlayerId: string;
}

/** Sent to a rejoining player mid-round so their UI can restore a locked vote. */
export interface MyVoteMessage {
  type: "my_vote";
  roundId: string;
  votedForPlayerId: string | null;
}

/**
 * Full per-voter breakdown — safe because it is only ever sent AFTER a round has
 * resolved (all votes in, or the timer expired). This is the one message type in the
 * whole protocol allowed to carry `votes`.
 */
export interface RoundResolvedMessage {
  type: "round_resolved";
  roundId: string;
  ownerPlayerId: string;
  /** `rank` is the track's position in whatever pool it came from (1 = top) when
   * that's known from a real Spotify fetch — absent for a fixture/stub track,
   * since a rank there wouldn't mean anything real. Powers the reveal's "Top N
   * de {name}" stat. */
  track: { title: string; artist: string; coverUrl: string; rank?: number };
  votes: ResolvedVote[];
  scoreDeltas: ScoreDelta[];
  newScores: { playerId: string; score: number }[];
  reactions: ReactionAssignment[];
}

export interface LeaderboardMessage {
  type: "leaderboard";
  standings: StandingEntry[];
  isFinal: boolean;
  /** Absolute deadline (epoch ms) for the next round's auto-start — an absolute
   * timestamp rather than a fixed "seconds remaining" so clients can tick it down
   * themselves instead of freezing at whatever value was true at broadcast time. */
  nextRoundAtTs?: number;
}

export interface GameOverMessage {
  type: "game_over";
  standings: StandingEntry[];
}

export interface PlayerReconnectedMessage {
  type: "player_reconnected";
  playerId: string;
}

export interface PlayerDisconnectedMessage {
  type: "player_disconnected";
  playerId: string;
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

/** Application-level heartbeat, on top of the transport's own WS ping/pong — some
 * proxies pass control frames through unreliably but never mangle a normal data
 * frame, so this is the more bullet-proof way to keep a connection from going
 * silently stale during a long, otherwise-quiet VOTING round. Client replies with
 * `heartbeat_ack` immediately on receipt. */
export interface HeartbeatMessage {
  type: "heartbeat";
}

/** Host-only: start real Spotify playback for the round now beginning. The host
 * needs the track URI to hand to the Web Playback SDK even though it must never be
 * displayed — this is the one place a track identity reaches the host pre-reveal,
 * and it travels only as an opaque URI the host passes straight to Spotify's API,
 * never rendered in the UI. */
export interface PlayTrackMessage {
  type: "play_track";
  trackUri: string;
}

/** Host-only: stop/pause playback (round resolved, or no Spotify session active). */
export interface StopTrackMessage {
  type: "stop_track";
}

/** Broadcast/shared messages both audiences may receive. */
export type SharedServerMessage =
  | RoomStateMessage
  | VoteProgressMessage
  | RoundResolvedMessage
  | LeaderboardMessage
  | GameOverMessage
  | PlayerReconnectedMessage
  | PlayerDisconnectedMessage
  | ErrorMessage
  | HeartbeatMessage;

export type HostBoundMessage =
  | SharedServerMessage
  | HostRegisteredMessage
  | PlayTrackMessage
  | StopTrackMessage;

export type PlayerBoundMessage =
  | SharedServerMessage
  | JoinedAckMessage
  | VoteAckMessage
  | MyVoteMessage;
