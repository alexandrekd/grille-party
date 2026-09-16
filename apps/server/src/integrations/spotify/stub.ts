import type { SpotifyProvider, StubTrack } from "./types.js";
import { FIXTURE_TRACKS, FIXTURE_PARTITION_SIZE } from "./fixtures.js";

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * One instance per room/game (not a global singleton) so "no repeated track in a
 * game" holds per-game rather than draining a shared pool across concurrent rooms.
 * Assigns each joining player the next unclaimed partition of a pool shuffled once
 * at construction — this both gives believable distinct "top tracks" per player and,
 * combined with the room's shuffle-without-replacement round selection, trivially
 * guarantees no track repeats within a game.
 */
export class StubSpotifyProvider implements SpotifyProvider {
  private readonly shuffled: StubTrack[];
  private nextIndex = 0;
  private readonly assigned = new Map<string, StubTrack[]>();

  constructor() {
    this.shuffled = shuffle(FIXTURE_TRACKS);
  }

  getTopTracksForPlayer(playerId: string): StubTrack[] {
    const existing = this.assigned.get(playerId);
    if (existing) return existing;
    const chunk = this.shuffled.slice(this.nextIndex, this.nextIndex + FIXTURE_PARTITION_SIZE);
    this.nextIndex += FIXTURE_PARTITION_SIZE;
    // Pool exhausted (more players than the fixture pool supports) — wrap around
    // rather than leaving a player with zero tracks; still no in-game repeats
    // because the room dedupes by track id when building its round pool.
    const picked = chunk.length > 0 ? chunk : shuffle(FIXTURE_TRACKS).slice(0, FIXTURE_PARTITION_SIZE);
    // Fictional but consistent with the real-Spotify path — lets the reveal's
    // "Top N" stat work the same way regardless of where the track came from.
    const filled = picked.map((t, i) => ({ ...t, rank: i + 1 }));
    this.assigned.set(playerId, filled);
    return filled;
  }
}
