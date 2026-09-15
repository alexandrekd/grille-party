import { PhoneFrame } from "../components/PhoneFrame.js";

export interface StandingRow {
  playerId: string;
  name: string;
  score: number;
  rank: number;
}

/** Not covered by the DA export either (only the 4 TV screens + 6 phone screens
 * were specced; the cahier des charges calls for a mobile leaderboard too) — built
 * to match the app's established visual language rather than ported from a mockup. */
export function MobileLeaderboardScreen({
  standings,
  myPlayerId,
  isFinal,
  nextRoundInSec,
}: {
  standings: StandingRow[];
  myPlayerId: string;
  isFinal: boolean;
  nextRoundInSec?: number;
}) {
  return (
    <PhoneFrame bg="radial-gradient(100% 60% at 50% 0%,#3B2749 0%,#1A1322 58%,#120E18 100%)">
      <div style={{ position: "absolute", left: 26, right: 26, top: 70, textAlign: "center" }}>
        <div style={{ font: "700 13px 'Nunito',sans-serif", letterSpacing: ".22em", color: "#F7A8B8" }}>
          {isFinal ? "PARTIE TERMINÉE" : "FIN DE ROUND"}
        </div>
        <div style={{ font: "700 44px/1.1 'Fredoka',sans-serif", color: "#FFF3E8", marginTop: 10 }}>
          {isFinal ? "Classement final" : "Classement"}
        </div>
      </div>

      <div style={{ position: "absolute", left: 22, right: 22, top: 200, bottom: 110, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {standings.map((r) => {
          const isMe = r.playerId === myPlayerId;
          return (
            <div
              key={r.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: isMe ? "rgba(255,107,90,.18)" : "rgba(36,26,46,.82)",
                border: isMe ? "2px solid #FF6B5A" : "2px solid transparent",
                borderRadius: 18,
                padding: "12px 18px",
              }}
            >
              <div style={{ font: "700 22px 'Fredoka',sans-serif", color: r.rank <= 3 ? "#FFB34D" : "#8E7F92", width: 28 }}>
                {r.rank}
              </div>
              <div style={{ flex: 1, font: "700 22px 'Fredoka',sans-serif", color: "#FFF3E8" }}>
                {r.name}
                {isMe ? " (toi)" : ""}
              </div>
              <div style={{ font: "700 20px 'Fredoka',sans-serif", color: "#FFB34D" }}>{r.score}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", font: "600 18px 'Nunito',sans-serif", color: "#8E7F92" }}>
        {isFinal ? "Merci d'avoir joué !" : `Prochain round dans ${nextRoundInSec ?? 5}s`}
      </div>
    </PhoneFrame>
  );
}
