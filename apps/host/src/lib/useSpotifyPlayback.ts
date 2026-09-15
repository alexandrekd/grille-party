import { useEffect, useRef, useState } from "react";
import { serverHttpBase } from "./serverHttpBase.js";
import type { SpotifyCommand } from "../state/types.js";

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";
const SPOTIFY_API = "https://api.spotify.com/v1";

function loadSdkScript(): void {
  if (document.querySelector(`script[src="${SDK_SRC}"]`)) return;
  const s = document.createElement("script");
  s.src = SDK_SRC;
  s.async = true;
  s.addEventListener("error", (e) => console.error("[spotify] sdk script failed to load", e));
  document.head.appendChild(s);
}

async function fetchHostAccessToken(roomCode: string): Promise<string | null> {
  try {
    const res = await fetch(`${serverHttpBase()}/spotify/host/token?roomCode=${encodeURIComponent(roomCode)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { accessToken?: string };
    return json.accessToken ?? null;
  } catch (e) {
    console.error("[spotify] host/token fetch threw", e);
    return null;
  }
}

/**
 * Loads the Spotify Web Playback SDK, registers this browser tab as a playback
 * device once the host has connected a Premium account (see the Lobby screen's
 * "Connecter Spotify" banner and `/spotify/host/login`), and executes play/stop
 * commands the server pushes over the room's WebSocket (`spotifyCommand`, from
 * `useHostSocket`). The actual Spotify Web API calls happen here in the browser —
 * `device_id` is generated client-side by the SDK and never known to the server.
 */
export function useSpotifyPlayback(roomCode: string | null, command: SpotifyCommand | null): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const deviceIdRef = useRef<string | null>(null);
  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);

  // Load the SDK script once; just flips sdkReady once window.Spotify exists.
  useEffect(() => {
    loadSdkScript();
    if (window.Spotify) setSdkReady(true);
    else window.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);
  }, []);

  // Create and connect the player only once we *also* know the room code.
  // The SDK calls getOAuthToken a single time as part of connect() and never
  // retries — connecting before roomCode was known meant that first (only)
  // call got nothing back and the whole connection stalled forever, silently.
  useEffect(() => {
    if (!sdkReady || !roomCode || playerRef.current || !window.Spotify) return;

    const player = new window.Spotify.Player({
      name: "Grillé ! — TV",
      volume: 0.8,
      getOAuthToken: (cb) => {
        const rc = roomCodeRef.current;
        if (!rc) return;
        void fetchHostAccessToken(rc).then((token) => {
          if (token) cb(token);
        });
      },
    });
    playerRef.current = player;

    player.addListener("ready", ({ device_id }) => {
      deviceIdRef.current = device_id;
      setConnected(true);
    });
    player.addListener("not_ready", () => setConnected(false));
    player.addListener("initialization_error", (d) => console.error("[spotify] init error", d.message));
    player.addListener("authentication_error", (d) => console.error("[spotify] auth error", d.message));
    player.addListener("account_error", (d) =>
      console.error("[spotify] account error (Premium required)", d.message),
    );
    player.addListener("playback_error", (d) => console.error("[spotify] playback error", d.message));
    void player.connect();

    return () => {
      player.disconnect();
      playerRef.current = null;
    };
  }, [sdkReady, roomCode]);

  useEffect(() => {
    if (!command || !connected) return;
    const rc = roomCodeRef.current;
    const deviceId = deviceIdRef.current;
    if (!rc || !deviceId) return;

    void (async () => {
      const token = await fetchHostAccessToken(rc);
      if (!token) return;
      if (command.type === "play") {
        await fetch(`${SPOTIFY_API}/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
          method: "PUT",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({ uris: [command.trackUri] }),
        }).catch((e: unknown) => console.error("[spotify] play failed", e));
      } else {
        await fetch(`${SPOTIFY_API}/me/player/pause`, {
          method: "PUT",
          headers: { authorization: `Bearer ${token}` },
        }).catch((e: unknown) => console.error("[spotify] pause failed", e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command?.seq, connected]);

  return { connected };
}
