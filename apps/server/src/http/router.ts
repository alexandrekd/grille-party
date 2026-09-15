import type { IncomingMessage, ServerResponse } from "node:http";
import type { RoomManager } from "../rooms/RoomManager.js";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchTopTracks,
  refreshAccessToken,
  type SpotifyConfig,
} from "../integrations/spotify/oauth.js";
import { createPendingAuth, takePendingAuth } from "../integrations/spotify/pendingAuth.js";
import { leaderboardMessage, roomStateMessage, roundResolvedMessage } from "../ws/broadcast.js";

export interface HttpDeps {
  roomManager: RoomManager;
  spotify: SpotifyConfig | null;
  publicServerUrl: string;
  publicMobileUrl: string;
  publicHostUrl: string;
}

const PLAYER_SCOPE = "user-top-read";
const HOST_SCOPE = "streaming user-read-email user-read-private";

function redirectTo(res: ServerResponse, location: string): void {
  res.writeHead(302, { location });
  res.end();
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(body));
}

export function createHttpHandler(deps: HttpDeps) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", deps.publicServerUrl);

    if (url.pathname === "/health") {
      sendJson(res, 200, { ok: true, rooms: deps.roomManager.size, spotify: !!deps.spotify });
      return;
    }

    if (url.pathname === "/room/sync") {
      handleRoomSync(url, res, deps);
      return;
    }

    if (!deps.spotify) {
      if (url.pathname.startsWith("/spotify/")) {
        sendJson(res, 503, { error: "spotify_not_configured" });
        return;
      }
      res.writeHead(404);
      res.end();
      return;
    }
    const spotify = deps.spotify;

    try {
      switch (url.pathname) {
        case "/spotify/player/login":
          handlePlayerLogin(url, res, deps, spotify);
          return;
        case "/spotify/player/callback":
          await handlePlayerCallback(url, res, deps, spotify);
          return;
        case "/spotify/host/login":
          handleHostLogin(url, res, deps, spotify);
          return;
        case "/spotify/host/callback":
          await handleHostCallback(url, res, deps, spotify);
          return;
        case "/spotify/host/token":
          await handleHostToken(url, res, deps, spotify);
          return;
        default:
          res.writeHead(404);
          res.end();
      }
    } catch (e) {
      console.error("[http] error handling", url.pathname, e);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("internal error");
      }
    }
  };
}

/**
 * Plain HTTP backstop the clients poll every couple seconds alongside their
 * WebSocket, so a phase change is never missed for longer than the poll interval
 * even if the WebSocket has gone silently stale (a free-tier proxy dropping an
 * idle connection without either side seeing a close event — see the WS
 * heartbeat's doc comment in ws/server.ts). A short-lived HTTP request can't go
 * stale the same way, so this is a reliable ceiling on how out of sync a client
 * can ever get, independent of whatever is wrong with the socket.
 */
function handleRoomSync(url: URL, res: ServerResponse, deps: HttpDeps): void {
  const roomCode = url.searchParams.get("roomCode");
  const room = roomCode ? deps.roomManager.get(roomCode) : null;
  if (!room) {
    sendJson(res, 404, { error: "room_not_found" });
    return;
  }
  const playerId = url.searchParams.get("playerId");
  const vp = room.voteProgress;
  sendJson(res, 200, {
    roomState: roomStateMessage(room),
    voteProgress: vp ? { type: "vote_progress", ...vp } : null,
    roundResolved: roundResolvedMessage(room),
    leaderboard:
      room.phase === "LEADERBOARD" || room.phase === "GAME_OVER"
        ? leaderboardMessage(room, room.phase === "GAME_OVER")
        : null,
    myVote: playerId ? (room.currentRound?.votes.get(playerId) ?? null) : null,
  });
}

function handlePlayerLogin(url: URL, res: ServerResponse, deps: HttpDeps, spotify: SpotifyConfig): void {
  const roomCode = url.searchParams.get("roomCode");
  const playerId = url.searchParams.get("playerId");
  if (!roomCode || !playerId) {
    res.writeHead(400);
    res.end("missing roomCode/playerId");
    return;
  }
  const room = deps.roomManager.get(roomCode);
  if (!room || !room.players.has(playerId)) {
    res.writeHead(404);
    res.end("room or player not found");
    return;
  }
  const state = createPendingAuth({ roomCode, playerId, role: "player" });
  const redirectUri = `${deps.publicServerUrl}/spotify/player/callback`;
  redirectTo(res, buildAuthorizeUrl(spotify, { redirectUri, scope: PLAYER_SCOPE, state }));
}

