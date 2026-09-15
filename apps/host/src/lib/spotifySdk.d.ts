/** Minimal ambient types for the parts of the Spotify Web Playback SDK
 * (https://sdk.scdn.co/spotify-player.js) this app actually uses — the SDK ships no
 * official TypeScript types. */
export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayerInstance;
    };
  }

  interface SpotifyPlayerInstance {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: "ready" | "not_ready", cb: (data: { device_id: string }) => void): void;
    addListener(
      event: "initialization_error" | "authentication_error" | "account_error" | "playback_error",
      cb: (data: { message: string }) => void,
    ): void;
  }
}
