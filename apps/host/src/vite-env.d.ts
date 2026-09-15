/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base WS URL of the game server, e.g. "ws://192.168.1.20:8787". Defaults to the
   * page's own hostname on port 8787 so it works out of the box on the same
   * machine and, once set, lets real phones on the LAN reach the server too. */
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
