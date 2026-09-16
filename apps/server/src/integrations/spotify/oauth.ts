import type { MusicSource } from "@grille/shared";
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

function toStubTrack(t: SpotifyTrackItem, rank: number): StubTrack {
  return {
    id: t.id,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    coverUrl: t.album.images[0]?.url ?? "",
    durationMs: t.duration_ms,
    rank,
  };
}

/** Player's real top tracks — `/me/top/tracks`, not an algorithmic playlist (those
 * lost API access in Nov 2024) — see the cahier des charges' Spotify notes.
 * `timeRange` "short_term" is ~4 weeks, "long_term" is several years/"all time". */
export async function fetchTopTracks(
  accessToken: string,
  timeRange: "short_term" | "long_term",
  limit = 10,
): Promise<StubTrack[]> {
  const res = await fetch(
    `${API_BASE}/me/top/tracks?limit=${limit}&time_range=${timeRange}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Spotify top-tracks request failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { items: SpotifyTrackItem[] };
  return json.items.map((t, i) => toStubTrack(t, i + 1));
}

/** Spotify's auto-generated "On Repeat" playlist (songs the player's currently
 * looping) — not every account is guaranteed to have one exposed via the API, so
 * this returns [] (never throws) if it can't be found or fetched, and the caller
 * falls back to `fetchTopTracks`. Matched by name since there's no stable ID for
 * an algorithmic playlist. */
async function fetchOnRepeatTracks(accessToken: string, limit: number): Promise<StubTrack[]> {
  try {
    const headers = { authorization: `Bearer ${accessToken}` };
    const listRes = await fetch(`${API_BASE}/me/playlists?limit=50`, { headers });
    if (!listRes.ok) return [];
    const listJson = (await listRes.json()) as { items: { id: string; name: string }[] };
    const onRepeat = listJson.items.find((p) => p.name.toLowerCase().includes("on repeat"));
    if (!onRepeat) return [];

    const tracksRes = await fetch(
      `${API_BASE}/playlists/${onRepeat.id}/tracks?limit=${limit}&fields=items(track(id,name,artists,album,duration_ms))`,
      { headers },
    );
    if (!tracksRes.ok) return [];
    const tracksJson = (await tracksRes.json()) as { items: { track: SpotifyTrackItem | null }[] };
    return tracksJson.items
      .filter((it): it is { track: SpotifyTrackItem } => !!it.track)
      .map((it, i) => toStubTrack(it.track, i + 1));
  } catch (e) {
    console.error("[spotify] on-repeat fetch failed", e);
    return [];
  }
}

/** The single entry point the OAuth callback route uses — picks the fetch
 * strategy for the room's current MusicSource, with a graceful fallback to
 * "recent" if "onrepeat" can't find anything (see fetchOnRepeatTracks). */
export async function fetchTracksForSource(
  accessToken: string,
  source: MusicSource,
  limit = 10,
): Promise<StubTrack[]> {
  switch (source) {
    case "alltime":
      return fetchTopTracks(accessToken, "long_term", limit);
    case "onrepeat": {
      const tracks = await fetchOnRepeatTracks(accessToken, limit);
      return tracks.length > 0 ? tracks : fetchTopTracks(accessToken, "short_term", limit);
    }
    case "recent":
    default:
      return fetchTopTracks(accessToken, "short_term", limit);
  }
}

export function trackUriFor(trackId: string): string {
  return `spotify:track:${trackId}`;
}
