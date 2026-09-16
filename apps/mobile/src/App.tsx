import { useEffect, useMemo, useState } from "react";
import {
  ACCESSORIES,
  DEFAULT_TRAITS,
  HAIR_STYLES,
  OUTFIT_SWATCHES,
  SKIN_SWATCHES,
  type AccessoryType,
  type DancerTraits,
  type HairStyle,
} from "@grille/shared";
import { Stage } from "./components/Stage.js";
import { serverHttpBase } from "./lib/serverHttpBase.js";
import { rankLabel } from "./lib/musicSourceLabel.js";
import { useMobileSocket } from "./state/useMobileSocket.js";
import type { VoteCard } from "./state/useMockMobileState.js";
import { JoinScreen } from "./screens/JoinScreen.js";
import { SpotifyConnectScreen } from "./screens/SpotifyConnectScreen.js";
import { CharacterEditorScreen } from "./screens/CharacterEditorScreen.js";
import { WaitingRoomScreen } from "./screens/WaitingRoomScreen.js";
import { LeaderLobbyScreen } from "./screens/LeaderLobbyScreen.js";
import { VoteScreen } from "./screens/VoteScreen.js";
import { RoundResultScreen } from "./screens/RoundResultScreen.js";
import { MobileLeaderboardScreen } from "./screens/MobileLeaderboardScreen.js";

