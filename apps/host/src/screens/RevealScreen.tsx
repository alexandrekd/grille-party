import { useMemo } from "react";
import { Dancer } from "@grille/characters";
import type { PublicPlayerSummary, ReactionAssignment, ResolvedVote, ScoreDelta } from "@grille/shared";
import { Dancefloor, FloorGrid, Halo, Particles } from "../components/Dancefloor.js";
import { PointPill } from "../components/PointPill.js";
import { confettiParticles } from "../lib/confetti.js";

export function RevealScreen({
  players,
  ownerPlayerId,
  track,
  votes,
  scoreDeltas,
  reactions,
}: {
  players: PublicPlayerSummary[];
  ownerPlayerId: string;
  track: { title: string; artist: string; coverUrl: string };
  votes: ResolvedVote[];
  scoreDeltas: ScoreDelta[];
  reactions: ReactionAssignment[];
}) {
  const confetti = useMemo(() => confettiParticles(22, 1337, { spread: [32, 68] }), []);
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const owner = byId.get(ownerPlayerId);
  const reactionFor = (id: string) => reactions.find((r) => r.playerId === id)?.reaction ?? "idle";

  const nonOwnerVoters = votes.filter((v) => v.voterId !== ownerPlayerId);
  const correctCount = nonOwnerVoters.filter((v) => v.choiceId === ownerPlayerId).length;

  const others = players.filter((p) => p.id !== ownerPlayerId && p.traits);
  const left = others.slice(0, 3);
  const right = others.slice(3, 6);

  const correctGuessers = scoreDeltas.filter((d) => d.reason === "correct_guess" && d.delta > 0);
  const restNames = players
    .filter((p) => p.id !== ownerPlayerId && !correctGuessers.some((d) => d.playerId === p.id))
    .map((p) => p.name);

  if (!owner?.traits) return null;

  return (
    <Dancefloor bg="radial-gradient(120% 95% at 50% 105%,#2E2038 0%,#1A1322 58%,#120E18 100%)">
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -40,
          width: 520,
          height: 640,
          marginLeft: -260,
          background: "linear-gradient(to bottom,rgba(255,179,77,.42),rgba(255,179,77,.06) 78%,transparent)",
          clipPath: "polygon(38% 0,62% 0,100% 100%,0 100%)",
          animation: "conepulse 1.3s infinite alternate ease-in-out",
        }}
      />
      <FloorGrid height={300} alpha={0.06} />
      <Halo
        style={{
          left: "50%",
          bottom: 34,
          width: 560,
          height: 220,
          transform: "translateX(-50%)",
          background: "radial-gradient(50% 50% at 50% 50%,rgba(255,179,77,.5),rgba(255,179,77,0) 70%)",
        }}
      />
      <Particles particles={confetti} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 58, textAlign: "center" }}>
        <div style={{ font: "700 19px 'Nunito',sans-serif", letterSpacing: ".24em", color: "#F7A8B8" }}>
          C'ÉTAIT…
        </div>
        <div style={{ font: "700 92px/1 'Fredoka',sans-serif", color: "#FFF3E8", marginTop: 6 }}>
          {owner.name.toUpperCase()}&nbsp;!
        </div>
        <div style={{ font: "700 28px 'Fredoka',sans-serif", color: "#FFC7D3", marginTop: 14 }}>
          Grillé·e par {correctCount} joueur{correctCount > 1 ? "s" : ""} sur {nonOwnerVoters.length}
        </div>
      </div>

      {track.title && (
        <div
          style={{
            position: "absolute",
            right: 48,
            top: 48,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(36,26,46,.82)",
            borderRadius: 999,
            padding: "10px 22px 10px 10px",
          }}
        >
          {track.coverUrl && (
            <img
              src={track.coverUrl}
              alt=""
              style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }}
            />
          )}
          <div style={{ textAlign: "left" }}>
            <div style={{ font: "700 19px 'Fredoka',sans-serif", color: "#FFF3E8" }}>{track.title}</div>
            <div style={{ font: "600 14px 'Nunito',sans-serif", color: "#C9B6D2" }}>{track.artist}</div>
          </div>
        </div>
      )}

      <div style={{ position: "absolute", left: 66, bottom: 150, display: "flex", alignItems: "flex-end", gap: 34 }}>
        {left.map((p) => (
          <Dancer key={p.id} traits={p.traits!} reaction={reactionFor(p.id)} scale={0.78} dim showName={false} />
        ))}
      </div>
      <div style={{ position: "absolute", right: 66, bottom: 150, display: "flex", alignItems: "flex-end", gap: 34 }}>
        {right.map((p) => (
          <Dancer key={p.id} traits={p.traits!} reaction={reactionFor(p.id)} scale={0.78} dim showName={false} />
        ))}
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 112, transform: "translateX(-50%)" }}>
        <Dancer traits={owner.traits} label={owner.name} reaction="caught" scale={1.28} glow />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        {correctGuessers.map((d) => {
          const p = byId.get(d.playerId);
          return <PointPill key={d.playerId} label={`${p?.name ?? "?"} +${d.delta}`} />;
        })}
        {restNames.length > 0 && <PointPill label={`${restNames.join(", ")} +0`} muted />}
      </div>
    </Dancefloor>
  );
}
