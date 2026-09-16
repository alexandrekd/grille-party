/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base WS URL of the game server, e.g. "ws://192.168.1.20:8787". Defaults to the
   * page's own hostname on port 8787 so it works out of the box on the same
   * machine and, once set, lets real phones on the LAN reach the server too. */
  readonly VITE_WS_URL?: string;
  /** Base URL of the mobile app, e.g. "https://grille-mobile.onrender.com". Used to
   * build the QR code's target URL. Defaults to the page's own hostname on port
   * 5174 so it works out of the box for local/LAN play. */
  readonly VITE_MOBILE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
