import { serverWsBase } from "./wsUrl.js";

/** HTTP(S) counterpart of `serverWsBase()`, for the Spotify OAuth redirects (plain
 * browser navigations, not WebSocket frames). */
export function serverHttpBase(): string {
  return serverWsBase().replace(/^ws/, "http");
}
