import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TRAITS } from "@grille/shared";
import { RoomManager } from "../rooms/RoomManager.js";
import { createHttpHandler } from "./router.js";

describe("/room/sync (HTTP polling backstop)", () => {
  let httpServer: Server;
  let port: number;
  let roomManager: RoomManager;

  beforeEach(async () => {
    roomManager = new RoomManager();
    httpServer = createServer(
      createHttpHandler({
        roomManager,
        spotify: null,
        publicServerUrl: "http://localhost",
        publicMobileUrl: "http://localhost",
        publicHostUrl: "http://localhost",
      }),
    );
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  async function sync(roomCode: string, playerId?: string): Promise<{ status: number; body: unknown }> {
    const url = `http://127.0.0.1:${port}/room/sync?roomCode=${roomCode}${playerId ? `&playerId=${playerId}` : ""}`;
    const res = await fetch(url);
    return { status: res.status, body: await res.json() };
  }

  it("404s for an unknown room code", async () => {
    const { status, body } = await sync("0000");
    expect(status).toBe(404);
    expect(body).toEqual({ error: "room_not_found" });
  });

  it("reflects the room's current phase, vote progress, and a player's own vote without needing the WebSocket", async () => {
    const room = roomManager.createRoom();
    const a = room.addPlayer("Ava");
    const b = room.addPlayer("Noé");
    room.submitTraits(a.id, DEFAULT_TRAITS, "Ava");
    room.submitTraits(b.id, DEFAULT_TRAITS, "Noé");

    const beforeStart = await sync(room.code, a.id);
    expect((beforeStart.body as { roomState: { phase: string } }).roomState.phase).toBe("LOBBY");

    room.startGame(8, Date.now());
    const round = room.currentRound!;

    const midVoting = await sync(room.code, a.id);
    const midBody = midVoting.body as {
      roomState: { phase: string };
      voteProgress: { votesReceived: number; votesExpected: number } | null;
      myVote: string | null;
    };
    expect(midBody.roomState.phase).toBe("VOTING");
    expect(midBody.voteProgress).toEqual({ type: "vote_progress", roundId: round.id, votesReceived: 0, votesExpected: 2 });
    expect(midBody.myVote).toBeNull();

    room.submitVote(a.id, round.id, round.ownerPlayerId, Date.now());
    const afterVote = await sync(room.code, a.id);
    const afterBody = afterVote.body as { myVote: string | null; roundResolved: unknown };
    expect(afterBody.myVote).toBe(round.ownerPlayerId);
    expect(afterBody.roundResolved).toBeNull(); // b hasn't voted yet, round isn't resolved

    room.submitVote(b.id, round.id, round.ownerPlayerId, Date.now());
    const afterResolve = await sync(room.code, a.id);
    const resolvedBody = afterResolve.body as { roomState: { phase: string }; roundResolved: { votes: unknown[] } | null };
    expect(resolvedBody.roomState.phase).toBe("REVEAL");
    expect(resolvedBody.roundResolved).not.toBeNull();
    expect(resolvedBody.roundResolved?.votes.length).toBe(2);
  });
});
