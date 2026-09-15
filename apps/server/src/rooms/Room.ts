import {
  DEFAULT_MAX_ROUNDS,
  VOTE_WINDOW_MS,
  validateTraits,
  type DancerTraits,
  type PlayerStatus,
  type PublicPlayerSummary,
  type ReactionAssignment,
  type ResolvedVote,
  type RoomPhase,
  type ScoreDelta,
  type StandingEntry,
} from "@grille/shared";
import { newId, newRejoinToken } from "../util/id.js";
import { createSpotifyProvider, type SpotifyProvider, type StubTrack } from "../integrations/spotify/index.js";
import { TrackPool } from "../game/trackPool.js";
import { applyScoreDeltas, computeRoundScoring } from "../game/scoring.js";
import { computeReactionAssignments } from "../game/reactions.js";

export interface PlayerRecord {
  id: string;
  name: string;
  rejoinToken: string;
  status: PlayerStatus;
  traits: DancerTraits | null;
  score: number;
  connectionId: string | null;
  topTracks: StubTrack[];
}

export interface RoundRecord {
  id: string;
  index: number;
  ownerPlayerId: string;
  track: StubTrack;
  votingDeadlineTs: number;
  votes: Map<string, string>;
  resolved: boolean;
  resolvedAt: number | null;
  scoreDeltas: ScoreDelta[] | null;
  reactions: ReactionAssignment[] | null;
}

export interface RoundPublicView {
  roundId: string;
  roundIndex: number;
  votingDeadlineTs: number;
}

/**
 * In-memory room/game state machine: LOBBY -> VOTING -> REVEAL -> LEADERBOARD ->
 * (VOTING again | GAME_OVER). VOTING covers the DA's "musique en cours" screen —
 * dancing and vote collection happen together, there's no separate playing phase.
 *
 * Deliberately has no internal timers: `maybeExpireVote`/`advanceFromReveal`/
 * `advanceFromLeaderboard` are called by the caller (the WS layer's scheduler, or a
 * test) whenever it decides a deadline/display-duration has elapsed. That keeps this
 * class a pure, directly-testable state machine.
 */
export class Room {
  readonly id = newId();
  readonly code: string;
  phase: RoomPhase = "LOBBY";
  /** When the current phase was entered — lets the WS layer's scheduler know when a
   * REVEAL/LEADERBOARD display duration has elapsed without Room needing its own
   * internal timers. */
  phaseEnteredAt = Date.now();
  hostConnectionId: string | null = null;
  /** The host's Spotify Premium tokens (Web Playback SDK), one session per room —
   * set by the host OAuth callback route, read/refreshed by the `/spotify/host/token`
   * route the SDK polls. `null` means the host hasn't connected Spotify (or skipped
   * it) — the game still runs, just silently, matching the pre-integration MVP. */
  hostSpotifyTokens: { accessToken: string; refreshToken: string; expiresAt: number } | null = null;
  maxRounds = DEFAULT_MAX_ROUNDS;
  readonly players = new Map<string, PlayerRecord>();
  readonly rounds: RoundRecord[] = [];
  currentRoundIndex = -1;

  private readonly spotify: SpotifyProvider;
  private trackPool: TrackPool | null = null;

  constructor(code: string, spotify: SpotifyProvider = createSpotifyProvider()) {
    this.code = code;
    this.spotify = spotify;
  }

  get currentRound(): RoundRecord | null {
    return this.rounds[this.currentRoundIndex] ?? null;
  }

  // --- Lobby -------------------------------------------------------------

  addPlayer(name: string): PlayerRecord {
    const id = newId();
    const player: PlayerRecord = {
      id,
      name: name.trim() || "Joueur",
      rejoinToken: newRejoinToken(),
      status: "JOINED",
      traits: null,
      score: 0,
      connectionId: null,
      // Empty until either real Spotify OAuth completes (setPlayerTopTracks, called
      // from the OAuth callback route) or startGame() fills in a fixture fallback
      // for anyone who skipped/never finished connecting.
      topTracks: [],
    };
    this.players.set(id, player);
    return player;
  }

  /** Called by the Spotify OAuth callback route once a player's real top tracks
   * have been fetched. */
  setPlayerTopTracks(playerId: string, tracks: StubTrack[]): void {
    const p = this.players.get(playerId);
    if (p) p.topTracks = tracks;
  }

  findByRejoinToken(token: string): PlayerRecord | null {
    for (const p of this.players.values()) {
      if (p.rejoinToken === token) return p;
    }
    return null;
  }

  setPlayerConnection(playerId: string, connectionId: string | null): void {
    const p = this.players.get(playerId);
    if (p) p.connectionId = connectionId;
  }

  setHostConnection(connectionId: string): void {
    this.hostConnectionId = connectionId;
  }

  clearHostConnection(): void {
    this.hostConnectionId = null;
  }

  private transitionTo(phase: RoomPhase, now: number): void {
    this.phase = phase;
    this.phaseEnteredAt = now;
  }

  submitTraits(playerId: string, traits: Partial<DancerTraits>, name: string): boolean {
    const p = this.players.get(playerId);
    if (!p) return false;
    p.traits = validateTraits(traits);
    const trimmed = name.trim();
    if (trimmed) p.name = trimmed.slice(0, 24);
    p.status = "READY";
    return true;
  }

