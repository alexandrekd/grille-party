import type { WebSocket } from "ws";
import { encodeMessage, type HostBoundMessage, type PlayerBoundMessage } from "@grille/shared";

export type ConnectionRole = "host" | "player";

/** Per-connection routing metadata, kept separate from `Room` so `Room` stays a
 * plain, transport-agnostic state machine. */
export interface ConnMeta {
  role: ConnectionRole;
  roomCode: string | null;
  playerId: string | null;
}

export function sendHost(raw: WebSocket, msg: HostBoundMessage): void {
  if (raw.readyState === raw.OPEN) raw.send(encodeMessage(msg));
}

export function sendPlayer(raw: WebSocket, msg: PlayerBoundMessage): void {
  if (raw.readyState === raw.OPEN) raw.send(encodeMessage(msg));
}
