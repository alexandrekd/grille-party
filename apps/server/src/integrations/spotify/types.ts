export interface StubTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  durationMs: number;
}

/**
 * The seam for swapping in real Spotify later: a `LiveSpotifyProvider` would do
 * per-player OAuth (redirect -> code exchange -> store tokens on the Player record)
 * and call the real `GET /me/top/tracks`, then get exported from `./index.ts`
 * instead of `StubSpotifyProvider` — nothing outside this folder needs to change,
 * since room/game logic only ever calls `getTopTracksForPlayer`.
 */
export interface SpotifyProvider {
  /** Assigns/returns this player's "top tracks" pool for the current game. */
  getTopTracksForPlayer(playerId: string): StubTrack[];
}
