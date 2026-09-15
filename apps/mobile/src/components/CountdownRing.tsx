import { useEffect, useState } from "react";

export function CountdownRing({
  deadlineTs,
  totalMs,
  size = 104,
  innerSize = 80,
  secondsFontSize = 34,
}: {
  deadlineTs: number;
  totalMs: number;
  size?: number;
  innerSize?: number;
  secondsFontSize?: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, deadlineTs - now);
  const frac = totalMs > 0 ? Math.min(1, remainingMs / totalMs) : 0;
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `conic-gradient(#FFB34D 0turn ${frac.toFixed(3)}turn, rgba(255,243,232,.14) ${frac.toFixed(3)}turn 1turn)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: "50%",
          background: "#1A1322",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ font: `700 ${secondsFontSize}px 'Fredoka',sans-serif`, color: "#FFF3E8", lineHeight: 1 }}>
          {seconds}
        </div>
        {secondsFontSize >= 30 && (
          <div style={{ font: "700 11px 'Nunito',sans-serif", letterSpacing: ".14em", color: "#8E7F92" }}>
            SEC
          </div>
        )}
      </div>
    </div>
  );
}
