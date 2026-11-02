# Deployment

**Status:** No deployment target or remote Supabase project is configured. The source includes a local-ready API and migration, pending validation against a local Supabase runtime.

## Local API

1. Use the Node/npm versions listed in `README.md`.
2. Copy `apps/api/.env.example` to the ignored `apps/api/.env` for local-only configuration.
3. Run `npm install`, then `npm run dev --workspace @creator-clash/api`.
4. Check `GET http://localhost:3000/api/health`.

## Local Supabase integration

1. Install the Supabase CLI and Docker using the official local-development setup.
2. Run `supabase start` from the repository root.
3. Apply the migration only to local Supabase with `supabase db reset` after reviewing its contents.
4. Copy values from the CLI output into `apps/api/.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) and `apps/web/.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL=http://localhost:3000/api`).
5. Configure the local Supabase Auth site URL/redirect allowlist for `http://localhost:5173`, run the API and web app, and verify signup, creator profile, battle invite, and response flows.

Never run `supabase db reset` against a remote project. No Supabase CLI or local Postgres runtime was available during this implementation, so SQL execution is unverified.

## Production requirements

Choose and document a Node.js hosting target, TLS termination, health probes, process shutdown, log collection, and a production CORS origin. Inject secrets using the host's secret manager; do not bake `.env` files into images. Configure Supabase URL and public anon key only after reviewing RLS; apply reviewed migrations as a controlled release step with backups and rollback guidance. Add external dependency readiness checks before claiming readiness. No deployable production configuration is included in this foundation.
