/** Generates a 4-digit room code, avoiding any code already present in `taken`. */
export function generateRoomCode(taken: ReadonlySet<string>): string {
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    if (!taken.has(code)) return code;
  }
  throw new Error("could not allocate a free room code");
}
