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
import { useMobileSocket } from "./state/useMobileSocket.js";
import type { VoteCard } from "./state/useMockMobileState.js";
import { JoinScreen } from "./screens/JoinScreen.js";
import { SpotifyConnectScreen } from "./screens/SpotifyConnectScreen.js";
import { CharacterEditorScreen } from "./screens/CharacterEditorScreen.js";
import { WaitingRoomScreen } from "./screens/WaitingRoomScreen.js";
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
  const [spotifyDone, setSpotifyDone] = useState(false);
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
    };
  }, [roundResolved, myPlayerId, roomState, me, draftTraits, name]);

  return (
    <Stage>{renderScreen()}</Stage>
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
        <SpotifyConnectScreen onConnect={() => setSpotifyDone(true)} onSkip={() => setSpotifyDone(true)} />
      );
    }

    switch (roomState?.phase) {
      case "LOBBY":
        return (
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
            onChangeMind={() => setVoteLocked(false)}
            locked={voteLocked}
            votingDeadlineTs={roomState.round.votingDeadlineTs}
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
            nextRoundInSec={leaderboard.nextRoundInSec}
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
