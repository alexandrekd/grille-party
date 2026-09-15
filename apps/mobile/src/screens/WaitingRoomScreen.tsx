import { useMemo } from "react";
import { Dancer } from "@grille/characters";
import type { DancerTraits, PublicPlayerSummary } from "@grille/shared";
import { PhoneFrame, Particles } from "../components/PhoneFrame.js";
import { mobileConfetti } from "../lib/confetti.js";

export function WaitingRoomScreen({
  name,
  traits,
  lobbyChars,
  maxSlots = 8,
}: {
  name: string;
  traits: DancerTraits;
  lobbyChars: PublicPlayerSummary[];
  maxSlots?: number;
}) {
  const confetti = useMemo(() => mobileConfetti(8), []);
  const stillDrawing = Math.max(0, maxSlots - lobbyChars.length - 1);

  return (
    <PhoneFrame bg="radial-gradient(100% 60% at 50% 12%,#3B2749 0%,#1A1322 58%,#120E18 100%)">
      <Particles particles={confetti} />

      <div style={{ position: "absolute", left: 26, right: 26, top: 74, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#1DB954", borderRadius: 999, padding: "9px 20px" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#06331A" }} />
          <div style={{ font: "700 17px 'Fredoka',sans-serif", color: "#06331A" }}>Perso validé</div>
        </div>
        <div style={{ font: "700 44px/1.1 'Fredoka',sans-serif", color: "#FFF3E8", marginTop: 16 }}>
          Salut {name || "Toi"} !
        </div>
        <div style={{ font: "600 20px 'Nunito',sans-serif", color: "#C9B6D2", marginTop: 8 }}>
          Tu es sur la piste. Regarde la télé.
        </div>
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
              background: "radial-gradient(50% 50% at 50% 50%,rgba(255,107,90,.34),transparent 70%)",
              animation: "mpulse 1.5s infinite alternate ease-in-out",
            }}
          />
          <Dancer traits={traits} reaction="dance" scale={0.92} showName={false} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 24, right: 24, bottom: 150, background: "rgba(36,26,46,.8)", borderRadius: 28, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ font: "700 14px 'Nunito',sans-serif", letterSpacing: ".2em", color: "#8E7F92" }}>SUR LA PISTE</div>
          <div style={{ font: "700 20px 'Fredoka',sans-serif", color: "#FFB34D" }}>{lobbyChars.length + 1} / {maxSlots}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {lobbyChars.map((c) => (
            <div key={c.id} style={{ position: "relative", width: 60, height: 96, borderRadius: 18, background: "#1D1626", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 6, overflow: "hidden", opacity: c.connected ? 1 : 0.5 }}>
              {c.traits && <Dancer traits={c.traits} reaction="dance" scale={0.3} dim={!c.connected} showName={false} />}
              <div style={{ font: "700 13px 'Fredoka',sans-serif", color: "#C9B6D2", marginTop: 4 }}>{c.name}</div>
              {!c.connected && (
                <div style={{ position: "absolute", top: 4, right: 4, font: "12px sans-serif" }}>🔌</div>
              )}
            </div>
          ))}
          <div style={{ width: 60, height: 96, borderRadius: 18, border: "3px dashed #3A2E48", display: "flex", alignItems: "center", justifyContent: "center", font: "700 22px 'Fredoka',sans-serif", color: "#5A4A66" }}>
            ?
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ font: "700 21px 'Fredoka',sans-serif", color: "#FFF3E8" }}>
          {stillDrawing > 0 ? `${stillDrawing} potes se dessinent encore` : "Tout le monde est prêt !"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF6B5A", animation: "mdots 1.2s infinite" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFB34D", animation: "mdots 1.2s .2s infinite" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#F7A8B8", animation: "mdots 1.2s .4s infinite" }} />
        </div>
      </div>
    </PhoneFrame>
  );
}
