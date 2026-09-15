import { useMemo } from "react";
import { Dancer } from "@grille/characters";
import type { PublicPlayerSummary, StandingEntry } from "@grille/shared";
import { Dancefloor, FloorGrid, GlowSpot, Particles } from "../components/Dancefloor.js";
import { PodiumBlock } from "../components/PodiumBlock.js";
import { RankListRow } from "../components/RankListRow.js";
import { confettiParticles } from "../lib/confetti.js";

export function LeaderboardScreen({
  standings,
  players,
  roundIndex,
  maxRounds,
  isFinal,
  nextRoundInSec,
}: {
  standings: StandingEntry[];
  players: PublicPlayerSummary[];
  roundIndex: number;
  maxRounds: number;
  isFinal: boolean;
  nextRoundInSec?: number;
}) {
  const confetti = useMemo(() => confettiParticles(10, 777, { round: true }), []);
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const [first, second, third, ...rest] = standings;

  return (
    <Dancefloor bg="radial-gradient(120% 95% at 42% 105%,#3B2749 0%,#1C1526 58%,#14101C 100%)">
      <GlowSpot style={{ left: "18%", top: -320, width: 420, height: 900, background: "radial-gradient(50% 50% at 50% 20%,rgba(255,179,77,.26),rgba(255,179,77,0) 70%)", animation: "sway 5.4s infinite alternate ease-in-out" }} />
      <FloorGrid height={280} alpha={0.07} duration={1.6} />
      <Particles particles={confetti} />

      <div style={{ position: "absolute", left: 58, top: 52 }}>
        <div style={{ font: "700 17px 'Nunito',sans-serif", letterSpacing: ".22em", color: "#F7A8B8" }}>
          {isFinal ? "PARTIE TERMINÉE" : `FIN DU ROUND ${roundIndex + 1} / ${maxRounds}`}
        </div>
        <div style={{ font: "700 62px/1 'Fredoka',sans-serif", color: "#FFF3E8", marginTop: 8 }}>
          {isFinal ? "Classement final" : "Classement"}
        </div>
      </div>

      {first && second && third && (
        <div style={{ position: "absolute", left: 56, bottom: 56, display: "flex", alignItems: "flex-end", gap: 16 }}>
          {byId.get(second.playerId)?.traits && (
            <PodiumBlock
              dancer={<Dancer traits={byId.get(second.playerId)!.traits!} label={second.name} reaction="laugh" scale={0.82} />}
              rank={2}
              points={second.score}
              blockWidth={170}
              blockHeight={126}
              blockBg="#4A3557"
              rankFontSize={44}
              rankColor="#FFC7D3"
              ptsFontSize={22}
              ptsColor="#FFF3E8"
            />
          )}
          {byId.get(first.playerId)?.traits && (
            <PodiumBlock
              dancer={<Dancer traits={byId.get(first.playerId)!.traits!} label={first.name} reaction="win" scale={0.98} />}
              rank={1}
              points={first.score}
              blockWidth={190}
              blockHeight={186}
              blockBg="#FFB34D"
              rankFontSize={62}
              rankColor="#452A05"
              ptsFontSize={26}
              ptsColor="#452A05"
              glow
            />
          )}
          {byId.get(third.playerId)?.traits && (
            <PodiumBlock
              dancer={<Dancer traits={byId.get(third.playerId)!.traits!} label={third.name} reaction="sad" scale={0.78} />}
              rank={3}
              points={third.score}
              blockWidth={160}
              blockHeight={92}
              blockBg="#32243E"
              rankFontSize={38}
              rankColor="#FFC7D3"
              ptsFontSize={20}
              ptsColor="#D6C7CF"
            />
          )}
        </div>
      )}

      <div style={{ position: "absolute", right: 54, top: 150, width: 400, display: "flex", flexDirection: "column", gap: 12 }}>
        {rest.map((r) => (
          <RankListRow
            key={r.playerId}
            rank={r.rank}
            name={r.name}
            points={r.score}
            dotColor={byId.get(r.playerId)?.traits?.outfit ?? "#8E7F92"}
          />
        ))}
        {!isFinal && (
          <div style={{ font: "600 20px 'Nunito',sans-serif", color: "#8E7F92", paddingLeft: 8 }}>
            Prochain round dans {nextRoundInSec ?? 5}s · préparez vos pouces
          </div>
        )}
      </div>
    </Dancefloor>
  );
}
