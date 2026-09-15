import { Dancer } from "@grille/characters";
import { PhoneFrame } from "../components/PhoneFrame.js";
import { Button } from "../components/Button.js";
import { CountdownRing } from "../components/CountdownRing.js";
import type { VoteCard } from "../state/useMockMobileState.js";

export function VoteScreen({
  cards,
  onToggle,
  onSend,
  locked,
  votingDeadlineTs,
  totalVoteMs,
  votesReceived,
  votesExpected,
  roundIndex,
}: {
  cards: VoteCard[];
  onToggle: (id: string) => void;
  onSend: () => void;
  locked: boolean;
  votingDeadlineTs: number;
  totalVoteMs: number;
  votesReceived: number;
  votesExpected: number;
  roundIndex: number;
}) {
  const selected = cards.find((c) => c.selected);

  return (
    <PhoneFrame bg="linear-gradient(to bottom,#1F1729 0%,#161020 60%,#120E18 100%)">
      <div style={{ position: "absolute", left: 22, right: 22, top: 50, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: "700 13px 'Nunito',sans-serif", letterSpacing: ".2em", color: locked ? "#FFB34D" : "#F7A8B8" }}>
            {locked ? "VOTE ENVOYÉ" : `ROUND ${roundIndex + 1} · ÇA JOUE SUR LA TÉLÉ`}
          </div>
          <div style={{ font: "700 30px/1.1 'Fredoka',sans-serif", color: "#FFF3E8", marginTop: 5 }}>
            {locked ? `Tu dis ${selected?.name ?? "?"}.` : "C'est le titre de qui ?"}
          </div>
        </div>
        <CountdownRing deadlineTs={votingDeadlineTs} totalMs={totalVoteMs} size={58} innerSize={44} secondsFontSize={20} />
      </div>

      <div style={{ position: "absolute", left: 22, right: 22, top: 152, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map((c) => (
          <div
            key={c.id}
            onClick={locked ? undefined : () => onToggle(c.id)}
            style={{
              position: "relative",
              boxSizing: "border-box",
              height: 124,
              borderRadius: 20,
              background: c.selected ? "#33202A" : "#1D1626",
              border: `3px solid ${c.selected ? "#FF6B5A" : "#2A2135"}`,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 26,
              overflow: "hidden",
              cursor: locked ? "default" : "pointer",
              boxShadow: c.selected ? "0 0 0 4px rgba(255,107,90,.22)" : "none",
              animation: c.selected ? "mtap .5s infinite alternate ease-in-out" : undefined,
            }}
          >
            <Dancer traits={c.traits} reaction={c.selected ? "surprise" : "dance"} scale={0.38} showName={false} />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                padding: "5px 0",
                textAlign: "center",
                font: "700 16px 'Fredoka',sans-serif",
                background: c.selected ? "#FF6B5A" : "#241A2E",
                color: c.selected ? "#2A1E2B" : "#D6C7CF",
              }}
            >
              {c.name}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 22, right: 22, bottom: 34 }}>
        {locked ? (
          <div style={{ textAlign: "center", font: "600 17px 'Nunito',sans-serif", color: "#8E7F92" }}>
            {votesReceived} votes sur {votesExpected} · réponse sur la télé
          </div>
        ) : (
          <Button
            label={selected ? `Envoyer : ${selected.name}` : "Tape sur un perso"}
            onClick={selected ? onSend : undefined}
            disabled={!selected}
            bg={selected ? "#FFB34D" : "#1D1626"}
            color={selected ? "#452A05" : "#5A4A66"}
            height={68}
            radius={24}
            fontSize={24}
          />
        )}
      </div>
    </PhoneFrame>
  );
}