// Data source is `useMobileSocket()` — the real WebSocket hook — layered with local
// UI state for the steps that happen before the server has anything to say about
// this player yet (the join code field, the Spotify stub step, and the character
// editor's live draft), exactly the pattern `useMockMobileState()` established.
export function App() {
  const { roomState, voteProgress, roundResolved, leaderboard, myPlayerId, myVote, joinError, actions } =
    useMobileSocket();

  const [code, setCode] = useState("");
  // Connecting Spotify navigates away to accounts.spotify.com and back — every bit
  // of React state is lost on that round trip except what's in localStorage (the
  // rejoin token, which useMobileSocket already restores) and the server's own
  // room_state. The server callback appends ?spotify=ok|error to the return URL so
  // this survives the reload; the rejoin-token flow restores everything else.
  const [spotifyDone, setSpotifyDone] = useState(
    () => new URLSearchParams(window.location.search).get("spotify") === "ok",
  );
  const [hair, setHair] = useState<HairStyle>(DEFAULT_TRAITS.hair);
  const [skin, setSkin] = useState(DEFAULT_TRAITS.skin);
  const [outfit, setOutfit] = useState(DEFAULT_TRAITS.outfit);
  const [acc, setAcc] = useState<AccessoryType>(DEFAULT_TRAITS.acc);
  const [name, setName] = useState("");
  const [draftVote, setDraftVote] = useState<string | null>(null);
  const [voteLocked, setVoteLocked] = useState(false);

  const draftTraits: DancerTraits = useMemo(
    () => ({ skin, hairColor: DEFAULT_TRAITS.hairColor, hair, outfit, pants: DEFAULT_TRAITS.pants, acc }),
    [skin, hair, outfit, acc],
  );

  const me = roomState?.players.find((p) => p.id === myPlayerId) ?? null;
  const roundId = roomState?.round?.roundId ?? null;

  // Clear the code field on a failed join so the 4-digit auto-join in JoinScreen
  // can retry once the player types a new code.
  useEffect(() => {
    if (joinError) setCode("");
  }, [joinError]);

  // Clean the ?spotify=ok|error param out of the URL once read, so a manual reload
  // doesn't re-trigger it.
  useEffect(() => {
    if (window.location.search.includes("spotify=")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Reset the vote draft/lock whenever a new round starts.
  useEffect(() => {
    setDraftVote(null);
    setVoteLocked(false);
  }, [roundId]);

  // Restore a locked vote on (re)join mid-round, or after actually sending one.
  useEffect(() => {
    if (myVote) {
      setDraftVote(myVote);
      setVoteLocked(true);
    }
  }, [myVote]);

  const voteCards: VoteCard[] = useMemo(
    () =>
      (roomState?.players ?? [])
        .filter((p): p is typeof p & { traits: DancerTraits } => !!p.traits)
        .map((p) => ({
          id: p.id,
          name: p.name,
          traits: p.traits,
          selected: p.id === draftVote,
          reaction: p.id === draftVote ? "surprise" : "dance",
        })),
    [roomState?.players, draftVote],
  );

  const myOutcome = useMemo(() => {
    if (!roundResolved || !myPlayerId || !roomState) return null;
    const owner = roomState.players.find((p) => p.id === roundResolved.ownerPlayerId);
    const pointsDelta = roundResolved.scoreDeltas
      .filter((d) => d.playerId === myPlayerId)
      .reduce((sum, d) => sum + d.delta, 0);
    const myChoice = roundResolved.votes.find((v) => v.voterId === myPlayerId)?.choiceId ?? null;
    return {
      ownerName: owner?.name ?? "?",
      wasOwner: roundResolved.ownerPlayerId === myPlayerId,
      guessedCorrectly: myChoice === roundResolved.ownerPlayerId,
      pointsDelta,
      myTraits: me?.traits ?? draftTraits,
      myName: me?.name ?? (name || "Toi"),
      rankLabel:
        roundResolved.track.rank != null
          ? rankLabel(roomState.musicSource, roundResolved.track.rank, owner?.name ?? "?")
          : null,
    };
  }, [roundResolved, myPlayerId, roomState, me, draftTraits, name]);

  return (
    <>
      <Stage>{renderScreen()}</Stage>
      {me?.isLeader && (roomState?.phase === "REVEAL" || roomState?.phase === "LEADERBOARD") && (
        <SkipButton onClick={actions.advance} />
      )}
      {me?.isLeader && roomState?.phase && roomState.phase !== "LOBBY" && (
        <ResetButton
          onClick={() => {
            if (window.confirm("Réinitialiser la partie ? Tout le monde reviendra sur l'écran d'ajout des joueurs.")) {
              actions.resetGame();
            }
          }}
        />
      )}
    </>
  );

  function renderScreen() {
    if (!myPlayerId || !me) {
      return <JoinScreen code={code} setCode={setCode} onJoin={() => actions.join(code)} error={joinError} />;
    }
    if (me.status !== "READY") {
      return spotifyDone ? (
        <CharacterEditorScreen
          traits={draftTraits}
          hairOptions={HAIR_STYLES}
          skinOptions={SKIN_SWATCHES}
          outfitOptions={OUTFIT_SWATCHES}
          accOptions={ACCESSORIES}
          onHair={setHair}
          onSkin={setSkin}
          onOutfit={setOutfit}
          onAcc={setAcc}
          name={name}
          onName={setName}
          onSubmit={() => actions.submitTraits(draftTraits, name)}
        />
      ) : (
        <SpotifyConnectScreen
          onConnect={() => {
            const roomCode = roomState?.roomCode ?? code;
            window.location.href = `${serverHttpBase()}/spotify/player/login?roomCode=${encodeURIComponent(roomCode)}&playerId=${encodeURIComponent(myPlayerId)}`;
          }}
          onSkip={() => setSpotifyDone(true)}
        />
      );
    }

    switch (roomState?.phase) {
      case "LOBBY":
        return me.isLeader ? (
          <LeaderLobbyScreen
            name={me.name}
            traits={me.traits!}
            lobbyChars={roomState.players.filter((p) => p.id !== myPlayerId)}
            allReady={roomState.allReady}
            musicSource={roomState.musicSource}
            onSetMusicSource={actions.setMusicSource}
            onStart={(maxRounds) => actions.startGame(maxRounds)}
          />
        ) : (
          <WaitingRoomScreen
            name={me.name}
            traits={me.traits!}
            lobbyChars={roomState.players.filter((p) => p.id !== myPlayerId)}
          />
        );
      case "VOTING":
        return roomState.round ? (
          <VoteScreen
            cards={voteCards}
            onToggle={(id) => !voteLocked && setDraftVote((v) => (v === id ? null : id))}
            onSend={() => {
              if (!draftVote || !roomState.round) return;
              actions.submitVote(roomState.round.roundId, draftVote);
              setVoteLocked(true);
            }}
            locked={voteLocked}
            votingDeadlineTs={roomState.round.votingDeadlineTs}
            totalVoteMs={roomState.round.totalVoteMs}
            votesReceived={voteProgress?.votesReceived ?? 0}
            votesExpected={voteProgress?.votesExpected ?? roomState.players.length}
            roundIndex={roomState.round.roundIndex}
          />
        ) : null;
      case "REVEAL":
        return myOutcome ? <RoundResultScreen outcome={myOutcome} /> : null;
      case "LEADERBOARD":
        return leaderboard ? (
          <MobileLeaderboardScreen
            standings={leaderboard.standings}
            myPlayerId={myPlayerId}
            isFinal={false}
            nextRoundAtTs={leaderboard.nextRoundAtTs}
          />
        ) : null;
      case "GAME_OVER":
        return leaderboard ? (
          <MobileLeaderboardScreen standings={leaderboard.standings} myPlayerId={myPlayerId} isFinal />
        ) : null;
      default:
        return (
          <WaitingRoomScreen
            name={me.name}
            traits={me.traits!}
            lobbyChars={roomState?.players.filter((p) => p.id !== myPlayerId) ?? []}
          />
        );
    }
  }
}

/** REVEAL/LEADERBOARD also auto-advance after a fixed display duration (server
 * timer) — this lets the leader skip ahead sooner, the only manual game control
 * left now that the TV has no clickable buttons. */
function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        right: 10,
        top: "max(8px, env(safe-area-inset-top))",
        font: "700 12px 'Nunito',sans-serif",
        padding: "6px 12px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: "#FFB34D",
        color: "#452A05",
        boxShadow: "0 4px 0 #C9832F",
        zIndex: 10,
      }}
    >
      Passer →
    </button>
  );
}

/** Leader-only abort — jumps straight back to LOBBY from any phase (asks for
 * confirmation first since it discards the current game's scores/progress). */
function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        left: 10,
        top: "max(8px, env(safe-area-inset-top))",
        font: "700 12px 'Nunito',sans-serif",
        padding: "6px 12px",
        borderRadius: 999,
        border: "2px solid #FF6B5A",
        cursor: "pointer",
        background: "rgba(29,20,38,.9)",
        color: "#FF6B5A",
        zIndex: 10,
      }}
    >
      ↺ Réinitialiser
    </button>
  );
}
