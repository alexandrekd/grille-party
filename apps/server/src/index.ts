import { createServer } from "node:http";
import { RoomManager } from "./rooms/RoomManager.js";
import { startWsServer } from "./ws/server.js";

const PORT = Number(process.env["PORT"] ?? 8787);

const roomManager = new RoomManager();

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: roomManager.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

startWsServer(httpServer, roomManager);

httpServer.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (ws paths: /ws/host, /ws/player)`);
});
