export type ConnectionRole = "host" | "player";

export const WS_PATHS: Record<ConnectionRole, string> = {
  host: "/ws/host",
  player: "/ws/player",
};

export function encodeMessage(message: unknown): string {
  return JSON.stringify(message);
}

/** Best-effort parse — returns null on malformed frames instead of throwing, since a
 * malformed frame from a flaky phone connection shouldn't crash the room. */
export function decodeMessage<T extends { type: string }>(raw: string): T | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      typeof (parsed as { type?: unknown }).type === "string"
    ) {
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
}
