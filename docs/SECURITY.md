# Security

**Status:** Supabase JWT verification and caller-scoped access are implemented in the API. SQL defines RLS and RPC authorization for identity, competition, game, matchmaking, challenges and wallet. The migrations have not been run against a database here, so policy and function behavior remains unverified.

## Current controls

- Dotenv files, private keys, certificates, credentials, and local secrets are excluded by the root `.gitignore`; `.env.example` files are explicitly allowed.
- API configuration is parsed with Zod before startup. Production values must be provided through the deployment secret store.
- Helmet supplies HTTP security headers; CORS uses an explicit allowlist; JSON bodies are limited to 1 MB; API requests are rate limited.
- Pino request logs redact authorization and cookie headers. Request bodies and secret values are not intentionally logged.
- Unhandled errors return a generic response; detailed error data is written only to the server logger.
- API authentication verifies bearer tokens with Supabase Auth and passes the same caller token to a Supabase client using only the anon key. There is no service-role key in the API or browser configuration.
- RLS separates owner/participant reads across the schema. Sensitive competition, game, challenge and wallet actions use database functions; client roles receive no wallet balance or ledger write grants. The second migration also removes the initial broad select grant on legacy Twitch token storage and re-grants only safe metadata columns.
- Quick Quiz correct answers are not selectable through client grants; per-player question delivery is a database RPC. Twitch encrypted token columns are not granted to authenticated clients.

## Required before production

Before production, apply and validate migrations against local Supabase, add database integration tests for ownership, game timing, approvals, wallet idempotency and concurrency, review SECURITY DEFINER functions, add invitation expiry cleanup, token/secret rotation, monitoring and backups, and complete a security review. Never expose `SUPABASE_SERVICE_ROLE_KEY`, Twitch secrets, or OpenAI keys through `VITE_` variables or client bundles.

## Twitch setup boundary

Twitch OAuth, Helix, and EventSub handlers are not implemented. When implementing them, register an application in the Twitch Developer Console, set an exact HTTPS callback URL, and keep client secret and token encryption keys in the API secret store. Use OAuth authorization code flow with state validation and request only scopes required by enabled endpoints. Public stream status can use Helix Get Streams; Twitch documents `stream.online` and `stream.offline` EventSub types with no authorization requirement. Webhook subscriptions themselves use an app access token. Chat access requires separate chat-specific authorization and must not be implied by linking an account. See Twitch's [scope guide](https://dev.twitch.tv/docs/authentication/scopes/), [EventSub subscription guide](https://dev.twitch.tv/docs/eventsub/manage-subscriptions/), and [subscription types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types).
