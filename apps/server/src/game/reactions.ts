import type { Reaction, ReactionAssignment } from "@grille/shared";

const CORRECT_REACTIONS: Reaction[] = ["surprise", "laugh"];
const WRONG_REACTIONS: Reaction[] = ["dodge", "sad"];

/**
 * Computed once, server-side, at resolution time so the host reveal screen and
 * every mobile round-result screen agree on which non-owner dancer reacts how
 * (surprise/laugh if they guessed correctly, dodge/sad if not) — no client-side
 * randomness to get out of sync. The owner always gets `caught`.
 */
export function computeReactionAssignments(
  ownerPlayerId: string,
  allPlayerIds: readonly string[],
  votes: ReadonlyMap<string, string>,
): ReactionAssignment[] {
  const out: ReactionAssignment[] = [{ playerId: ownerPlayerId, reaction: "caught" }];
  let correctIdx = 0;
  let wrongIdx = 0;
  for (const playerId of allPlayerIds) {
    if (playerId === ownerPlayerId) continue;
    const correct = votes.get(playerId) === ownerPlayerId;
    if (correct) {
      out.push({ playerId, reaction: CORRECT_REACTIONS[correctIdx % CORRECT_REACTIONS.length]! });
      correctIdx += 1;
    } else {
      out.push({ playerId, reaction: WRONG_REACTIONS[wrongIdx % WRONG_REACTIONS.length]! });
      wrongIdx += 1;
    }
  }
  return out;
}
