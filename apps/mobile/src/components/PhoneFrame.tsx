import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function PhoneFrame({ bg, children }: { bg: string; children: ReactNode }) {
  const time = useClock();
  return (
    <div
      style={{
        position: "relative",
        width: 390,
        height: 844,
        borderRadius: 52,
        background: "#100C16",
        border: "9px solid #241A2E",
        overflow: "hidden",
        boxShadow: "0 26px 60px rgba(0,0,0,.6)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: bg }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 16,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 30px",
          font: "700 14px 'Nunito',sans-serif",
          color: "#8E7F92",
        }}
      >
        <span>{time}</span>
        <span>••• ▮</span>
      </div>
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
