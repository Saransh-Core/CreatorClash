# Database Schema

Two ordered Supabase migrations define the persistent model. They are source code only: neither has been applied or validated against a PostgreSQL runtime in this workspace.

## Domains and tables

| Domain | Tables |
| --- | --- |
| Identity | `profiles`, `creator_categories`, `creator_profiles`, legacy `twitch_accounts`, `connected_accounts` |
| Competition | `battles`, `battle_participants`, `battle_invitations`, `battle_results`, `battle_events` |
| Matchmaking | `matchmaking_queue`, `matchmaking_history`, `matchmaking_proposals` |
| Challenge Director | `challenges`, `challenge_options`, `challenge_votes`, `challenge_approvals` |
| Games | `game_types`, `game_question_bank`, `game_sessions`, `game_questions`, `game_participants`, `game_answers`, `game_results` |
| Wallet and rewards | `wallets`, append-only `wallet_transactions`, `rewards`, `reward_redemptions` |
| Championship | `championships`, `championship_registrations`, `championship_rounds`, `championship_standings` |
| Notifications | `notifications` |

The initial migration provides account/creator identity and battle invitations. The second adds lifecycle RPCs, matchmaking, AI challenge voting and approvals, two server-authoritative game flows, wallet operations, championships, rewards and notifications. Constraints, indexes and RLS are defined in the SQL. Wallet currencies are separate enum values. Client roles have no balance or ledger write grants; spend/redeem use atomic RPCs with per-wallet idempotency keys. Token grants are service-role-only. Game question answer keys and Twitch encrypted credential columns are not granted to authenticated clients.

Development seed data in `supabase/seed.sql` adds game questions and category taxonomy only; it creates no fake users or production accounts.

## Local verification

Install the Supabase CLI and Docker, then run `supabase start` and `supabase db reset` only against the local stack. Test RLS and RPC behavior with at least two authenticated test accounts. Do not apply unverified migrations to a shared or production database. The SQL has not been run in this workspace because the Supabase/PostgreSQL tooling is unavailable.
