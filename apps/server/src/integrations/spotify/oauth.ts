import type { StubTrack } from "./types.js";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms. */
  expiresAt: number;
}

export function buildAuthorizeUrl(config: SpotifyConfig, opts: {
  redirectUri: string;
  scope: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: opts.redirectUri,
    scope: opts.scope,
    state: opts.state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function requestToken(config: SpotifyConfig, body: URLSearchParams): Promise<TokenSet> {
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    // Spotify only returns a new refresh_token sometimes on refresh — callers pass
    // the previous one through when it's absent.
    refreshToken: json.refresh_token ?? "",
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export function exchangeCodeForToken(
  config: SpotifyConfig,
  opts: { code: string; redirectUri: string },
): Promise<TokenSet> {
  return requestToken(
    config,
    new URLSearchParams({
      grant_type: "authorization_code",
      code: opts.code,
      redirect_uri: opts.redirectUri,
    }),
  );
}

export async function refreshAccessToken(
  config: SpotifyConfig,
  refreshToken: string,
): Promise<TokenSet> {
  const tokens = await requestToken(
    config,
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  );
  return { ...tokens, refreshToken: tokens.refreshToken || refreshToken };
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  duration_ms: number;
}

/** Player's real top tracks — `/me/top/tracks`, not an algorithmic playlist (those
 * lost API access in Nov 2024) — see the cahier des charges' Spotify notes. */
export async function fetchTopTracks(accessToken: string, limit = 10): Promise<StubTrack[]> {
  const res = await fetch(
    `${API_BASE}/me/top/tracks?limit=${limit}&time_range=short_term`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Spotify top-tracks request failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { items: SpotifyTrackItem[] };
  return json.items.map((t) => ({
    id: t.id,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    coverUrl: t.album.images[0]?.url ?? "",
    durationMs: t.duration_ms,
  }));
}

export function trackUriFor(trackId: string): string {
  return `spotify:track:${trackId}`;
}
