# Creator Clash — Technical Architecture

**Status:** Existing frontend retained. Optional Supabase Auth and authenticated Express modules exist for creator profiles, battles, matchmaking, challenges, games, and wallet operations. The two SQL migrations are unverified against PostgreSQL. OpenAI generation is optional and credential-gated. Twitch OAuth/Helix/EventSub are not implemented; the schema only reserves linked-account storage.

## Current repository shape

```text
apps/web/                 React 19 + TypeScript + Vite single-page app
  src/app/                providers and React Router route tree
  src/components/         shared layout, data, UI, and scene primitives
  src/features/           auth, public, creator, community, games, director
  src/services/           centralized illustrative demo data
  src/stores/             Zustand browser-local demo session and interactions
  src/types/              domain and demo types
  src/styles/             Tailwind v4 and product design system CSS
  public/                 local static assets
  package.json            npm workspace scripts and dependencies
  package-lock.json       npm lockfile
apps/api/                 Express 5 + TypeScript modular monolith
  src/config/             Zod-validated environment configuration
  src/middleware/         standard errors and not-found responses
  src/modules/            health, creators, battles, matchmaking, challenges, games, wallet
  src/shared/             structured logger and application errors
  test/                   API HTTP tests
  docs/                   product and architecture source documents
```

## Runtime boundaries

```text
Browser demo
 React + TypeScript + Vite
 React Router | TanStack Query provider | Zustand local demo state
 React Hook Form + Zod | Tailwind CSS | Lucide | Motion
 Lazy Three.js / React Three Fiber scenes
      │ authenticated HTTPS API (partial frontend integration)
      ▼
Node.js + Express + TypeScript API
 Supabase Auth + PostgreSQL | Twitch OAuth/EventSub future | optional OpenAI challenge generation
```

The frontend includes a QueryClient provider, optional Supabase Auth, and typed/validated API clients. Creator profiles and battles have authenticated API paths. Other showcase experiences remain clearly labelled browser demos until their frontend is wired to the API. `stores/demoStore.ts` is never authoritative. Backend routes are listed in `docs/API_DOCUMENTATION.md`.

## Frontend architecture

- Feature-based folders keep route-level experiences together.
- Layouts separate public navigation from creator/community workspaces.
- Shared presentational components provide page headings, panels, avatars, status and demo labels.
- React Hook Form + Zod validate form input; API routes repeat validation at the trust boundary.
- Zustand is scoped to cross-page local demo interactions and persists safe demo state only.
- React Router establishes explicit public, creator, community, authentication, and nested battle/game routes.
- Motion for React provides interface transitions; CSS tokens define timing/easing.
- `ImmersiveScene` gates WebGL by viewport, visibility, device width, and reduced-motion settings. Its R3F/Three module is dynamically loaded; DOM content and CSS fallback do not depend on the canvas.
- TanStack Query fetches authenticated creator and battle resources when configured.

## Future backend trust boundaries

Node.js/Express verifies Supabase access tokens with `auth.getUser`, then creates a caller-scoped Supabase client using the public anon key and bearer token. PostgreSQL RPCs own battle creation and invitation response. The current narrow slice does not implement a service-role client. Future services must own competition transitions, participation validation, Twitch processing, AI requests, and all financial-like ledger writes. The client must never set authoritative Support Token or Clash Coin balances.

Supabase Auth provides identity; the API verifies JWTs and uses caller-scoped database access. Migrations define identity, competition, matchmaking, challenge, game, wallet, championship, reward and notification tables with RLS and selected SECURITY DEFINER RPCs. These are not validated until locally applied and tested. Twitch account token exchange/storage lifecycle is not implemented. Any future server-only service-role access must keep credentials out of browser code and narrowly scope access.

## Ledger safety

Support Tokens and Clash Coins require server-authorized ledger events with actor, reason, source event, timestamp, and unique idempotency key. Validate eligibility and available balance within a transaction. Use database constraints/locking or an equivalent concurrency design to prevent double awards and overspending. Derive balance from the ledger or maintain a transactionally updated projection with reconciliation. Never trust localStorage or browser UI state.

## Twitch and AI

Twitch OAuth code exchange, token protection, scope management, revocation, and EventSub signature/timestamp verification belong on the API; none of these endpoints are implemented yet. Register exact callback URLs, keep client secrets and token-encryption keys server-side, validate OAuth state, and request only needed scopes. Twitch documents `stream.online` and `stream.offline` subscriptions with no authorization requirement; webhook subscription creation uses an app access token. Linking an account does not automatically grant chat access. See the official [scope guide](https://dev.twitch.tv/docs/authentication/scopes/), [EventSub guide](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/), and [subscription types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types). Webhook processing must be idempotent and tolerate at-least-once delivery. Do not promise rewards for arbitrary chat messages or polls; validate participation against explicit server-held rules.

OpenAI calls belong on the API. Validate structured output, apply moderation and creator review, version prompts, set timeouts/spend limits, and keep a non-AI fallback. Generated text cannot award tokens or alter competition results.

## Configuration and quality

Root `.gitignore` excludes dotenv files, secret files, private keys, certificates, service credentials, and build/dependency output. `.env.example` files may contain placeholders only. API variables are validated at startup with Zod. Strict TypeScript, Oxlint, npm lockfile, typecheck, lint, production build, and API tests run through the workspace scripts.

## Immersive scene architecture and budgets

Three.js is used through React Three Fiber and selective Drei helpers. Scene imports are code-split; scenes are mounted only when near the viewport, visible, and above the mobile breakpoint with motion enabled. Pixel ratio is capped and static CSS remains visible beneath WebGL. Scenes use procedural low-complexity geometry and no remote assets. Arena competitors use opposing slow rotations and low-amplitude scale breathing; the center marker and stage ring animate at restrained cadences; trophy halos orbit independently; and the coin has a subtle float with small orbit details. Hidden tabs/offscreen/unmount behavior should be profiled; demand rendering and explicit context-loss recovery remain follow-up performance work. The shared interface follows the Dark Samurai palette documented in `DESIGN_SYSTEM.md`.

Target (not measured) public Core Web Vitals remain LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile. The non-3D route budget target is ≤ 200 KB compressed. Validate with bundle analysis, traces, representative desktop/mobile devices, reduced motion, unavailable WebGL, route remount and cleanup tests before production.

## Deployment and open decisions

Still to decide: API deployment/topology, session transport and CSRF/CORS policy, Supabase browser versus API access per data class, queue needs for EventSub/AI, privacy/retention requirements, moderation policy, operational observability, and launch service-level objectives.
