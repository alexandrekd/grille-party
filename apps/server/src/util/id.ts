import { randomUUID } from "node:crypto";

export function newId(): string {
  return randomUUID();
}

export function newRejoinToken(): string {
  return randomUUID();
}
