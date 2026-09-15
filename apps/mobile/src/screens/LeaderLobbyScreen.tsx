import { useMemo, useState } from "react";
import { Dancer } from "@grille/characters";
import { DEFAULT_MAX_ROUNDS, type DancerTraits, type PublicPlayerSummary } from "@grille/shared";
import { PhoneFrame, Particles } from "../components/PhoneFrame.js";
import { Button } from "../components/Button.js";
import { mobileConfetti } from "../lib/confetti.js";

const MIN_ROUNDS = 3;
const MAX_ROUNDS = 15;

/** Shown instead of WaitingRoomScreen to the room's leader (first player to join —
 * see PublicPlayerSummary.isLeader) — the TV has no clickable controls, so the
 * "lancer la partie" action and its one setting (round count) live here instead. */
export function LeaderLobbyScreen({
  name,
  traits,
  lobbyChars,
  allReady,
  onStart,
  maxSlots = 8,
}: {
  name: string;
  traits: DancerTraits;
  lobbyChars: PublicPlayerSummary[];
  allReady: boolean;
  onStart: (maxRounds: number) => void;
  maxSlots?: number;
}) {
  const confetti = useMemo(() => mobileConfetti(8), []);
  const [maxRounds, setMaxRounds] = useState(DEFAULT_MAX_ROUNDS);
  const stillDrawing = Math.max(0, maxSlots - lobbyChars.length - 1);

  return (
    <PhoneFrame bg="radial-gradient(100% 60% at 50% 12%,#3B2749 0%,#1A1322 58%,#120E18 100%)">
      <Particles particles={confetti} />

      <div style={{ position: "absolute", left: 26, right: 26, top: 60, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#FFB34D", borderRadius: 999, padding: "9px 20px" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#452A05" }} />
          <div style={{ font: "700 17px 'Fredoka',sans-serif", color: "#452A05" }}>Joueur principal</div>
        </div>
        <div style={{ font: "700 36px/1.1 'Fredoka',sans-serif", color: "#FFF3E8", marginTop: 14 }}>
          Salut {name || "Toi"} !
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center" }}>
        <Dancer traits={traits} reaction="dance" scale={0.62} showName={false} />
      </div>

      <div style={{ position: "absolute", left: 24, right: 24, top: 300, background: "rgba(36,26,46,.8)", borderRadius: 24, padding: "18px 20px" }}>
        <div style={{ font: "700 13px 'Nunito',sans-serif", letterSpacing: ".2em", color: "#8E7F92", marginBottom: 12 }}>
          PARAMÈTRES
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ font: "700 18px 'Fredoka',sans-serif", color: "#FFF3E8" }}>Nombre de rounds</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <RoundStepper
              symbol="−"
              onClick={() => setMaxRounds((n) => Math.max(MIN_ROUNDS, n - 1))}
              disabled={maxRounds <= MIN_ROUNDS}
            />
            <div style={{ font: "700 26px 'Fredoka',sans-serif", color: "#FFB34D", width: 30, textAlign: "center" }}>
              {maxRounds}
            </div>
            <RoundStepper
              symbol="+"
              onClick={() => setMaxRounds((n) => Math.min(MAX_ROUNDS, n + 1))}
              disabled={maxRounds >= MAX_ROUNDS}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <div style={{ font: "700 14px 'Nunito',sans-serif", letterSpacing: ".2em", color: "#8E7F92" }}>SUR LA PISTE</div>
          <div style={{ font: "700 18px 'Fredoka',sans-serif", color: "#FFB34D" }}>{lobbyChars.length + 1} / {maxSlots}</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 24, right: 24, bottom: 56 }}>
        <Button
          label={allReady ? "Lancer la partie" : `En attente${stillDrawing > 0 ? ` (${stillDrawing})` : ""}…`}
          onClick={allReady ? () => onStart(maxRounds) : undefined}
          disabled={!allReady}
          bg={allReady ? "#FFB34D" : "#1D1626"}
          color={allReady ? "#452A05" : "#5A4A66"}
          shadowColor={allReady ? "#C9832F" : undefined}
        />
      </div>
    </PhoneFrame>
  );
}

function RoundStepper({ symbol, onClick, disabled }: { symbol: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: "none",
        background: disabled ? "#241A2E" : "#3A2E48",
        color: disabled ? "#5A4A66" : "#FFF3E8",
        font: "700 22px 'Fredoka',sans-serif",
        cursor: disabled ? "default" : "pointer",
        lineHeight: 1,
      }}
    >
      {symbol}
    </button>
  );
}
