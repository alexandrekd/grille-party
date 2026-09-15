import { useEffect, useMemo, useRef } from "react";
import { Dancer } from "@grille/characters";
import { PhoneFrame, GlowSpot, FloorGrid, Halo } from "../components/PhoneFrame.js";
import { Button } from "../components/Button.js";
import { CodeInput } from "../components/CodeInput.js";
import { CHAR_FIXTURES } from "../state/fixtures.js";

export function JoinScreen({
  code,
  setCode,
  onJoin,
  error,
}: {
  code: string;
  setCode: (v: string) => void;
  onJoin: () => void;
  error?: string | null;
}) {
  const bgChars = useMemo(() => [CHAR_FIXTURES[1]!, CHAR_FIXTURES[4]!, CHAR_FIXTURES[6]!], []);

  // Fire at most once per distinct 4-digit code, guarded by a ref rather than just
  // the effect's dependency array — `onJoin` is recreated on every parent re-render
  // (App re-renders on every room_state broadcast once someone's joined), which
  // would otherwise re-trigger this effect and send a duplicate join_room per
  // broadcast, each minting a brand new player server-side.
  const firedForCode = useRef<string | null>(null);
  useEffect(() => {
    if (code.length === 4 && firedForCode.current !== code) {
      firedForCode.current = code;
      onJoin();
    }
  }, [code, onJoin]);

  return (
    <PhoneFrame bg="radial-gradient(110% 70% at 50% 108%,#43284F 0%,#1C1526 55%,#120E18 100%)">
      <GlowSpot style={{ left: "12%", top: 120, width: 200, height: 620, background: "radial-gradient(50% 50% at 50% 20%,rgba(255,179,77,.22),transparent 70%)", animation: "msway 5s infinite alternate ease-in-out" }} />
      <GlowSpot style={{ right: "8%", top: 120, width: 200, height: 620, background: "radial-gradient(50% 50% at 50% 20%,rgba(247,168,184,.2),transparent 70%)", animation: "msway 6.4s .6s infinite alternate-reverse ease-in-out" }} />
      <FloorGrid height={200} alpha={0.07} duration={1.4} />
      <Halo style={{ left: "50%", bottom: -60, width: 460, height: 200, transform: "translateX(-50%)", background: "radial-gradient(50% 50% at 50% 50%,rgba(255,107,90,.4),transparent 70%)", animation: "mpulse 1.4s infinite alternate ease-in-out" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 14, opacity: 0.6 }}>
        {bgChars.map((c) => (
          <Dancer key={c.id} traits={c.traits} reaction="dance" scale={0.46} showName={false} />
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(16,12,22,.9) 0%,rgba(16,12,22,.55) 46%,rgba(16,12,22,.85) 78%)" }} />

      <div style={{ position: "absolute", left: 26, right: 26, top: 96, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ font: "700 13px 'Nunito',sans-serif", letterSpacing: ".26em", color: "#F7A8B8" }}>JEU DE SOIRÉE</div>
        <div style={{ font: "700 74px/1 'Fredoka',sans-serif", color: "#FFF3E8" }}>
          GRILLÉ<span style={{ color: "#FF6B5A" }}>!</span>
        </div>
        <div style={{ font: "600 19px 'Nunito',sans-serif", color: "#C9B6D2", textAlign: "center" }}>
          Ton téléphone, c'est ta manette.
        </div>
      </div>

      <div style={{ position: "absolute", left: 26, right: 26, bottom: 34, display: "flex", flexDirection: "column", gap: 18 }}>
        <Button
          label="Scanner le QR"
          bg="#FF6B5A"
          color="#2A1E2B"
          shadowColor="#C0483A"
          ringAnimation
          icon={<div style={{ width: 34, height: 34, borderRadius: 9, background: "repeating-linear-gradient(45deg,#2A1E2B 0 4px,transparent 4px 8px)" }} />}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, height: 2, background: "#2E2438" }} />
          <div style={{ font: "700 15px 'Nunito',sans-serif", color: "#8E7F92" }}>OU LE CODE TV</div>
          <div style={{ flex: 1, height: 2, background: "#2E2438" }} />
        </div>
        <CodeInput value={code} onChange={setCode} />
        <div style={{ textAlign: "center", font: "600 17px 'Nunito',sans-serif", color: error ? "#FF6B5A" : "#8E7F92" }}>
          {error ?? "Le code est affiché sur la télé"}
        </div>
      </div>
    </PhoneFrame>
  );
}