async function handlePlayerCallback(
  url: URL,
  res: ServerResponse,
  deps: HttpDeps,
  spotify: SpotifyConfig,
): Promise<void> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const pending = state ? takePendingAuth(state) : null;

  if (errorParam || !code || !pending || pending.role !== "player" || !pending.playerId) {
    redirectTo(res, `${deps.publicMobileUrl}/?spotify=error`);
    return;
  }
  const room = deps.roomManager.get(pending.roomCode);
  if (!room) {
    redirectTo(res, `${deps.publicMobileUrl}/?spotify=error`);
    return;
  }
  try {
    const redirectUri = `${deps.publicServerUrl}/spotify/player/callback`;
    const tokens = await exchangeCodeForToken(spotify, { code, redirectUri });
    const tracks = await fetchTopTracks(tokens.accessToken);
    room.setPlayerTopTracks(pending.playerId, tracks);
    redirectTo(res, `${deps.publicMobileUrl}/?spotify=ok`);
  } catch (e) {
    console.error("[spotify] player callback failed", e);
    redirectTo(res, `${deps.publicMobileUrl}/?spotify=error`);
  }
}

function handleHostLogin(url: URL, res: ServerResponse, deps: HttpDeps, spotify: SpotifyConfig): void {
  const roomCode = url.searchParams.get("roomCode");
  if (!roomCode) {
    res.writeHead(400);
    res.end("missing roomCode");
    return;
  }
  const room = deps.roomManager.get(roomCode);
  if (!room) {
    res.writeHead(404);
    res.end("room not found");
    return;
  }
  const state = createPendingAuth({ roomCode, role: "host" });
  const redirectUri = `${deps.publicServerUrl}/spotify/host/callback`;
  // show_dialog forces the account chooser — useful since the host device is
  // shared and whoever last authorized may not be who's hosting tonight.
  redirectTo(
    res,
    `${buildAuthorizeUrl(spotify, { redirectUri, scope: HOST_SCOPE, state })}&show_dialog=true`,
  );
}

async function handleHostCallback(
  url: URL,
  res: ServerResponse,
  deps: HttpDeps,
  spotify: SpotifyConfig,
): Promise<void> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const pending = state ? takePendingAuth(state) : null;

  if (errorParam || !code || !pending || pending.role !== "host") {
    redirectTo(res, `${deps.publicHostUrl}/?spotify=error`);
    return;
  }
  const room = deps.roomManager.get(pending.roomCode);
  if (!room) {
    redirectTo(res, `${deps.publicHostUrl}/?spotify=error`);
    return;
  }
  try {
    const redirectUri = `${deps.publicServerUrl}/spotify/host/callback`;
    room.hostSpotifyTokens = await exchangeCodeForToken(spotify, { code, redirectUri });
    redirectTo(res, `${deps.publicHostUrl}/?spotify=ok`);
  } catch (e) {
    console.error("[spotify] host callback failed", e);
    redirectTo(res, `${deps.publicHostUrl}/?spotify=error`);
  }
}

async function handleHostToken(
  url: URL,
  res: ServerResponse,
  deps: HttpDeps,
  spotify: SpotifyConfig,
): Promise<void> {
  const roomCode = url.searchParams.get("roomCode");
  const room = roomCode ? deps.roomManager.get(roomCode) : null;
  if (!room || !room.hostSpotifyTokens) {
    sendJson(res, 404, { error: "not_connected" });
    return;
  }
  let tokens = room.hostSpotifyTokens;
  if (Date.now() > tokens.expiresAt - 30_000) {
    try {
      tokens = await refreshAccessToken(spotify, tokens.refreshToken);
      room.hostSpotifyTokens = tokens;
    } catch (e) {
      console.error("[spotify] host token refresh failed", e);
      sendJson(res, 500, { error: "refresh_failed" });
      return;
    }
  }
  sendJson(res, 200, { accessToken: tokens.accessToken });
}
