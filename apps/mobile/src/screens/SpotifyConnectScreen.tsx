import { Dancer } from "@grille/characters";
import { PhoneFrame } from "../components/PhoneFrame.js";
import { Button } from "../components/Button.js";

export function SpotifyConnectScreen({ onConnect, onSkip }: { onConnect: () => void; onSkip: () => void }) {
  return (
    <PhoneFrame bg="radial-gradient(100% 60% at 50% 0%,#2B2038 0%,#15101C 60%,#120E18 100%)">
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "radial-gradient(50% 50% at 50% 60%,rgba(255,179,77,.28),transparent 70%)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "absolute", left: 18, top: 34, font: "700 34px 'Fredoka',sans-serif", color: "#FFB34D", animation: "mdots 1.6s infinite" }}>♪</div>
          <div style={{ position: "absolute", right: 26, top: 66, font: "700 26px 'Fredoka',sans-serif", color: "#F7A8B8", animation: "mdots 1.6s .4s infinite" }}>♫</div>
          <Dancer
            traits={{ skin: "#F0C39A", hairColor: "#C9803A", hair: "curly", outfit: "#FF6B5A", pants: "#2B2136", acc: "headphones" }}
            reaction="dance"
            scale={0.94}
            showName={false}
          />
        </div>
      </div>

      <div style={{ position: "absolute", left: 30, right: 30, top: 400, display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center" }}>
        <div style={{ font: "700 42px/1.1 'Fredoka',sans-serif", color: "#FFF3E8" }}>Connecte ta musique</div>
      </div>

      <div style={{ position: "absolute", left: 26, right: 26, bottom: 38, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ font: "600 21px/1.4 'Nunito',sans-serif", color: "#C9B6D2", textAlign: "center" }}>
          On pioche 5 titres secrets dans tes écoutes. Tes potes devront devenir devins.
        </div>
        <Button
          label="Continuer avec Spotify"
          onClick={onConnect}
          bg="#1DB954"
          color="#06331A"
          height={78}
          shadowColor="#148A3E"
          icon={
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#06331A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: "3px solid #1DB954", borderTopColor: "transparent", borderRightColor: "transparent", transform: "rotate(-45deg)" }} />
            </div>
          }
        />
        <Button label="Jouer sans ma musique" onClick={onSkip} bg="#1D1626" color="#C9B6D2" height={66} border="2px solid #2E2438" fontSize={22} />
        <div style={{ textAlign: "center", font: "600 16px 'Nunito',sans-serif", color: "#8E7F92" }}>
          On lit tes titres. Rien d'autre, promis.
        </div>
      </div>
    </PhoneFrame>
  );
}
