import type { CSSProperties, ReactNode } from "react";

/** Just a positioning canvas for the screens' absolutely-positioned layouts — the
 * rounded bezel/border and fake clock+signal status bar were how the static design
 * mockup showed "this is a phone screen" on a slide; they have no place in the
 * actual shipped app, which already runs inside a real phone (with its own real
 * status bar) or a real browser window. */
export function PhoneFrame({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: bg }} />
      {children}
    </div>
  );
}

export function GlowSpot({ style }: { style: CSSProperties }) {
  return <div style={{ position: "absolute", filter: "blur(10px)", transformOrigin: "50% 0", ...style }} />;
}

export function Halo({ style }: { style: CSSProperties }) {
  return <div style={{ position: "absolute", borderRadius: "50%", ...style }} />;
}

export function FloorGrid({ height, alpha, duration }: { height: number; alpha: number; duration?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height,
        background: `repeating-linear-gradient(90deg,rgba(255,243,232,${alpha}) 0 2px,transparent 2px 46px),repeating-linear-gradient(0deg,rgba(255,243,232,${alpha}) 0 2px,transparent 2px 40px)`,
        transform: "perspective(320px) rotateX(64deg)",
        transformOrigin: "bottom",
        animation: duration ? `mtile ${duration}s infinite alternate ease-in-out` : undefined,
      }}
    />
  );
}

export function Particles({ particles }: { particles: CSSProperties[] }) {
  return (
    <>
      {particles.map((s, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} style={s} />
      ))}
    </>
  );
}
