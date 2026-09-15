const STORAGE_KEY = "grille-rejoin";

export interface StoredRejoin {
  roomCode: string;
  rejoinToken: string;
}

/** localStorage can throw (private browsing, disabled storage) or just be empty —
 * both are fine, they just mean "no rejoin available", not an error to surface. */
export function loadStoredRejoin(): StoredRejoin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as StoredRejoin).roomCode === "string" &&
      typeof (parsed as StoredRejoin).rejoinToken === "string"
    ) {
      return parsed as StoredRejoin;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredRejoin(v: StoredRejoin): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    // ignore — worst case, a reload requires re-entering the room code.
  }
}

export function clearStoredRejoin(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
