import { createServer } from "node:http";
import { RoomManager } from "./rooms/RoomManager.js";
import { startWsServer } from "./ws/server.js";
import { createHttpHandler, type HttpDeps } from "./http/router.js";

const PORT = Number(process.env["PORT"] ?? 8787);

const clientId = process.env["SPOTIFY_CLIENT_ID"];
const clientSecret = process.env["SPOTIFY_CLIENT_SECRET"];
const spotify = clientId && clientSecret ? { clientId, clientSecret } : null;
if (!spotify) {
  console.warn(
    "[server] SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET not set — Spotify OAuth routes disabled, falling back to the stub track pool.",
  );
}

const roomManager = new RoomManager();

const httpDeps: HttpDeps = {
  roomManager,
  spotify,
  publicServerUrl: process.env["PUBLIC_SERVER_URL"] ?? `http://localhost:${PORT}`,
  publicMobileUrl: process.env["PUBLIC_MOBILE_URL"] ?? "http://localhost:5174",
  publicHostUrl: process.env["PUBLIC_HOST_URL"] ?? "http://localhost:5173",
};

const httpServer = createServer(createHttpHandler(httpDeps));

startWsServer(httpServer, roomManager);

httpServer.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (ws paths: /ws/host, /ws/player)`);
});
