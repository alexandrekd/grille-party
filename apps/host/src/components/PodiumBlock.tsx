import type { ReactNode } from "react";

export function PodiumBlock({
  dancer,
  rank,
  points,
  blockWidth,
  blockHeight,
  blockBg,
  rankFontSize,
  rankColor,
  ptsFontSize,
  ptsColor,
  glow = false,
}: {
  dancer: ReactNode;
  rank: number;
  points: number;
  blockWidth: number;
  blockHeight: number;
  blockBg: string;
  rankFontSize: number;
  rankColor: string;
  ptsFontSize: number;
  ptsColor: string;
  glow?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {dancer}
      <div
        style={{
          width: blockWidth,
          height: blockHeight,
          marginTop: 40,
          borderRadius: "22px 22px 0 0",
          background: blockBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          animation: glow ? "glowring 1.8s infinite" : undefined,
        }}
      >
        <div style={{ font: `700 ${rankFontSize}px 'Fredoka',sans-serif`, color: rankColor, lineHeight: 1 }}>
          {rank}
        </div>
        <div style={{ font: `700 ${ptsFontSize}px 'Fredoka',sans-serif`, color: ptsColor }}>{points} pts</div>
      </div>
    </div>
  );
}
