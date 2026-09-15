import { Dancer } from "@grille/characters";
import type { PublicPlayerSummary } from "@grille/shared";
import { Dancefloor, FloorGrid, GlowSpot, Halo } from "../components/Dancefloor.js";
import { JoinCard } from "../components/JoinCard.js";

const MAX_SLOTS = 8;

export function LobbyScreen({
  roomCode,
  players,
  allReady,
  onStart,
  spotifyConnected,
  onConnectSpotify,
}: {
  roomCode: string;
  players: PublicPlayerSummary[];
  allReady: boolean;
  onStart: () => void;
  spotifyConnected: boolean;
  onConnectSpotify: () => void;
}) {
  const ready = players.filter((p) => p.status === "READY" && p.traits);
  const openSlots = Math.max(0, MAX_SLOTS - ready.length);
  const lastJoined = ready[ready.length - 1];

  return (
    <Dancefloor bg="radial-gradient(120% 95% at 50% 105%,#3B2749 0%,#1C1526 58%,#14101C 100%)">
      <GlowSpot
        style={{ left: "12%", top: -320, width: 420, height: 900, background: "radial-gradient(50% 50% at 50% 20%,rgba(255,179,77,.28),rgba(255,179,77,0) 70%)", animation: "sway 6s infinite alternate ease-in-out" }}
      />
      <GlowSpot
        style={{ right: "10%", top: -320, width: 420, height: 900, background: "radial-gradient(50% 50% at 50% 20%,rgba(247,168,184,.26),rgba(247,168,184,0) 70%)", animation: "sway 7.5s .8s infinite alternate-reverse ease-in-out" }}
      />
      <FloorGrid height={290} alpha={0.08} duration={1.9} />
      <Halo
        style={{
          left: "50%",
          bottom: -130,
          width: 1180,
          height: 400,
          transform: "translateX(-50%)",
          background: "radial-gradient(50% 50% at 50% 50%,rgba(255,107,90,.34),rgba(255,107,90,0) 72%)",
          animation: "floorpulse 1.9s infinite alternate ease-in-out",
        }}
      />

      <JoinCard code={roomCode} />

      <div style={{ position: "absolute", right: 64, top: 78, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            background: "rgba(36,26,46,.85)",
            borderRadius: 999,
            padding: "14px 26px",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#7BE0A8" }} />
          <div style={{ font: "700 24px 'Fredoka',sans-serif", color: "#FFF3E8" }}>
            {ready.length} / {MAX_SLOTS} joueurs
          </div>
        </div>

        {allReady && (
          <button
            onClick={onStart}
            style={{
              border: "none",
              cursor: "pointer",
              font: "700 22px 'Fredoka',sans-serif",
              color: "#452A05",
              background: "#FFB34D",
              padding: "14px 30px",
              borderRadius: 999,
              boxShadow: "0 8px 0 #C9832F",
            }}
          >
            Lancer la partie
          </button>
        )}

        {spotifyConnected ? (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: "rgba(29,185,84,.18)",
              border: "2px solid #1DB954",
              borderRadius: 999,
              padding: "10px 20px",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1DB954" }} />
            <div style={{ font: "700 16px 'Fredoka',sans-serif", color: "#7BE0A8" }}>Spotify connecté</div>
          </div>
        ) : (
          <button
            onClick={onConnectSpotify}
            style={{
              border: "none",
              cursor: "pointer",
              display: "flex",
              gap: 10,
              alignItems: "center",
              font: "700 16px 'Fredoka',sans-serif",
              color: "#06331A",
              background: "#1DB954",
              padding: "10px 20px",
              borderRadius: 999,
              boxShadow: "0 5px 0 #148A3E",
            }}
          >
            Connecter Spotify (Premium)
          </button>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 96,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 30,
          paddingLeft: 120,
        }}
      >
        {ready.map((p) => (
          <Dancer
            key={p.id}
            traits={p.traits!}
            label={p.name}
            reaction="idle"
            scale={0.86}
            showName
          />
        ))}
        {Array.from({ length: Math.min(openSlots, 3) }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 86,
              height: 86,
              borderRadius: "50%",
              border: "4px dashed #5A4A66",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "700 30px 'Fredoka',sans-serif",
              color: "#7A688A",
              animation: `slotblink 1.6s ${(i * 0.4).toFixed(1)}s infinite alternate`,
            }}
          >
            ?
          </div>
        ))}
      </div>
      {lastJoined && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 36,
            textAlign: "center",
            font: "700 25px 'Fredoka',sans-serif",
            color: "#C9B6D2",
          }}
        >
          {lastJoined.name} vient d'arriver sur la piste…
        </div>
      )}
    </Dancefloor>
  );
}
