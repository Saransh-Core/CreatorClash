# Creator Clash Backend Architecture

**Status:** The API foundation and modules for creators, battles, matchmaking, challenge director, games and wallet operations are implemented in source. Supabase behavior is pending local migration/runtime validation. Twitch HTTP integration remains future work.

## Current design

The backend is a modular monolith in `apps/api`, independently buildable and testable beside `apps/web`. HTTP routes adapt transport to feature services; domain rules will remain independent of Express; repositories will own persistence; external integrations will sit behind explicit adapters. Feature domains are planned under `src/modules/` rather than split into services.

The HTTP shell provides Express 5, environment validation, Helmet headers, allowlisted CORS, bounded JSON parsing, structured request logging with authorization/cookie redaction, API rate limiting, a health endpoint, and a standard error boundary. Supabase Auth JWT verification and caller-scoped database access are integrated. Game, matchmaking, challenge and wallet routes call database RPCs; OpenAI challenge suggestions use a server-side key when configured. These persistent paths have not been integration-tested against Supabase.

## Planned module boundaries

Current modules: `health`, `creators`, `battles`, `matchmaking`, `challenges`, `games`, and `wallet`. Planned integration work includes Twitch OAuth, Helix, EventSub processing and fuller frontend data hooks. Championship and notifications currently have schema groundwork, not complete application services.

## Trust model

The API/database are intended to be authoritative for identity, authorization, competition state, game scoring and ledger writes. RPC and RLS behavior must first be validated against local Supabase. The browser cannot write wallet balances, scores, results or trusted timestamps. Current API requests use the Supabase anon key plus the verified caller token; there is no service-role key configured. Realtime events, when introduced, announce persisted state changes and are not proof that an action was valid.

## Local development

Copy `apps/api/.env.example` to `apps/api/.env` and set only local values. The template contains placeholders and is safe to commit. Run `npm run dev --workspace @creator-clash/api`; the development health endpoint is `GET /api/health`.

## Phase sequence

Follow `docs/IMPLEMENTATION_ROADMAP.md`. Each phase must add tests, documentation, and an explicit list of external services and limitations. Passing tests does not establish production readiness.
