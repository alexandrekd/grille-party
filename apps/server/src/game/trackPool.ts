import type { StubTrack } from "../integrations/spotify/index.js";

export interface PooledTrack {
  track: StubTrack;
  ownerPlayerId: string;
}

function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Flattens every player's assigned top-tracks into one pool, deduped by track id
 * (defends against the stub provider's pool-exhaustion wraparound reusing a track),
 * shuffled once. `TrackPool.next()` consumes without replacement, so no track
 * repeats within a game — per the cahier des charges' "tirage sans répétition".
 */
export class TrackPool {
  private readonly queue: PooledTrack[];

  constructor(
    assignments: ReadonlyMap<string, readonly StubTrack[]>,
    rng: () => number = Math.random,
  ) {
    const seen = new Set<string>();
    const flat: PooledTrack[] = [];
    for (const [ownerPlayerId, tracks] of assignments) {
      for (const track of tracks) {
        if (seen.has(track.id)) continue;
        seen.add(track.id);
        flat.push({ track, ownerPlayerId });
      }
    }
    this.queue = shuffle(flat, rng);
  }

  get remaining(): number {
    return this.queue.length;
  }

  next(): PooledTrack | null {
    return this.queue.shift() ?? null;
  }
}
