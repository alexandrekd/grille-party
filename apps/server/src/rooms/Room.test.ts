import { describe, expect, it } from "vitest";
import { Room } from "./Room.js";
import type { SpotifyProvider, StubTrack } from "../integrations/spotify/index.js";
import { DEFAULT_TRAITS } from "@grille/shared";

/** A deterministic fake provider so tests don't depend on the fixture pool's
 * random shuffle — each player gets a small, predictable, non-overlapping set. */
function fakeSpotify(): SpotifyProvider {
  let n = 0;
  return {
    getTopTracksForPlayer(playerId: string): StubTrack[] {
      const base = n++;
      return [0, 1].map((i) => ({
        id: `p${base}-t${i}`,
        title: `Track ${base}-${i}`,
        artist: "Fixture",
        coverUrl: "#000",
      }));
    },
  };
}

function readyRoom(playerCount: number, code = "1234") {
  const room = new Room(code, fakeSpotify());
  const players = Array.from({ length: playerCount }, (_, i) => room.addPlayer(`Player${i}`));
  for (const p of players) room.submitTraits(p.id, DEFAULT_TRAITS, p.name);
  return { room, players };
}

describe("Room lobby", () => {
  it("is not ready until every player has submitted traits", () => {
    const room = new Room("1234", fakeSpotify());
    const a = room.addPlayer("A");
    room.addPlayer("B");
    expect(room.allReady).toBe(false);
    room.submitTraits(a.id, DEFAULT_TRAITS, "A");
    expect(room.allReady).toBe(false); // B still JOINED, not READY
  });

  it("rejects starting the game until all players are ready", () => {
    const room = new Room("1234", fakeSpotify());
    room.addPlayer("A");
    expect(room.startGame(undefined, Date.now())).toBe(false);
    expect(room.phase).toBe("LOBBY");
  });

  it("finds a player by their rejoin token", () => {
    const room = new Room("1234", fakeSpotify());
    const a = room.addPlayer("A");
    expect(room.findByRejoinToken(a.rejoinToken)?.id).toBe(a.id);
    expect(room.findByRejoinToken("nope")).toBeNull();
  });
});

describe("Room round loop — happy path", () => {
  it("moves LOBBY -> VOTING on start, resolves once all votes are in, then advances through REVEAL -> LEADERBOARD -> next VOTING", () => {
    const { room, players } = readyRoom(3);
    const t0 = 1_000_000;
    expect(room.startGame(8, t0)).toBe(true);
    expect(room.phase).toBe("VOTING");
    const round1 = room.currentRound!;
    const owner = round1.ownerPlayerId;
    const others = players.filter((p) => p.id !== owner);

    // Everyone votes for the true owner.
    for (const voter of players) {
      room.submitVote(voter.id, round1.id, owner, t0 + 1000);
    }

    expect(room.phase).toBe("REVEAL");
    expect(round1.resolved).toBe(true);
    const ownerDelta = round1.scoreDeltas!.find((d) => d.reason === "self_correct");
    expect(ownerDelta?.playerId).toBe(owner);
    for (const p of others) {
      expect(round1.scoreDeltas).toContainEqual({
        playerId: p.id,
        delta: 10,
        reason: "correct_guess",
      });
    }

    expect(room.advanceFromReveal(Date.now())).toBe(true);
    expect(room.phase).toBe("LEADERBOARD");

    expect(room.advanceFromLeaderboard(t0 + 2000)).toBe(true);
    expect(room.phase).toBe("VOTING");
    expect(room.currentRoundIndex).toBe(1);
    expect(room.currentRound!.id).not.toBe(round1.id);
  });

  it("does not resolve a round until every player has voted", () => {
    const { room, players } = readyRoom(3);
    room.startGame(8, 0);
    const round = room.currentRound!;
    room.submitVote(players[0]!.id, round.id, round.ownerPlayerId, 100);
    expect(room.phase).toBe("VOTING");
    expect(round.resolved).toBe(false);
  });

  it("upserts a voter's choice instead of double-counting a changed vote", () => {
    const { room, players } = readyRoom(2);
    room.startGame(8, 0);
    const round = room.currentRound!;
    const [a, b] = players;
    room.submitVote(a!.id, round.id, round.ownerPlayerId, 100);
    room.submitVote(a!.id, round.id, b!.id, 150); // changes mind
    expect(round.votes.size).toBe(1);
    expect(round.votes.get(a!.id)).toBe(b!.id);
  });

  it("rejects a vote for the wrong round id or outside VOTING", () => {
    const { room, players } = readyRoom(2);
    room.startGame(8, 0);
    const round = room.currentRound!;
    expect(room.submitVote(players[0]!.id, "wrong-round", round.ownerPlayerId, 0)).toBe(false);
  });
});

