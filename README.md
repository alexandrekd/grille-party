# Grillé !

A party game for a living room: one big screen (the "host") shows a shared dancefloor while players join from their phones, build a 2D character, and vote each round on whose mystery song is playing — including the song's own owner, who's bluffing along with everyone else.

This repo is a full-stack MVP: real React frontends, a real Node/WebSocket backend, a real scoring engine, and **real Spotify integration** (OAuth per player + the host's Web Playback SDK). If `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` aren't set, the server falls back to the fixture track pool in [`apps/server/src/integrations/spotify`](apps/server/src/integrations/spotify) and no audio plays — same as before, just silent.

## Layout

```
apps/host/            TV screen app (React + Vite) — lobby, round, reveal, leaderboard
apps/mobile/           Phone controller app (React + Vite) — join, character editor, vote, results
apps/server/            Node WebSocket backend — room/game state machine, scoring, Spotify stub
packages/shared/        Framework-free WS protocol types, domain types, trait-bank data
packages/characters/    The Dancer character component, ported from the design prototype
```

## Running it

Requires Node 22 (see `.nvmrc`).

```
npm install
npm run dev
```

This starts all three services together:
- **server** on `:8787` (WebSocket paths `/ws/host` and `/ws/player`, health check at `/health`)
- **host** on `http://localhost:5173`
- **mobile** on `http://localhost:5174`

Open the host URL in a browser tab (or cast it to a TV) — it displays a room code. Open the mobile URL on your phone(s) to join.

### Playing on real phones (same Wi-Fi)

The mobile dev server binds to all interfaces (`0.0.0.0`) so phones on the same network can reach it, but both apps need to know the server's LAN address — `localhost` only works for you, not for a phone. Set `VITE_WS_URL` to the dev machine's LAN IP before starting:

```
VITE_WS_URL=ws://192.168.1.42:8787 npm run dev
```

(or create `apps/host/.env.local` / `apps/mobile/.env.local` with `VITE_WS_URL=ws://192.168.1.42:8787`). Then open `http://192.168.1.42:5174` on each phone.

## Deploying (no local setup needed)

`render.yaml` at the repo root is a [Render Blueprint](https://render.com/docs/blueprint-spec) that deploys all three services straight from this GitHub repo — no CLI, and it redeploys automatically on every push to `main`:

1. Go to the [Render dashboard](https://dashboard.render.com) → **New +** → **Blueprint**
2. Connect your GitHub account (or authorize just this repo) and pick `grille-party`
3. Render reads `render.yaml` and proposes 3 free services: `grille-server` (the WebSocket backend), `grille-host` (TV screen), `grille-mobile` (phone controller) — click **Apply**
4. Wait for all three to finish deploying (a few minutes). Open the `grille-host` service's URL for the TV screen, and the `grille-mobile` URL on your phone

If `grille-server`'s auto-assigned URL isn't exactly `grille-server.onrender.com` (Render appends a suffix if that name was already taken), update the `VITE_WS_URL` environment variable on both `grille-host` and `grille-mobile` in the Render dashboard to match, then trigger a manual redeploy of those two.

Render's free web services spin down after 15 minutes of inactivity and take ~30-60s to wake back up on the next request — fine for testing, not for an actual party.

## Spotify setup (real playback)

1. Create an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add **two** redirect URIs in the app's Settings (must match the server's own domain — it does the token exchange, not the frontends):
   - `https://grille-server.onrender.com/spotify/player/callback`
   - `https://grille-server.onrender.com/spotify/host/callback`
3. On Render, set on the `grille-server` service:
   - `SPOTIFY_CLIENT_ID` — from the app's Settings (already in `render.yaml`, not secret)
   - `SPOTIFY_CLIENT_SECRET` — from the app's Settings ("View client secret"). Set this **directly in the Render dashboard**, never commit it — `render.yaml` deliberately omits its value (`sync: false`) so Render prompts you for it instead
4. Redeploy `grille-server`

What each side needs:
- **Players** just need a free Spotify account — "Continuer avec Spotify" on the character screen authorizes read-only access to their top tracks (`user-top-read`), no Premium required.
- **The host (TV)** needs a **Premium** account — Spotify's Web Playback SDK refuses to stream on free accounts. Connect it from the "Connecter Spotify (Premium)" button in the Lobby screen before starting the game; if skipped, rounds just play silently, same as the pre-integration MVP.

Track titles/artists are still never shown anywhere in the UI (by design, so nothing spoils who owns a song) — the host only ever receives an opaque track URI to hand to Spotify's playback API, never a human-readable title.

## Testing

```
npm run test        # server: scoring, track pool, room state machine, WS integration
npm run typecheck    # whole monorepo
```

The WS integration test (`apps/server/src/ws/server.integration.test.ts`) specifically asserts that the host connection never receives a raw frame containing `voterId`/`choiceId` before a round resolves — the one security-relevant property in the protocol.

## Design notes / known limitations (MVP)

- **Spotify falls back to a stub** whenever `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` aren't set, or a player skips connecting, or the host skips Premium — fixture tracks fill in per-player so the game never breaks, just plays silently for whoever's missing a real connection.
- **No token persistence.** Host/player Spotify tokens live in server memory only (per `Room`) — a server restart mid-game means reconnecting Spotify again.
- **No host auth.** The last connection to claim a room code becomes its TV — fine for a trusted living-room game, not for anything public-facing.
- **QR joining is visual-only** for now; the 4-digit code is the real join path.
- **Character editor** exposes 4 trait rows (coiffure/peau/tenue/accessoire) — hair color and pants use fixed defaults, matching the original design.
- Timing constants (vote window, reveal/leaderboard display duration, default round count) live in `packages/shared/src/domain/config.ts` and are reasonable defaults, not specified anywhere upstream.
- The mobile "résultat du round" and "classement" screens are original designs (not covered by the source mockups) built to match the app's established visual language.
