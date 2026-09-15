/** Timing/game defaults — not specified in the brief, tuned for a lively but readable
 * living-room pace. Client-side countdown UI derives from the pushed deadline
 * timestamps rather than re-implementing these constants, so this file is the single
 * source of truth. */
export const DEFAULT_MAX_ROUNDS = 8;
/** A round's voting window is the track's own duration (see Room.startNextRound) —
 * these only bound that: a floor in case a real track is oddly short, and the
 * window used for stub/fixture tracks whose real duration is unknown. */
export const MIN_VOTE_WINDOW_MS = 15_000;
export const FALLBACK_TRACK_DURATION_MS = 20_000;
export const REVEAL_DISPLAY_MS = 7_000;
export const LEADERBOARD_DISPLAY_MS = 7_000;
/** A correct guess scores by how fast it was cast relative to other correct
 * guessers this round (1st correct = POINTS_CORRECT_FIRST, then -STEP per rank,
 * floored at POINTS_CORRECT_MIN) — see computeRoundScoring. */
export const POINTS_CORRECT_FIRST = 10;
export const POINTS_CORRECT_STEP = 2;
export const POINTS_CORRECT_MIN = 2;
export const POINTS_OWNER_WRONG = -10;
export const POINTS_UNNOTICED_BONUS_PER_MISSED_VOTER = 5;
