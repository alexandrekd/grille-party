import type { CSSProperties } from "react";

const COLORS = ["#FF6B5A", "#FFB34D", "#F7A8B8", "#FFF3E8"];

/** Ported verbatim from the inline `conf` array literal in
 * `project/Grille - Ecrans mobiles.dc.html` (waiting-room screen). */
export function mobileConfetti(count = 8): CSSProperties[] {
  return Array.from({ length: count }, (_, i) => ({
    position: "absolute" as const,
    top: -40,
    left: `${8 + i * 11}%`,
    width: 9,
    height: 5 + (i % 3) * 4,
    borderRadius: 3,
    background: COLORS[i % COLORS.length],
    animation: `mfall ${(3 + (i % 4) * 0.7).toFixed(1)}s ${(-i * 0.6).toFixed(1)}s infinite linear`,
  }));
}
