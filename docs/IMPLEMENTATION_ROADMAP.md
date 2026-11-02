# Creator Clash — Implementation Roadmap

**Status:** Phase 0 foundation is complete. A broad frontend-only product preview is implemented; production service work remains unstarted.

## Completed — Phase 0: Project foundation

- Root npm workspace and Vite React/TypeScript web application.
- Strict TypeScript, Tailwind v4, Oxlint, route shell, shared layout components, product tokens, `.gitignore`, and scripts for lint/typecheck/build.
- Preserve the five planning documents as product/architecture references.

## Completed — Frontend product preview

- Public landing, arena discovery/detail, creator directory/profile, championship, how-it-works, not-found, and demo account screens.
- Shared local demo account; creator/community route boundaries and mode switch.
- Creator overview, battles, battle creation, matchmaking, invitations/history, lifecycle room, curated Challenge Director, mini-games, championship, rewards, analytics, settings/Twitch preparation, and OBS preview.
- Community overview, creator discovery/follows, local activities/votes, creator support, championship, Support Token wallet, rewards, and settings.
- Central illustrative data; browser-persisted demo session and interactions; explicit reset.
- Three locally playable mini-games and preview states for six additional concepts.
- Procedural lazy-loaded R3F arena/trophy/coin scenes with CSS fallback.
- Simplified workspace navigation: nine creator destinations and six community destinations, with community profile/preferences under one route.
- Expanded the creator taxonomy to include coding/technology, fitness, and an open-ended Other category; Challenge Studio offers at least three curated prompts per category and supports editing.
- Removed local Support Token and Clash Coin balance mutations. Support and cosmetic actions are preview-only until a server-authoritative ledger exists.
- Added an optional typed API transport boundary and a placeholder-only `apps/web/.env.example`; no API calls or secrets are configured.

## Next phases — Production capabilities

### Identity and account foundation

Integrate Supabase Auth and API JWT verification, onboarding and profile setup, account recovery, secure session strategy, and authorized Creator/Community modes. Replace the local demo gate and identify data that can be public.

### Competition and participation services

Define and implement server-side battle lifecycle, scheduling, invitation delivery, results and review, rules, cancellations, moderation, participation verification, rate limits, and idempotency. The current client state machine is only illustrative.

### Wallet and reward ledger

Formalize eligibility and product policy, then implement transactional Support Token/Clash Coin ledger services, audit trail, authorization, reversals, concurrency controls, reconciliation, and server-confirmed UI updates. Never port local demo balance mutations as authoritative behavior.

### Twitch, EventSub, and AI Challenge Director

Implement server-owned Twitch OAuth and event verification under documented scopes and provider limits. Add validated, moderated, creator-reviewed OpenAI suggestions with cost controls and fallback. No integration is currently connected.

### Operations and production readiness

Add migrations/RLS, deployment configuration, monitoring, rate/abuse controls, backups, data retention, security review, end-to-end tests, accessibility/visual regression, and device/network performance measurements. Validate WebGL failure, repeated scene cleanup, reduced motion, and mobile performance.

## Verification commands

From `apps/web`: `npm run lint`, `npm run typecheck`, and `npm run build`. These validate frontend source and bundle compilation; they do not test production backend behavior or replace browser/device QA.
