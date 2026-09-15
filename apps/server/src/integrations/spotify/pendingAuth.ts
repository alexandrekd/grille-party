import { randomUUID } from "node:crypto";

export interface PendingAuth {
  roomCode: string;
  playerId?: string;
  role: "player" | "host";
}

const TTL_MS = 10 * 60 * 1000;
const pending = new Map<string, { auth: PendingAuth; createdAt: number }>();

function sweep(): void {
  const now = Date.now();
  for (const [state, entry] of pending) {
    if (now - entry.createdAt > TTL_MS) pending.delete(state);
  }
}

/** Standard OAuth CSRF-state pattern: an opaque random token the server hands to
 * Spotify and expects back unmodified on the callback, looked up here to recover
 * which room/player/role this particular redirect belongs to (Spotify's redirect
 * carries no other context of ours). Single-use — consumed by `take`. */
export function createPendingAuth(auth: PendingAuth): string {
  sweep();
  const state = randomUUID();
  pending.set(state, { auth, createdAt: Date.now() });
  return state;
}

export function takePendingAuth(state: string): PendingAuth | null {
  const entry = pending.get(state);
  if (!entry) return null;
  pending.delete(state);
  if (Date.now() - entry.createdAt > TTL_MS) return null;
  return entry.auth;
}
