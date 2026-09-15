/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base WS URL of the game server, e.g. "ws://192.168.1.20:8787". Defaults to the
   * page's own hostname on port 8787 — set this to the host machine's LAN IP for
   * real phones to reach the server (see apps/mobile/vite.config.ts). */
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
