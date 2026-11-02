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
```

## Demo boundaries

Use the labelled local demo account to enter creator or community mode. Session, battle examples, activity, votes, wallet examples, and selected preferences persist in this browser only. Use **Reset demo data** in a workspace sidebar to clear the demo state. No Supabase, Twitch, OpenAI, API server, real authentication, live stream, or authoritative transaction service is connected.

WebGL scenes use procedural geometry, are lazy-loaded on capable desktop viewports, and have CSS fallback compositions. Three mini-games are playable locally; remaining game concepts are preview-only.

See `docs/` for product requirements, route map, technical architecture, design system, and implementation roadmap.
