export function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = Array.from({ length: 4 }, (_, i) => value[i]);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 12 }}>
        {digits.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 82,
              borderRadius: 22,
              background: "#1D1626",
              border: `3px solid ${d ? "#FFB34D" : "#2E2438"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "700 40px 'Fredoka',sans-serif",
              color: d ? "#FFF3E8" : "#5A4A66",
            }}
          >
            {d ?? "–"}
          </div>
        ))}
      </div>
      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        aria-label="Code de la partie"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          border: "none",
          fontSize: 24,
        }}
      />
    </div>
  );
}