  get allReady(): boolean {
    return this.players.size > 0 && [...this.players.values()].every((p) => p.status === "READY");
  }

  // --- Round loop ----------------------------------------------------------

  startGame(maxRounds: number | undefined, now: number): boolean {
    if (this.phase !== "LOBBY" || !this.allReady) return false;
    this.maxRounds = maxRounds && maxRounds > 0 ? Math.floor(maxRounds) : DEFAULT_MAX_ROUNDS;
    // Anyone who never completed (or skipped) Spotify OAuth still needs a track to
    // own — fall back to the stub fixture pool so the game never breaks.
    for (const p of this.players.values()) {
      if (p.topTracks.length === 0) p.topTracks = this.spotify.getTopTracksForPlayer(p.id);
    }
    const assignments = new Map(
      [...this.players.entries()].map(([id, p]) => [id, p.topTracks] as const),
    );
    this.trackPool = new TrackPool(assignments);
    return this.startNextRound(now);
  }

  private startNextRound(now: number): boolean {
    if (this.currentRoundIndex + 1 >= this.maxRounds) {
      this.transitionTo("GAME_OVER", now);
      return false;
    }
    const pooled = this.trackPool?.next() ?? null;
    if (!pooled) {
      this.transitionTo("GAME_OVER", now);
      return false;
    }
    this.currentRoundIndex += 1;
    this.rounds.push({
      id: newId(),
      index: this.currentRoundIndex,
      ownerPlayerId: pooled.ownerPlayerId,
      track: pooled.track,
      votingDeadlineTs: now + VOTE_WINDOW_MS,
      votes: new Map(),
      resolved: false,
      resolvedAt: null,
      scoreDeltas: null,
      reactions: null,
    });
    this.transitionTo("VOTING", now);
    return true;
  }

  submitVote(voterId: string, roundId: string, votedForPlayerId: string, now: number): boolean {
    const round = this.currentRound;
    if (!round || round.id !== roundId || this.phase !== "VOTING" || round.resolved) return false;
    if (!this.players.has(voterId) || !this.players.has(votedForPlayerId)) return false;
    round.votes.set(voterId, votedForPlayerId);
    if (round.votes.size >= this.players.size) this.resolveRound(now);
    return true;
  }

  get voteProgress(): { roundId: string; votesReceived: number; votesExpected: number } | null {
    const round = this.currentRound;
    if (!round) return null;
    return { roundId: round.id, votesReceived: round.votes.size, votesExpected: this.players.size };
  }

  /** Call periodically; resolves the round if its voting deadline has passed. */
  maybeExpireVote(now: number): boolean {
    const round = this.currentRound;
    if (!round || this.phase !== "VOTING" || round.resolved) return false;
    if (now < round.votingDeadlineTs) return false;
    this.resolveRound(now);
    return true;
  }

  private resolveRound(now: number): void {
    const round = this.currentRound;
    if (!round || round.resolved) return;
    const allPlayerIds = [...this.players.keys()];
    const deltas = computeRoundScoring({
      ownerPlayerId: round.ownerPlayerId,
      allPlayerIds,
      votes: round.votes,
    });
    const previousScores = new Map(allPlayerIds.map((id) => [id, this.players.get(id)!.score]));
    const newScores = applyScoreDeltas(previousScores, deltas);
    for (const [id, score] of newScores) {
      const p = this.players.get(id);
      if (p) p.score = score;
    }
    round.resolved = true;
    round.resolvedAt = now;
    round.scoreDeltas = deltas;
    round.reactions = computeReactionAssignments(round.ownerPlayerId, allPlayerIds, round.votes);
    this.transitionTo("REVEAL", now);
  }

  /** Manual (`host_advance`) or auto (display duration elapsed) transition out of REVEAL. */
  advanceFromReveal(now: number): boolean {
    if (this.phase !== "REVEAL") return false;
    this.transitionTo("LEADERBOARD", now);
    return true;
  }

  /** Manual or auto transition out of LEADERBOARD -> next round, or GAME_OVER. */
  advanceFromLeaderboard(now: number): boolean {
    if (this.phase !== "LEADERBOARD") return false;
    return this.startNextRound(now);
  }

  get isFinalStanding(): boolean {
    return this.phase === "GAME_OVER";
  }

  // --- Views for broadcasting ------------------------------------------------
  // Deliberately never touches `round.votes` — see RoomStateMessage's doc comment
  // in packages/shared for why that's the structural guarantee against leaking
  // individual votes to the host before resolution.

  get publicPlayers(): PublicPlayerSummary[] {
    return [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      traits: p.traits,
      score: p.score,
      connected: p.connectionId !== null,
    }));
  }

  get roundPublicInfo(): RoundPublicView | null {
    const r = this.currentRound;
    if (!r) return null;
    return { roundId: r.id, roundIndex: r.index, votingDeadlineTs: r.votingDeadlineTs };
  }

  resolvedVotesFor(round: RoundRecord): ResolvedVote[] {
    return [...this.players.keys()].map((voterId) => ({
      voterId,
      choiceId: round.votes.get(voterId) ?? null,
    }));
  }

  get standings(): StandingEntry[] {
    return [...this.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ playerId: p.id, name: p.name, score: p.score, rank: i + 1 }));
  }
}
