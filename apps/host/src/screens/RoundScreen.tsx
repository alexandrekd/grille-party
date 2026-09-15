import { useMemo } from "react";
import { Dancer } from "@grille/characters";
import type { PublicPlayerSummary } from "@grille/shared";
import { Dancefloor, FloorGrid, GlowSpot, Halo, Particles } from "../components/Dancefloor.js";
import { CountdownRing } from "../components/CountdownRing.js";
import { confettiParticles } from "../lib/confetti.js";
import { danceFor, delayFor } from "../lib/dancerPlacement.js";

export function RoundScreen({
  players,
  roundIndex,
  maxRounds,
  votingDeadlineTs,
  totalVoteMs,
  votesReceived,
  votesExpected,
}: {
  players: PublicPlayerSummary[];
  roundIndex: number;
  maxRounds: number;
  votingDeadlineTs: number;
  totalVoteMs: number;
  votesReceived: number;
  votesExpected: number;
}) {
  const confetti = useMemo(() => confettiParticles(14, 4821), []);
  const dancing = players.filter((p) => p.traits);
  const back = dancing.filter((_, i) => i % 2 === 1);
  const front = dancing.filter((_, i) => i % 2 === 0);

  return (
    <Dancefloor bg="radial-gradient(120% 95% at 50% 105%,#452A52 0%,#201628 58%,#14101C 100%)">
      <GlowSpot style={{ left: "8%", top: -340, width: 460, height: 940, background: "radial-gradient(50% 50% at 50% 20%,rgba(255,107,90,.3),rgba(255,107,90,0) 70%)", animation: "sway 4.5s infinite alternate ease-in-out" }} />
      <GlowSpot style={{ left: "38%", top: -340, width: 460, height: 940, background: "radial-gradient(50% 50% at 50% 20%,rgba(255,179,77,.26),rgba(255,179,77,0) 70%)", animation: "sway 5.6s .5s infinite alternate-reverse ease-in-out" }} />
      <GlowSpot style={{ right: "6%", top: -340, width: 460, height: 940, background: "radial-gradient(50% 50% at 50% 20%,rgba(247,168,184,.28),rgba(247,168,184,0) 70%)", animation: "sway 6.4s 1s infinite alternate ease-in-out" }} />
      <FloorGrid height={320} alpha={0.09} duration={1.1} />
      <Halo
        style={{
          left: "50%",
          bottom: -140,
          width: 1240,
          height: 430,
          transform: "translateX(-50%)",
          background: "radial-gradient(50% 50% at 50% 50%,rgba(255,107,90,.4),rgba(255,107,90,0) 72%)",
          animation: "floorpulse 1.05s infinite alternate ease-in-out",
        }}
      />
      <Particles particles={confetti} />

      <div
        style={{
          position: "absolute",
          left: 56,
          top: 56,
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: "rgba(20,14,26,.72)",
          borderRadius: 999,
          padding: "16px 30px 16px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 34 }}>
          <div style={{ width: 7, height: 16, borderRadius: 4, background: "#FF6B5A", animation: "tilepulse .42s infinite alternate" }} />
          <div style={{ width: 7, height: 30, borderRadius: 4, background: "#FFB34D", animation: "tilepulse .3s .1s infinite alternate" }} />
          <div style={{ width: 7, height: 22, borderRadius: 4, background: "#F7A8B8", animation: "tilepulse .36s .05s infinite alternate" }} />
          <div style={{ width: 7, height: 34, borderRadius: 4, background: "#FFF3E8", animation: "tilepulse .26s .15s infinite alternate" }} />
        </div>
        <div>
          <div style={{ font: "700 15px 'Nunito',sans-serif", letterSpacing: ".18em", color: "#F7A8B8" }}>
            ROUND {roundIndex + 1} / {maxRounds} · TITRE EN COURS
          </div>
          {/* Deliberately no track title/artist here — never revealed before the
             reveal screen, matching the protocol's RoundPublicInfo (no track field)
             and "aucune indication du vote de qui que ce soit". */}
          <div style={{ font: "700 28px 'Fredoka',sans-serif", color: "#FFF3E8" }}>
            À qui appartient ce titre ?
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", right: 56, top: 52 }}>
        <CountdownRing deadlineTs={votingDeadlineTs} totalMs={totalVoteMs} />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 326, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 66 }}>
        {back.map((p, i) => (
          <Dancer key={p.id} traits={p.traits!} reaction="dance" dance={danceFor(i)} delay={delayFor(i)} scale={0.66} showName={false} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 104, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 36 }}>
        {front.map((p, i) => (
          <Dancer key={p.id} traits={p.traits!} label={p.name} reaction="dance" dance={danceFor(i + 4)} delay={delayFor(i + 4)} scale={0.98} showName />
        ))}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center" }}>
        <span style={{ font: "700 24px 'Fredoka',sans-serif", color: "#2A1E2B", background: "#FFF3E8", padding: "12px 30px", borderRadius: 999 }}>
          Votez sur vos téléphones · {votesReceived} votes sur {votesExpected}
        </span>
      </div>
    </Dancefloor>
  );
}
