import type { CSSProperties, ReactNode } from "react";

export function Dancefloor({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: 1280,
        height: 720,
        borderRadius: 28,
        overflow: "hidden",
        background: "#171220",
        boxShadow: "0 30px 70px rgba(0,0,0,.6)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: bg }} />
      {children}
    </div>
  );
}

export function GlowSpot({ style }: { style: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        filter: "blur(12px)",
        transformOrigin: "50% 0",
        ...style,
      }}
    />
  );
}

export function Halo({ style }: { style: CSSProperties }) {
  return <div style={{ position: "absolute", borderRadius: "50%", ...style }} />;
}

export function FloorGrid({
  height,
  alpha,
  duration,
}: {
  height: number;
  alpha: number;
  duration?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height,
        background: `repeating-linear-gradient(90deg,rgba(255,243,232,${alpha}) 0 2px,transparent 2px 72px),repeating-linear-gradient(0deg,rgba(255,243,232,${alpha}) 0 2px,transparent 2px 64px)`,
        transform: "perspective(620px) rotateX(64deg)",
        transformOrigin: "bottom",
        animation: duration ? `tilepulse ${duration}s infinite alternate ease-in-out` : undefined,
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
