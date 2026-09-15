/** Purely cosmetic per-player desync so identical dance numbers don't line up —
 * the server doesn't track a "dance style" for players, this is derived client-side
 * from stable player order. */
export function danceFor(index: number): number {
  return (index % 6) + 1;
}

export function delayFor(index: number): string {
  return `-${(index * 0.13).toFixed(2)}s`;
}
