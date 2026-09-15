import { Dancer, cssStringToObject } from "@grille/characters";
import type { AccessoryType, DancerTraits, HairStyle } from "@grille/shared";
import { DEFAULT_TRAITS } from "@grille/shared";
import { PhoneFrame } from "../components/PhoneFrame.js";
import { Button } from "../components/Button.js";
import { MINI } from "../lib/hairMini.js";

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ font: "700 13px 'Nunito',sans-serif", letterSpacing: ".2em", color: "#8E7F92", marginBottom: 8 }}>
      {children}
    </div>
  );
}

export function CharacterEditorScreen({
  traits,
  hairOptions,
  skinOptions,
  outfitOptions,
  accOptions,
  onHair,
  onSkin,
  onOutfit,
  onAcc,
  name,
  onName,
  onSubmit,
}: {
  traits: DancerTraits;
  hairOptions: readonly HairStyle[];
  skinOptions: readonly string[];
  outfitOptions: readonly string[];
  accOptions: readonly { id: AccessoryType; label: string }[];
  onHair: (h: HairStyle) => void;
  onSkin: (c: string) => void;
  onOutfit: (c: string) => void;
  onAcc: (a: AccessoryType) => void;
  name: string;
  onName: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <PhoneFrame bg="linear-gradient(to bottom,#241A2E 0%,#1A1322 42%,#120E18 100%)">
      <div style={{ position: "absolute", left: 0, right: 0, top: 48, height: 238, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -24,
            width: 360,
            height: 140,
            borderRadius: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(50% 50% at 50% 50%,rgba(255,179,77,.35),transparent 70%)",
            animation: "mpulse 1.3s infinite alternate ease-in-out",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, display: "flex", justifyContent: "center" }}>
          <Dancer traits={traits} reaction="dance" scale={0.86} showName={false} />
        </div>
        <div style={{ position: "absolute", left: 24, top: 8, font: "700 13px 'Nunito',sans-serif", letterSpacing: ".24em", color: "#F7A8B8" }}>
          FABRIQUE TON PERSO
        </div>
      </div>

      <div style={{ position: "absolute", left: 22, right: 22, top: 296, display: "flex", flexDirection: "column", gap: 15 }}>
        <div>
          <SectionLabel>COIFFURE</SectionLabel>
          <div style={{ display: "flex", gap: 9 }}>
            {hairOptions.map((h) => {
              const sel = traits.hair === h;
              return (
                <div
                  key={h}
                  onClick={() => onHair(h)}
                  style={{
                    position: "relative",
                    width: 46,
                    height: 46,
                    borderRadius: 15,
                    background: "#1D1626",
                    cursor: "pointer",
                    flex: "0 0 auto",
                    boxShadow: sel ? "0 0 0 3px #FF6B5A" : "0 0 0 2px #2E2438",
                  }}
                >
                  <div style={{ position: "absolute", left: 11, top: 11, width: 26, height: 28, borderRadius: "50%", background: traits.skin }} />
                  <div style={{ position: "absolute", ...cssStringToObject(MINI[h]), background: DEFAULT_TRAITS.hairColor }} />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>PEAU</SectionLabel>
          <div style={{ display: "flex", gap: 10 }}>
            {skinOptions.map((c) => (
              <div
                key={c}
                onClick={() => onSkin(c)}
                style={{ width: 52, height: 52, borderRadius: "50%", background: c, cursor: "pointer", boxShadow: traits.skin === c ? "0 0 0 4px #FFB34D" : "0 0 0 2px #2E2438" }}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>TENUE</SectionLabel>
          <div style={{ display: "flex", gap: 10 }}>
            {outfitOptions.map((c) => (
              <div
                key={c}
                onClick={() => onOutfit(c)}
                style={{ width: 52, height: 52, borderRadius: "50%", background: c, cursor: "pointer", boxShadow: traits.outfit === c ? "0 0 0 4px #FFB34D" : "0 0 0 2px #2E2438" }}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>ACCESSOIRE</SectionLabel>
          <div style={{ display: "flex", gap: 9 }}>
            {accOptions.map((a) => {
              const sel = traits.acc === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => onAcc(a.id)}
                  style={{
                    height: 46,
                    flex: 1,
                    borderRadius: 15,
                    background: "#1D1626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font: "700 14px 'Fredoka',sans-serif",
                    color: sel ? "#FF6B5A" : "#C9B6D2",
                    cursor: "pointer",
                    boxShadow: sel ? "0 0 0 3px #FF6B5A" : "0 0 0 2px #2E2438",
                  }}
                >
                  {a.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 22, right: 22, bottom: 34, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ height: 70, borderRadius: 24, background: "#1D1626", border: "2px solid #2E2438", display: "flex", alignItems: "center", padding: "0 22px", gap: 14 }}>
          <div style={{ font: "700 15px 'Nunito',sans-serif", color: "#8E7F92" }}>NOM</div>
          <input
            value={name}
            onChange={(e) => onName(e.target.value.slice(0, 24))}
            placeholder="Marin"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", font: "700 27px 'Fredoka',sans-serif", color: "#FFF3E8", minWidth: 0 }}
          />
        </div>
        <Button label="Je suis prêt !" onClick={onSubmit} bg="#FFB34D" color="#452A05" shadowColor="#C9832F" />
      </div>
    </PhoneFrame>
  );
}
