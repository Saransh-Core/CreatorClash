# API Documentation

**Status:** The Express routes and Supabase RPC calls are implemented in source. Persistent operations require a configured Supabase project with both migrations applied. They have not been integration tested against PostgreSQL.

Base path: `/api`. All product routes except health require `Authorization: Bearer <Supabase access token>`. The API verifies tokens with Supabase Auth and uses the caller token for database access, preserving RLS. No service-role key is used by the browser or current API.

## Route groups

- `GET /health`
- Creators: `GET /creators`, `PUT /creators/me`
- Battles: `GET/POST /battles`, `GET /battles/:battleId`, `GET /battles/invitations`, `POST /battles/invitations/:invitationId/respond`
- Matchmaking: `POST/DELETE /matchmaking/queue`, `GET /matchmaking/opponents`, `GET /matchmaking/proposals`, `POST /matchmaking/proposals`, `POST /matchmaking/proposals/:proposalId/respond`
- Challenges: `POST /challenges/suggestions/generate`, `GET/POST /challenges`, `POST /challenges/:challengeId/voting/open`, `POST /challenges/:challengeId/voting/close`, `POST /challenges/:challengeId/votes`, `POST /challenges/:challengeId/approvals`, `PATCH /challenges/:challengeId/options/:optionId`
- Games: `POST /games/sessions`, `GET /games/sessions/:sessionId`, `POST /games/sessions/:sessionId/start`, `GET /games/sessions/:sessionId/next-question`, `POST /games/sessions/:sessionId/answers`, `POST /games/sessions/:sessionId/reaction`, `POST /games/sessions/:sessionId/finalize`, `GET /games/sessions/:sessionId/results`
- Wallet: `GET /wallet`, `GET /wallet/transactions`, `POST /wallet/support`, `POST /wallet/rewards/:rewardId/redeem`

Bodies are validated with Zod. Competitive lifecycle, game scoring/timing and wallet mutations are routed through database functions intended to enforce ownership and atomicity. OpenAI challenge generation uses the server-side `OPENAI_API_KEY`; without it generation returns an unavailable response. No Twitch OAuth, Helix, or EventSub HTTP routes are implemented yet; `connected_accounts` is schema groundwork only.

## Errors and operation

Errors use `{ "error": { "code": string, "message": string } }`. The API has centralized error handling, CORS allowlisting, Helmet, JSON size limits, bearer-token redaction, and global/per-generation rate limits. No migration or database endpoint has been verified against a live/local Supabase instance; consult `SECURITY.md` and `DEPLOYMENT.md` before integration use.
