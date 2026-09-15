import { Room } from "./Room.js";
import { generateRoomCode } from "../util/roomCode.js";

export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  createRoom(): Room {
    const code = generateRoomCode(new Set(this.rooms.keys()));
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | null {
    return this.rooms.get(code) ?? null;
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  get size(): number {
    return this.rooms.size;
  }

  all(): Room[] {
    return [...this.rooms.values()];
  }
}
