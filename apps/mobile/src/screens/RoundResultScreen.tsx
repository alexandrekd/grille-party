import { Dancer } from "@grille/characters";
import type { DancerTraits, Reaction } from "@grille/shared";
import { PhoneFrame } from "../components/PhoneFrame.js";

export interface MyOutcome {
  ownerName: string;
  wasOwner: boolean;
  guessedCorrectly: boolean;
  pointsDelta: number;
  myTraits: DancerTraits;
  myName: string;
}

/**
 * Invented screen (no DA mockup covers it — the cahier des charges §7.2.6 calls for
 * a mobile "résultat du round" screen the export didn't include). Reuses the app's
 * established visual language: dark gradient, Fredoka headline, hard-shadow pill,
 * the player's own dancer reacting to their personal outcome. Server drives pacing
 * (auto-advances to the leaderboard) — no manual continue button.
 */
export function RoundResultScreen({ outcome }: { outcome: MyOutcome }) {
  const { ownerName, wasOwner, guessedCorrectly, pointsDelta, myTraits, myName } = outcome;

  const reaction: Reaction = wasOwner ? "caught" : guessedCorrectly ? "win" : "sad";
  const bannerText = wasOwner
    ? "Tu as été grillé·e !"
    : guessedCorrectly
      ? "Bien vu, c'était toi qui avais raison !"
      : "Raté cette fois…";
  const bannerColor = pointsDelta > 0 ? "#7BE0A8" : pointsDelta < 0 ? "#FF6B5A" : "#C9B6D2";

  return (
    <PhoneFrame bg="radial-gradient(100% 60% at 50% 0%,#2E2038 0%,#161020 60%,#120E18 100%)">
      <div style={{ position: "absolute", left: 26, right: 26, top: 96, textAlign: "center" }}>
        <div style={{ font: "700 13px 'Nunito',sans-serif", letterSpacing: ".24em", color: "#F7A8B8" }}>
          RÉSULTAT DU ROUND
        </div>
        <div style={{ font: "700 44px/1.1 'Fredoka',sans-serif", color: "#FFF3E8", marginTop: 12 }}>
          C'était {ownerName} !
        </div>
        <div style={{ font: "700 22px 'Fredoka',sans-serif", color: bannerColor, marginTop: 14 }}>{bannerText}</div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", width: 230 }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: -10,
              width: 250,
              height: 110,
              borderRadius: "50%",
              transform: "translateX(-50%)",
              background: "radial-gradient(50% 50% at 50% 50%,rgba(255,179,77,.35),transparent 70%)",
            }}
          />
          <Dancer traits={myTraits} label={myName} reaction={reaction} scale={0.98} glow={pointsDelta > 0} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 80, textAlign: "center" }}>
        <span
          style={{
            font: "700 30px 'Fredoka',sans-serif",
            color: pointsDelta >= 0 ? "#452A05" : "#FFF3E8",
            background: pointsDelta >= 0 ? "#FFB34D" : "#2A1E33",
            padding: "14px 34px",
            borderRadius: 999,
          }}
        >
          {pointsDelta >= 0 ? "+" : ""}
          {pointsDelta} points
        </span>
      </div>
    </PhoneFrame>
  );
}
