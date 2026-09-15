const DIGIT_STYLES = [
  { bg: "#FF6B5A", color: "#FFF3E8" },
  { bg: "#FFB34D", color: "#452A05" },
  { bg: "#F7A8B8", color: "#4A2029" },
  { bg: "#4A3557", color: "#FFF3E8" },
];

export function JoinCard({ code }: { code: string }) {
  const digits = code.padStart(4, "0").split("");
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 74,
        width: 404,
        background: "#FFF3E8",
        borderRadius: 32,
        padding: 38,
        display: "flex",
        flexDirection: "column",
        gap: 22,
        boxShadow: "0 22px 0 rgba(0,0,0,.25)",
      }}
    >
      <div style={{ font: "700 17px 'Nunito',sans-serif", letterSpacing: ".2em", color: "#C0483A" }}>
        REJOINS LA PISTE
      </div>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 20,
            background: "repeating-linear-gradient(45deg,#E4D6C9 0 6px,#F4E8DC 6px 12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            font: "600 11px 'Nunito',monospace",
            color: "#7A6656",
            textAlign: "center",
          }}
        >
          QR CODE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ font: "700 18px 'Nunito',sans-serif", color: "#7A6656" }}>ou tape le code</div>
          <div style={{ display: "flex", gap: 9 }}>
            {digits.map((d, i) => {
              const style = DIGIT_STYLES[i % DIGIT_STYLES.length]!;
              return (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 58,
                    borderRadius: 14,
                    background: style.bg,
                    color: style.color,
                    font: "700 34px 'Fredoka',sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ font: "600 19px 'Nunito',sans-serif", color: "#7A6656" }}>
        grille.party sur ton téléphone · construis ton perso en 30 s
      </div>
    </div>
  );
}
