# Creator Clash — Technical Architecture

**Status:** Frontend foundation and locally interactive demo implemented. No production API, Supabase project, database schema, Twitch integration, or OpenAI service is present.

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
  docs/                   product and architecture source documents
```

## Runtime boundaries

```text
Browser demo
 React + TypeScript + Vite
 React Router | TanStack Query provider | Zustand local demo state
 React Hook Form + Zod | Tailwind CSS | Lucide | Motion
 Lazy Three.js / React Three Fiber scenes
      │ future HTTPS API (not currently implemented)
      ▼
Future Node.js + Express + TypeScript API
 Supabase Auth + PostgreSQL | Twitch OAuth/EventSub | OpenAI
```

The frontend currently includes a QueryClient provider for future remote state, but has no network service adapter. `services/demoData.ts` is curated demo content. `stores/demoStore.ts` uses localStorage and is not authoritative. `AuthGate` only protects the demo route tree.

## Frontend architecture

- Feature-based folders keep route-level experiences together.
- Layouts separate public navigation from creator/community workspaces.
- Shared presentational components provide page headings, panels, avatars, status and demo labels.
- React Hook Form + Zod validate local demonstration forms; server validation remains mandatory later.
- Zustand is scoped to cross-page local demo interactions and persists safe demo state only.
- React Router establishes explicit public, creator, community, authentication, and nested battle/game routes.
- Motion for React provides interface transitions; CSS tokens define timing/easing.
- `ImmersiveScene` gates WebGL by viewport, visibility, device width, and reduced-motion settings. Its R3F/Three module is dynamically loaded; DOM content and CSS fallback do not depend on the canvas.
- TanStack Query is installed and configured as a provider; it is not yet used to fetch APIs.

## Future backend trust boundaries

Node.js/Express owns identity verification, authorization, competition transitions, participation validation, Twitch processing, AI requests, and all financial-like ledger writes. The client must never set authoritative Support Token or Clash Coin balances.

Supabase Auth provides identity; the API verifies JWTs. PostgreSQL stores profiles, Twitch connection metadata, competitions, participation, ledger events, cosmetics, and audit data. RLS applies to browser-readable data. Service-role credentials remain server-only and constrained to server services.

## Ledger safety

Support Tokens and Clash Coins require server-authorized ledger events with actor, reason, source event, timestamp, and unique idempotency key. Validate eligibility and available balance within a transaction. Use database constraints/locking or an equivalent concurrency design to prevent double awards and overspending. Derive balance from the ledger or maintain a transactionally updated projection with reconciliation. Never trust localStorage or browser UI state.

## Twitch and AI

Twitch OAuth code exchange, token protection, scope management, revocation, and EventSub signature/timestamp verification belong on the API. Webhook processing must be idempotent and tolerate at-least-once delivery. Do not promise rewards for arbitrary chat messages or polls; validate participation against explicit server-held rules.

OpenAI calls belong on the API. Validate structured output, apply moderation and creator review, version prompts, set timeouts/spend limits, and keep a non-AI fallback. Generated text cannot award tokens or alter competition results.

## Configuration and quality

Root `.gitignore` excludes dotenv files, secret files, private keys, certificates, service credentials, and build/dependency output. `.env.example` files may contain placeholders only. Validate production variables at API startup when the API is introduced. Strict TypeScript, Oxlint, npm lockfile, typecheck, lint, and production build are configured for the web workspace.

## Immersive scene architecture and budgets

Three.js is used through React Three Fiber and selective Drei helpers. Scene imports are code-split; scenes are mounted only when near the viewport, visible, and above the mobile breakpoint with motion enabled. Pixel ratio is capped and static CSS remains visible beneath WebGL. Scenes use procedural low-complexity geometry and no remote assets. Arena competitors use opposing slow rotations and low-amplitude scale breathing; the center marker and stage ring animate at restrained cadences; trophy halos orbit independently; and the coin has a subtle float with small orbit details. Hidden tabs/offscreen/unmount behavior should be profiled; demand rendering and explicit context-loss recovery remain follow-up performance work.

Target (not measured) public Core Web Vitals remain LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile. The non-3D route budget target is ≤ 200 KB compressed. Validate with bundle analysis, traces, representative desktop/mobile devices, reduced motion, unavailable WebGL, route remount and cleanup tests before production.

## Deployment and open decisions

Still to decide: API deployment/topology, session transport and CSRF/CORS policy, Supabase browser versus API access per data class, queue needs for EventSub/AI, privacy/retention requirements, moderation policy, operational observability, and launch service-level objectives.
