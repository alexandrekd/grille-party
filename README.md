# Grillé !

A party game for a living room: one big screen (the "host") shows a shared dancefloor while players join from their phones, build a 2D character, and vote each round on whose mystery song is playing — including the song's own owner, who's bluffing along with everyone else.

This repo is a full-stack MVP: real React frontends, a real Node/WebSocket backend, and a real scoring engine. Spotify is **stubbed** (fixture "top tracks" per player, no real OAuth or audio playback yet) — see [`apps/server/src/integrations/spotify`](apps/server/src/integrations/spotify) for the seam where real Spotify integration plugs in later.

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

## Testing

```
npm run test        # server: scoring, track pool, room state machine, WS integration
npm run typecheck    # whole monorepo
```

The WS integration test (`apps/server/src/ws/server.integration.test.ts`) specifically asserts that the host connection never receives a raw frame containing `voterId`/`choiceId` before a round resolves — the one security-relevant property in the protocol.

## Design notes / known limitations (MVP)

- **Spotify is stubbed.** Fixture tracks are partitioned across players on join; swapping in real OAuth + Web Playback SDK only touches `apps/server/src/integrations/spotify`.
- **No host auth.** The last connection to claim a room code becomes its TV — fine for a trusted living-room game, not for anything public-facing.
- **QR joining is visual-only** for now; the 4-digit code is the real join path.
- **Character editor** exposes 4 trait rows (coiffure/peau/tenue/accessoire) — hair color and pants use fixed defaults, matching the original design.
- Timing constants (vote window, reveal/leaderboard display duration, default round count) live in `packages/shared/src/domain/config.ts` and are reasonable defaults, not specified anywhere upstream.
- The mobile "résultat du round" and "classement" screens are original designs (not covered by the source mockups) built to match the app's established visual language.
