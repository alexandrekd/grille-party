import { describe, expect, it } from "vitest";
import { TrackPool } from "./trackPool.js";
import type { StubTrack } from "../integrations/spotify/index.js";

function track(id: string): StubTrack {
  return { id, title: id, artist: "Artist", coverUrl: "#000" };
}

describe("TrackPool", () => {
  it("never returns the same track twice within a game", () => {
    const assignments = new Map([
      ["p1", [track("a"), track("b")]],
      ["p2", [track("c"), track("d")]],
    ]);
    const pool = new TrackPool(assignments);
    const seen = new Set<string>();
    let entry;
    while ((entry = pool.next())) {
      expect(seen.has(entry.track.id)).toBe(false);
      seen.add(entry.track.id);
    }
    expect(seen.size).toBe(4);
  });

  it("dedupes a track id that appears under more than one player (pool-wrap edge case)", () => {
    const assignments = new Map([
      ["p1", [track("shared"), track("a")]],
      ["p2", [track("shared"), track("b")]],
    ]);
    const pool = new TrackPool(assignments);
    expect(pool.remaining).toBe(3);
  });

  it("exhausts to null once every track is consumed", () => {
    const pool = new TrackPool(new Map([["p1", [track("a")]]]));
    expect(pool.next()?.track.id).toBe("a");
    expect(pool.next()).toBeNull();
  });

  it("tags each pooled track with its owner", () => {
    const pool = new TrackPool(new Map([["owner-1", [track("a")]]]));
    expect(pool.next()).toEqual({ track: track("a"), ownerPlayerId: "owner-1" });
  });

  it("shuffles using the injected rng (deterministic with a fixed sequence)", () => {
    const assignments = new Map([["p1", [track("a"), track("b"), track("c")]]]);
    // A constant rng of 0 means Fisher-Yates always swaps index i with 0 —
    // deterministic, just here to prove the rng hook is actually used.
    const pool = new TrackPool(assignments, () => 0);
    const order = [pool.next()?.track.id, pool.next()?.track.id, pool.next()?.track.id];
    expect(order).toEqual(["b", "c", "a"]);
  });
});
