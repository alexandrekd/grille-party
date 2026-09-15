import {
  POINTS_CORRECT_GUESS,
  POINTS_OWNER_WRONG,
  POINTS_UNNOTICED_BONUS_PER_MISSED_VOTER,
  type ScoreDelta,
} from "@grille/shared";

export interface RoundScoringInput {
  ownerPlayerId: string;
  /** Every player expected to vote this round, owner included. */
  allPlayerIds: readonly string[];
  /** voterId -> chosen playerId. A missing entry means "did not vote" (timeout). */
  votes: ReadonlyMap<string, string>;
}

/**
 * Pure scoring function — computed once per round, only after all votes are in (or
 * the timer expired), per the cahier des charges:
 *   - non-owner correct guess: +10
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

  for (const playerId of allPlayerIds) {
    if (playerId === ownerPlayerId) continue;
    const choice = votes.get(playerId);
    if (choice === ownerPlayerId) {
      deltas.push({ playerId, delta: POINTS_CORRECT_GUESS, reason: "correct_guess" });
    } else {
      deltas.push({ playerId, delta: 0, reason: "wrong_guess" });
      missedVoters += 1;
    }
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
