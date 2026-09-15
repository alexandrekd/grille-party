import type { CSSProperties } from "react";

const COLORS = ["#FF6B5A", "#FFB34D", "#F7A8B8", "#FFF3E8", "#E8553F"];

export interface ConfettiOptions {
  round?: boolean;
  spread?: [number, number];
}

/** Ported verbatim (same LCG RNG) from the `conf()` helper in
 * `project/Grille - Identite visuelle.dc.html` so seeded confetti looks identical
 * to the source mockup's falling-particle fields. */
export function confettiParticles(n: number, seed: number, opts: ConfettiOptions = {}): CSSProperties[] {
  const out: CSSProperties[] = [];
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) {
    const w = 8 + Math.round(rnd() * 9);
    const h = opts.round ? w : 5 + Math.round(rnd() * 8);
    const left = opts.spread ? opts.spread[0] + rnd() * (opts.spread[1] - opts.spread[0]) : rnd() * 100;
    const dur = (2.6 + rnd() * 2.8).toFixed(2);
    const del = (-rnd() * 5).toFixed(2);
    out.push({
      position: "absolute",
      top: -60,
      left: `${left.toFixed(1)}%`,
      width: w,
      height: h,
      borderRadius: opts.round ? "50%" : 3,
      background: COLORS[Math.floor(rnd() * COLORS.length)],
      opacity: 0.9,
      animation: `fall ${dur}s ${del}s infinite linear`,
    });
  }
  return out;
}
