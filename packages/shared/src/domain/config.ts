/** Timing/game defaults — not specified in the brief, tuned for a lively but readable
 * living-room pace. Client-side countdown UI derives from the pushed deadline
 * timestamps rather than re-implementing these constants, so this file is the single
 * source of truth. */
export const DEFAULT_MAX_ROUNDS = 8;
export const VOTE_WINDOW_MS = 20_000;
export const REVEAL_DISPLAY_MS = 7_000;
export const LEADERBOARD_DISPLAY_MS = 7_000;
export const POINTS_CORRECT_GUESS = 10;
export const POINTS_OWNER_WRONG = -10;
export const POINTS_UNNOTICED_BONUS_PER_MISSED_VOTER = 5;
