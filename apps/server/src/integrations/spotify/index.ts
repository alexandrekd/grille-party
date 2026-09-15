import { StubSpotifyProvider } from "./stub.js";
import type { SpotifyProvider } from "./types.js";

export type { SpotifyProvider, StubTrack } from "./types.js";

/** The only factory room code should call — swapping the stub for a real Spotify
 * integration later means changing only this function's body. */
export function createSpotifyProvider(): SpotifyProvider {
  return new StubSpotifyProvider();
}
