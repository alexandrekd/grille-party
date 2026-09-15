export function PointPill({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div
      style={{
        font: "700 22px 'Fredoka',sans-serif",
        color: muted ? "#C9B6D2" : "#2A1E2B",
        background: muted ? "#2A1E33" : "#FFB34D",
        padding: "12px 26px",
        borderRadius: 999,
      }}
    >
      {label}
    </div>
  );
}