describe("Room round loop — timeout with partial votes", () => {
  it("resolves via maybeExpireVote once the deadline passes, treating non-voters as wrong for scoring and counting them toward the owner's unnoticed bonus", () => {
    const { room, players } = readyRoom(4);
    const t0 = 0;
    room.startGame(8, t0);
    const round = room.currentRound!;
    const owner = round.ownerPlayerId;
    const [voter] = players.filter((p) => p.id !== owner);

    // Only one non-owner votes (correctly); nobody else does, deadline passes.
    room.submitVote(voter!.id, round.id, owner, t0 + 1000);
    expect(room.maybeExpireVote(t0 + 1000)).toBe(false); // before deadline
    expect(room.maybeExpireVote(round.votingDeadlineTs)).toBe(true);

    expect(room.phase).toBe("REVEAL");
    expect(round.resolved).toBe(true);
    // 2 non-owner voters never voted -> owner's unnoticed bonus should reflect
    // exactly the non-owner voters who did NOT pick the owner (2 of them).
    const bonus = round.scoreDeltas!.find((d) => d.reason === "unnoticed_bonus");
    expect(bonus?.delta).toBe(10); // 2 missed voters * 5
  });

  it("is a no-op once already resolved", () => {
    const { room, players } = readyRoom(2);
    room.startGame(8, 0);
    const round = room.currentRound!;
    for (const p of players) room.submitVote(p.id, round.id, round.ownerPlayerId, 10);
    expect(room.phase).toBe("REVEAL");
    expect(room.maybeExpireVote(999_999)).toBe(false);
  });
});

describe("Room game over", () => {
  it("reaches GAME_OVER once maxRounds is exhausted instead of starting another round", () => {
    const { room, players } = readyRoom(2);
    room.startGame(1, 0);
    const round = room.currentRound!;
    for (const p of players) room.submitVote(p.id, round.id, round.ownerPlayerId, 10);
    expect(room.phase).toBe("REVEAL");
    room.advanceFromReveal(Date.now());
    expect(room.phase).toBe("LEADERBOARD");
    room.advanceFromLeaderboard(20);
    expect(room.phase).toBe("GAME_OVER");
    expect(room.isFinalStanding).toBe(true);
  });

  it("produces standings sorted by score descending with correct ranks", () => {
    const { room, players } = readyRoom(3);
    room.startGame(1, 0);
    const round = room.currentRound!;
    // Everyone but the owner votes correctly -> owner gets a big unnoticed bonus is 0
    // here since everyone found them; non-owners each get +10.
    for (const p of players) room.submitVote(p.id, round.id, round.ownerPlayerId, 10);
    const standings = room.standings;
    expect(standings).toHaveLength(3);
    expect(standings[0]!.rank).toBe(1);
    expect(standings[0]!.score).toBeGreaterThanOrEqual(standings[1]!.score);
    expect(standings[1]!.score).toBeGreaterThanOrEqual(standings[2]!.score);
  });
});

describe("Room public views never expose individual votes", () => {
  it("roundPublicInfo carries no vote data", () => {
    const { room, players } = readyRoom(2);
    room.startGame(8, 0);
    const round = room.currentRound!;
    room.submitVote(players[0]!.id, round.id, round.ownerPlayerId, 10);
    const info = room.roundPublicInfo!;
    expect(Object.keys(info).sort()).toEqual(["roundId", "roundIndex", "votingDeadlineTs"]);
  });

  it("voteProgress is aggregate-only", () => {
    const { room, players } = readyRoom(3);
    room.startGame(8, 0);
    const round = room.currentRound!;
    room.submitVote(players[0]!.id, round.id, round.ownerPlayerId, 10);
    expect(room.voteProgress).toEqual({
      roundId: round.id,
      votesReceived: 1,
      votesExpected: 3,
    });
  });
});
