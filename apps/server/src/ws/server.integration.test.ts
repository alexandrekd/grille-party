import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";
import { WebSocket } from "ws";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TRAITS } from "@grille/shared";
import { RoomManager } from "../rooms/RoomManager.js";
import { startWsServer } from "./server.js";

/** Thin test client: queues every parsed JSON frame and exposes a promise-based
 * `waitFor` so tests can assert on message *sequences*, not just the latest one. */
class TestClient {
  readonly frames: Record<string, unknown>[] = [];
  private waiters: { pred: (m: Record<string, unknown>) => boolean; resolve: (m: Record<string, unknown>) => void }[] = [];

  constructor(private readonly ws: WebSocket) {
    ws.on("message", (data) => {
      const msg = JSON.parse(String(data)) as Record<string, unknown>;
      this.frames.push(msg);
      this.waiters = this.waiters.filter((w) => {
        if (w.pred(msg)) {
          w.resolve(msg);
          return false;
        }
        return true;
      });
    });
  }

  send(msg: Record<string, unknown>): void {
    this.ws.send(JSON.stringify(msg));
  }

  waitFor(pred: (m: Record<string, unknown>) => boolean, timeoutMs = 2000): Promise<Record<string, unknown>> {
    const already = this.frames.find(pred);
    if (already) return Promise.resolve(already);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("waitFor timed out")), timeoutMs);
      this.waiters.push({
        pred,
        resolve: (m) => {
          clearTimeout(timer);
          resolve(m);
        },
      });
    });
  }

  close(): void {
    this.ws.close();
  }
}

function connect(port: number, path: string): Promise<TestClient> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
    ws.once("open", () => resolve(new TestClient(ws)));
    ws.once("error", reject);
  });
}

describe("WS server integration", () => {
  let httpServer: Server;
  let port: number;

  beforeEach(async () => {
    httpServer = createServer();
    startWsServer(httpServer, new RoomManager());
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it("never delivers a voterId/choiceId to the host socket before a round resolves, and does deliver them after", async () => {
    const host = await connect(port, "/ws/host");
    host.send({ type: "host_join" });
    const registered = await host.waitFor((m) => m.type === "host_registered");
    const roomCode = registered["roomCode"] as string;

    const p1 = await connect(port, "/ws/player");
    p1.send({ type: "join_room", roomCode, playerName: "Ava" });
    const joined1 = await p1.waitFor((m) => m.type === "joined");
    const p1Id = joined1["playerId"] as string;

    const p2 = await connect(port, "/ws/player");
    p2.send({ type: "join_room", roomCode, playerName: "Noé" });
    const joined2 = await p2.waitFor((m) => m.type === "joined");
    const p2Id = joined2["playerId"] as string;

    p1.send({ type: "submit_traits", traits: DEFAULT_TRAITS, name: "Ava" });
    p2.send({ type: "submit_traits", traits: DEFAULT_TRAITS, name: "Noé" });
    await p1.waitFor((m) => m.type === "room_state" && (m as { allReady?: boolean }).allReady === true);

    host.send({ type: "host_start_game", maxRounds: 1 });
    const voting = await host.waitFor((m) => m.type === "room_state" && (m as { phase?: string }).phase === "VOTING");
    const round = (voting as { round: { roundId: string } }).round;

    // --- The property under test: scan every frame the host has received so far
    // (through VOTING, before either vote is in) for a leaked voterId/choiceId.
    const preResolutionHostFrames = [...host.frames];
    for (const frame of preResolutionHostFrames) {
      expect(frame).not.toHaveProperty("votes");
      expect(JSON.stringify(frame)).not.toContain("voterId");
      expect(JSON.stringify(frame)).not.toContain("choiceId");
    }

    // Now resolve the round and confirm the host *does* get vote detail afterward
    // (proving the assertion above is meaningful, not just "nothing ever arrives").
    p1.send({ type: "submit_vote", roundId: round.roundId, votedForPlayerId: p2Id });
    p2.send({ type: "submit_vote", roundId: round.roundId, votedForPlayerId: p2Id });

    const resolved = await host.waitFor((m) => m.type === "round_resolved");
    expect(resolved).toHaveProperty("votes");
    const votes = resolved["votes"] as { voterId: string; choiceId: string | null }[];
    expect(votes.find((v) => v.voterId === p1Id)?.choiceId).toBe(p2Id);

    host.close();
    p1.close();
    p2.close();
  });
});
