# Creator Clash

Creator Clash is a Twitch-connected creator competition product concept. This repository currently contains a responsive, locally interactive frontend demo across the public website, creator workspace, and community workspace.

## Run locally

Requirements: Node.js 22.12+ (or 20.19+) and npm 10+.

```sh
npm install
npm run dev
```

The Vite server runs from the repository root and serves `apps/web`. The workspace scripts are:

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

The Express API is a separate workspace. Start it with `npm run dev --workspace @creator-clash/api`; its health route is `http://localhost:3000/api/health`. Persistent creator, battle, matchmaking, challenge, game and wallet APIs require Supabase. To enable them, install the Supabase CLI and Docker, run `supabase start` and `supabase db reset` against the local stack, then copy its URL and anon key into `apps/api/.env` and `apps/web/.env.local` using the checked-in examples. Configure the local Auth redirect allowlist for the Vite origin. Never run local reset commands against a remote project.

## Demo boundaries

Without Supabase configuration, use the labelled local demo account to enter creator or community mode. With Supabase configured, login/signup uses one shared account and creator profiles, creator discovery and battle invitations use authenticated API/database paths. Backend APIs and database functions for matchmaking, challenge director, games and wallet operations are implemented in source but the migrations have not been applied or integration-tested; associated frontend experiences remain demo surfaces. Use **Reset demo data** in a demo workspace sidebar to clear browser demo state. Twitch OAuth, Helix, EventSub, live stream controls, and persistent end-to-end game/wallet UI integration are not implemented. OpenAI challenge generation requires a server-side key. No real transactions are enabled. See `docs/` for exact boundaries and local setup.

WebGL scenes use procedural geometry, are lazy-loaded on capable desktop viewports, and have CSS fallback compositions. Three mini-games are playable locally; remaining game concepts are preview-only.

See `docs/` for product requirements, route map, technical architecture, design system, and implementation roadmap.
