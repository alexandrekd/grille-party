export function RankListRow({
  rank,
  name,
  points,
  dotColor,
}: {
  rank: number;
  name: string;
  points: number;
  dotColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        background: "rgba(36,26,46,.82)",
        borderRadius: 20,
        padding: "14px 22px",
      }}
    >
      <div style={{ font: "700 26px 'Fredoka',sans-serif", color: "#8E7F92", width: 34 }}>{rank}</div>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: dotColor, flex: "0 0 auto" }} />
      <div style={{ flex: 1, font: "700 27px 'Fredoka',sans-serif", color: "#FFF3E8" }}>{name}</div>
      <div style={{ font: "700 25px 'Fredoka',sans-serif", color: "#FFB34D" }}>{points}</div>
    </div>
  );
}
