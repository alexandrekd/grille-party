import { serverWsBase } from "./wsUrl.js";

/** HTTP(S) counterpart of `serverWsBase()`, for the Spotify OAuth redirect and the
 * Web Playback SDK's token/playback fetches. */
export function serverHttpBase(): string {
  return serverWsBase().replace(/^ws/, "http");
}
