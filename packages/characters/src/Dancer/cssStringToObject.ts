import type { CSSProperties } from "react";

function kebabToCamel(prop: string): string {
  return prop.replace(/-([a-z])/g, (_match, c: string) => c.toUpperCase());
}

/**
 * Parses a `"left:9px;bottom:172px;border-radius:50%"` inline-style string (the
 * format the ported `computeDancerStyles` values are authored in, matching the
 * source prototype byte-for-byte) into a React `CSSProperties` object. Kept as a
 * small runtime parser — rather than hand-retyping ~40 ported style strings into
 * object literals — so the ported data stays identical to the verified source.
 */
export function cssStringToObject(css: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of css.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const rawProp = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!rawProp || !value) continue;
    const prop = rawProp.startsWith("--") ? rawProp : kebabToCamel(rawProp);
    out[prop] = value;
  }
  return out as CSSProperties;
}
