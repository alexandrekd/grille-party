import type { WebSocket } from "ws";
import type { ConnMeta } from "./connection.js";

/** Maps connectionId -> live socket + routing metadata. Kept outside `Room` so the
 * room/game state machine stays transport-agnostic and directly unit-testable. */
export class ConnectionRegistry {
  private readonly sockets = new Map<string, WebSocket>();
  private readonly meta = new Map<string, ConnMeta>();

  add(connectionId: string, raw: WebSocket, meta: ConnMeta): void {
    this.sockets.set(connectionId, raw);
    this.meta.set(connectionId, meta);
  }

  getSocket(connectionId: string): WebSocket | undefined {
    return this.sockets.get(connectionId);
  }

  getMeta(connectionId: string): ConnMeta | undefined {
    return this.meta.get(connectionId);
  }

  setMeta(connectionId: string, meta: ConnMeta): void {
    this.meta.set(connectionId, meta);
  }

  remove(connectionId: string): void {
    this.sockets.delete(connectionId);
    this.meta.delete(connectionId);
  }
}
