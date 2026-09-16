import { useEffect } from "react";
import { useHostSocket } from "./state/useHostSocket.js";
import { Stage } from "./components/Stage.js";
import { serverHttpBase } from "./lib/serverHttpBase.js";
import { useSpotifyPlayback } from "./lib/useSpotifyPlayback.js";
import { playApplause, playCrowdOhh, playLeaderboardJingle, playVictoryFanfare } from "./lib/sfx.js";
import { LobbyScreen } from "./screens/LobbyScreen.js";
import { RoundScreen } from "./screens/RoundScreen.js";
import { RevealScreen } from "./screens/RevealScreen.js";
import { LeaderboardScreen } from "./screens/LeaderboardScreen.js";

export function App() {
  const { roomState, voteProgress, roundResolved, leaderboard, spotifyCommand } = useHostSocket();
  const { connected: spotifyConnected } = useSpotifyPlayback(roomState?.roomCode ?? null, spotifyCommand);

  // The host OAuth callback redirects back here with ?spotify=ok|error — nothing to
  // read (useSpotifyPlayback's `connected` is the real signal once the SDK confirms
  // it), just tidy the URL.
  useEffect(() => {
    if (window.location.search.includes("spotify=")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Music only plays during VOTING — REVEAL/LEADERBOARD were dead silent
  // otherwise, jarring between rounds. Triggered by the data itself (not just the
  // phase) so it always picks the right sting even if this fires from a delayed
  // WS message or the HTTP poll backstop catching up.
  useEffect(() => {
    if (!roundResolved) return;
    const nonOwnerVotes = roundResolved.votes.filter((v) => v.voterId !== roundResolved.ownerPlayerId);
    const correctCount = nonOwnerVotes.filter((v) => v.choiceId === roundResolved.ownerPlayerId).length;
    const ratio = nonOwnerVotes.length > 0 ? correctCount / nonOwnerVotes.length : 0;
    if (ratio >= 0.5) playApplause();
    else playCrowdOhh();
  }, [roundResolved?.roundId]);

  useEffect(() => {
    if (roomState?.phase === "LEADERBOARD") playLeaderboardJingle();
    if (roomState?.phase === "GAME_OVER") playVictoryFanfare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.phase]);

  return (
    <>
      <Stage>{roomState ? renderScreen() : <ConnectingScreen />}</Stage>
      {roomState && roomState.phase !== "LOBBY" && !spotifyConnected && <SpotifyLostIndicator />}
    </>
  );

  function renderScreen() {
    if (!roomState) return null;
    switch (roomState.phase) {
      case "LOBBY":
        return (
          <LobbyScreen
            roomCode={roomState.roomCode}
            players={roomState.players}
            allReady={roomState.allReady}
            spotifyConnected={spotifyConnected}
            onConnectSpotify={() => {
              window.location.href = `${serverHttpBase()}/spotify/host/login?roomCode=${encodeURIComponent(roomState.roomCode)}`;
            }}
          />
        );
      case "VOTING":
        return roomState.round ? (
          <RoundScreen
            players={roomState.players}
            roundIndex={roomState.round.roundIndex}
            maxRounds={roomState.maxRounds}
            votingDeadlineTs={roomState.round.votingDeadlineTs}
            totalVoteMs={roomState.round.totalVoteMs}
            votesReceived={voteProgress?.votesReceived ?? 0}
            votesExpected={voteProgress?.votesExpected ?? roomState.players.length}
          />
        ) : null;
      case "REVEAL":
        return roundResolved ? (
          <RevealScreen
            players={roomState.players}
            ownerPlayerId={roundResolved.ownerPlayerId}
            track={roundResolved.track}
            musicSource={roomState.musicSource}
            votes={roundResolved.votes}
            scoreDeltas={roundResolved.scoreDeltas}
            reactions={roundResolved.reactions}
          />
        ) : null;
      case "LEADERBOARD":
      case "GAME_OVER":
        return leaderboard ? (
          <LeaderboardScreen
            standings={leaderboard.standings}
            players={roomState.players}
            roundIndex={roomState.roundIndex}
            maxRounds={roomState.maxRounds}
            isFinal={leaderboard.isFinal}
            nextRoundAtTs={leaderboard.nextRoundAtTs}
          />
        ) : null;
      default:
        return null;
    }
  }
}

/** Read-only — the TV has no clickable controls outside the Lobby, this is purely
 * a signal that the host needs to reconnect Spotify from there before the next
 * round, since a play/stop command silently going nowhere is otherwise invisible
 * mid-game (see useSpotifyPlayback's token-loss handling). */
function SpotifyLostIndicator() {
  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(36,26,46,.9)",
        border: "2px solid #FF6B5A",
        borderRadius: 999,
        padding: "8px 16px",
        font: "700 13px 'Nunito',sans-serif",
        color: "#FF6B5A",
      }}
    >
      🔇 Spotify déconnecté — à reconnecter depuis le lobby
    </div>
  );
}

function ConnectingScreen() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        color: "#8E7F92",
        font: "700 24px 'Fredoka',sans-serif",
      }}
    >
      Connexion à la partie…
    </div>
  );
}
