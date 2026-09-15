import { describe, expect, it } from "vitest";
import { applyScoreDeltas, computeRoundScoring } from "./scoring.js";

describe("computeRoundScoring", () => {
  it("awards +10 to each non-owner voter who guessed correctly", () => {
    const deltas = computeRoundScoring({
      ownerPlayerId: "owner",
      allPlayerIds: ["owner", "a", "b"],
      votes: new Map([
        ["a", "owner"],
        ["b", "owner"],
        ["owner", "owner"],
      ]),
    });
    expect(deltas).toContainEqual({ playerId: "a", delta: 10, reason: "correct_guess" });
    expect(deltas).toContainEqual({ playerId: "b", delta: 10, reason: "correct_guess" });
  });

  it("gives 0 to a non-owner voter who guessed wrong", () => {
    const deltas = computeRoundScoring({
      ownerPlayerId: "owner",
      allPlayerIds: ["owner", "a"],
      votes: new Map([
        ["a", "someone-else"],
        ["owner", "owner"],
      ]),
    });
    expect(deltas).toContainEqual({ playerId: "a", delta: 0, reason: "wrong_guess" });
  });

  it("gives 0 to a non-owner who never voted (timeout)", () => {
    const deltas = computeRoundScoring({
      ownerPlayerId: "owner",
      allPlayerIds: ["owner", "a"],
      votes: new Map([["owner", "owner"]]),
    });
    expect(deltas).toContainEqual({ playerId: "a", delta: 0, reason: "wrong_guess" });
  });

  it("gives the owner 0 when they vote correctly for themself", () => {
    const deltas = computeRoundScoring({
      ownerPlayerId: "owner",
      allPlayerIds: ["owner", "a"],
      votes: new Map([
        ["owner", "owner"],
        ["a", "owner"],
      ]),
    });
    expect(deltas).toContainEqual({ playerId: "owner", delta: 0, reason: "self_correct" });
  });

  it("gives the owner -10 when they vote for someone else", () => {
    const deltas = computeRoundScoring({
      ownerPlayerId: "owner",
      allPlayerIds: ["owner", "a"],
      votes: new Map([
        ["owner", "a"],
        ["a", "owner"],
      ]),
    });
    expect(deltas).toContainEqual({ playerId: "owner", delta: -10, reason: "self_wrong" });
  });

  it("gives the owner -10 (self_wrong) when they never vote", () => {
    const deltas = computeRoundScoring({
      ownerPlayerId: "owner",
      allPlayerIds: ["owner", "a"],
      votes: new Map([["a", "owner"]]),
    });
    expect(deltas).toContainEqual({ playerId: "owner", delta: -10, reason: "self_wrong" });
  });

  it("awards the owner +5 per non-owner voter who did NOT pick them ('passe inaperçu')", () => {
    // 4 non-owner voters: 1 correct, 2 wrong, 1 no-vote -> 3 missed the owner -> +15
    const deltas = computeRoundScoring({
      ownerPlayerId: "owner",
      allPlayerIds: ["owner", "a", "b", "c", "d"],
      votes: new Map([
        ["owner", "owner"],
        ["a", "owner"],
        ["b", "c"],
        ["c", "d"],
        // d: no vote
      ]),
    });
    expect(deltas).toContainEqual({
      playerId: "owner",
      delta: 15,
      reason: "unnoticed_bonus",
    });
  });

  it("omits the unnoticed_bonus delta when every non-owner voter found the owner", () => {
    const deltas = computeRoundScoring({
      ownerPlayerId: "owner",
      allPlayerIds: ["owner", "a", "b"],
      votes: new Map([
        ["owner", "owner"],
        ["a", "owner"],
        ["b", "owner"],
      ]),
    });
    expect(deltas.some((d) => d.reason === "unnoticed_bonus")).toBe(false);
  });

  it("computes a realistic 5-player round end to end", () => {
    // owner correct-self, 2 correct guessers, 1 wrong, 1 no-vote
    const deltas = computeRoundScoring({
      ownerPlayerId: "salome",
      allPlayerIds: ["salome", "marin", "ava", "theo", "kenza"],
      votes: new Map([
        ["salome", "salome"],
        ["marin", "salome"],
        ["ava", "salome"],
        ["theo", "marin"],
        // kenza: no vote
      ]),
    });
    const byPlayer = Object.fromEntries(
      deltas.map((d) => [d.playerId + ":" + d.reason, d.delta]),
    );
    expect(byPlayer["marin:correct_guess"]).toBe(10);
    expect(byPlayer["ava:correct_guess"]).toBe(10);
    expect(byPlayer["theo:wrong_guess"]).toBe(0);
    expect(byPlayer["kenza:wrong_guess"]).toBe(0);
    expect(byPlayer["salome:self_correct"]).toBe(0);
    // theo + kenza missed the owner -> +10 bonus
    expect(byPlayer["salome:unnoticed_bonus"]).toBe(10);
  });
});

describe("applyScoreDeltas", () => {
  it("sums multiple deltas for the same player onto their previous score", () => {
    const previous = new Map([["owner", 50]]);
    const next = applyScoreDeltas(previous, [
      { playerId: "owner", delta: -10, reason: "self_wrong" },
      { playerId: "owner", delta: 15, reason: "unnoticed_bonus" },
    ]);
    expect(next.get("owner")).toBe(55);
  });

  it("defaults an unseen player's previous score to 0", () => {
    const next = applyScoreDeltas(new Map(), [
      { playerId: "a", delta: 10, reason: "correct_guess" },
    ]);
    expect(next.get("a")).toBe(10);
  });

  it("does not mutate the previous scores map", () => {
    const previous = new Map([["a", 5]]);
    applyScoreDeltas(previous, [{ playerId: "a", delta: 10, reason: "correct_guess" }]);
    expect(previous.get("a")).toBe(5);
  });
});
