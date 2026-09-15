import {
  POINTS_CORRECT_FIRST,
  POINTS_CORRECT_STEP,
  POINTS_CORRECT_MIN,
  POINTS_OWNER_WRONG,
  POINTS_UNNOTICED_BONUS_PER_MISSED_VOTER,
  type ScoreDelta,
} from "@grille/shared";

export interface RoundScoringInput {
  ownerPlayerId: string;
  /** Every player expected to vote this round, owner included. */
  allPlayerIds: readonly string[];
  /** voterId -> chosen playerId, in submission order (a `Map` preserves insertion
   * order, and a vote can no longer be resubmitted once cast — see
   * Room.submitVote) — that order is what ranks correct guesses by speed. A
   * missing entry means "did not vote" (timeout). */
  votes: ReadonlyMap<string, string>;
}

/** 1st correct guess scores POINTS_CORRECT_FIRST, then -POINTS_CORRECT_STEP per
 * rank, floored at POINTS_CORRECT_MIN — faster correct answers score more. */
function pointsForCorrectRank(rank: number): number {
  return Math.max(POINTS_CORRECT_FIRST - (rank - 1) * POINTS_CORRECT_STEP, POINTS_CORRECT_MIN);
}

/**
 * Pure scoring function — computed once per round, only after all votes are in (or
 * the track finished playing):
 *   - non-owner correct guess: ranked by how fast it was cast among this round's
 *     correct guessers (see pointsForCorrectRank)
 *   - non-owner wrong guess (or no vote): 0
 *   - owner votes correctly for themself: 0
 *   - owner votes for someone else: -10
 *   - owner "passe inaperçu" bonus: +5 per non-owner voter who did NOT pick the
 *     owner — a timed-out non-voter counts toward this bonus and scores 0
 *     themself (stated assumption; not specified in the brief).
 *
 * Returns one delta per scoring event rather than pre-summed totals, so callers
 * (the reveal screen, the mobile round-result screen) can show *why* a player's
 * score changed, not just by how much.
 */
export function computeRoundScoring({
  ownerPlayerId,
  allPlayerIds,
  votes,
}: RoundScoringInput): ScoreDelta[] {
  const deltas: ScoreDelta[] = [];
  let missedVoters = 0;
  let correctRank = 0;

  // Submission order (see the `votes` doc comment above) is what makes this a
  // speed ranking rather than a fixed per-correct-guess amount.
  for (const [voterId, choice] of votes) {
    if (voterId === ownerPlayerId) continue;
    if (choice === ownerPlayerId) {
      correctRank += 1;
      deltas.push({ playerId: voterId, delta: pointsForCorrectRank(correctRank), reason: "correct_guess" });
    } else {
      deltas.push({ playerId: voterId, delta: 0, reason: "wrong_guess" });
      missedVoters += 1;
    }
  }
  for (const playerId of allPlayerIds) {
    if (playerId === ownerPlayerId || votes.has(playerId)) continue;
    deltas.push({ playerId, delta: 0, reason: "wrong_guess" });
    missedVoters += 1;
  }

  const ownerVotedCorrectly = votes.get(ownerPlayerId) === ownerPlayerId;
  deltas.push({
    playerId: ownerPlayerId,
    delta: ownerVotedCorrectly ? 0 : POINTS_OWNER_WRONG,
    reason: ownerVotedCorrectly ? "self_correct" : "self_wrong",
  });

  if (missedVoters > 0) {
    deltas.push({
      playerId: ownerPlayerId,
      delta: missedVoters * POINTS_UNNOTICED_BONUS_PER_MISSED_VOTER,
      reason: "unnoticed_bonus",
    });
  }

  return deltas;
}

/** Sums per-player deltas into new totals given the previous scores. */
export function applyScoreDeltas(
  previousScores: ReadonlyMap<string, number>,
  deltas: readonly ScoreDelta[],
): Map<string, number> {
  const next = new Map(previousScores);
  for (const d of deltas) {
    next.set(d.playerId, (next.get(d.playerId) ?? 0) + d.delta);
  }
  return next;
}
