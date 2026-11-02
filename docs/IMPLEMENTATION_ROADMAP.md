# Creator Clash — Implementation Roadmap

## Implemented foundations

- Existing React, TypeScript and Vite application preserved with separated public, creator and community route areas.
- Optional Supabase Auth frontend and bearer-token API transport; local demo content remains labelled as demo.
- Express API modules for creator profiles, battle invitations, matchmaking, challenge generation/voting/approval, game sessions, and wallet reads/spend/redeem operations.
- Supabase migrations for identity and battle invitations plus competition lifecycle, game, matchmaking, challenge, wallet, championship, reward and notification schema.
- Dark Samurai tokens applied to the shared application stylesheet; generated original samurai artwork is used in the public hero.
- Existing optional immersive 3D scenes retained and code-split.

## Database-backed capabilities (implementation present; requires local database verification)

Migration `202611020002_competition_games_wallet.sql` adds authenticated, database-authoritative Quick Quiz and Reaction Rush actions, matchmaking proposals requiring both creators, challenge selection and dual approval, separate wallet ledgers with atomic spend/redeem RPCs and idempotency keys, championship/reward/notification tables, and competition event records. No migration has been applied or tested against PostgreSQL in this workspace. Do not treat these paths as production verified.

The frontend still uses clearly labelled browser demos for mini-games and sample wallet/competition surfaces; complete live API UI integration is outstanding. Do not infer real scores, Twitch presence, participation rewards, or balances from demo views.

## Next work

1. Apply migrations and seed data to a disposable local Supabase stack; resolve SQL/runtime and RLS issues.
2. Add integration tests for authenticated ownership, battle lifecycle, game timing/scoring, challenge approvals, and wallet idempotency.
3. Wire selected frontend routes to authenticated API queries/mutations with explicit loading, error, and empty states.
4. Implement Twitch OAuth token exchange and encrypted token storage, then Helix live status and EventSub lifecycle using registered Twitch credentials and documented scopes.
5. Add operational workflows, observability, moderation, and deployment configuration only after local verification.

## External configuration and limits

Supabase URL and anon key are required for persistent API operations. OpenAI key/model are optional; challenge generation returns a clear unavailable response without the key. Twitch client credentials, callback URL, encryption key management, EventSub callback hosting, and approved scopes are not configured. No service-role, Twitch, or OpenAI secret belongs in a `VITE_` variable. Migrations have not been applied remotely.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` from the root. Automated API tests do not replace database integration tests; verify SQL against local Supabase before using any persistent feature.
