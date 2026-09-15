import { useEffect } from "react";
import { useHostSocket } from "./state/useHostSocket.js";
import { Stage } from "./components/Stage.js";
import { serverHttpBase } from "./lib/serverHttpBase.js";
import { useSpotifyPlayback } from "./lib/useSpotifyPlayback.js";
import { LobbyScreen } from "./screens/LobbyScreen.js";
import { RoundScreen } from "./screens/RoundScreen.js";
import { RevealScreen } from "./screens/RevealScreen.js";
import { LeaderboardScreen } from "./screens/LeaderboardScreen.js";

export function App() {
  const { roomState, voteProgress, roundResolved, leaderboard, spotifyCommand, actions } = useHostSocket();
  const { connected: spotifyConnected } = useSpotifyPlayback(roomState?.roomCode ?? null, spotifyCommand);

  // The host OAuth callback redirects back here with ?spotify=ok|error — nothing to
  // read (useSpotifyPlayback's `connected` is the real signal once the SDK confirms
  // it), just tidy the URL.
  useEffect(() => {
    if (window.location.search.includes("spotify=")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <>
      <Stage>{roomState ? renderScreen() : <ConnectingScreen />}</Stage>
      {(roomState?.phase === "REVEAL" || roomState?.phase === "LEADERBOARD") && (
        <AdvanceButton onClick={actions.advance} />
      )}
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
            onStart={() => actions.startGame()}
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

/** REVEAL/LEADERBOARD also auto-advance after a fixed display duration (server
 * timer) — this lets the host skip ahead sooner, per the protocol's `host_advance`. */
function AdvanceButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        font: "700 14px 'Nunito',sans-serif",
        padding: "8px 16px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: "#241A2E",
        color: "#FFF3E8",
      }}
    >
      Continuer →
    </button>
  );
}
