# Creator Clash — Information Architecture

**Status:** Existing frontend route map is preserved. The same account can enter either Creator or Community workspace. Optional Supabase Auth protects workspace routes when configured; otherwise a clearly labelled browser demo profile is used. Creator/battle pages call the API only when both Supabase Auth and API configuration are present.

## Application model

One React application serves one public experience plus Creator and Community workspace modes. `AuthGate` uses one Supabase Auth session when configured, or one persisted demo session otherwise. The mode switch changes workspace context without creating another identity. Legacy `/app/creator` and `/app/community` paths redirect to the current routes.

## Route map

### Public

- `/` — product landing page
- `/arena` — searchable and filterable competition directory
- `/arena/:battleId` — competition detail
- `/championship` — monthly event introduction
- `/creators` and `/creators/:id` — directory and creator profile
- `/how-it-works` — product flow
- `/login`, `/signup`, `/forgot-password` — Supabase Auth when configured; explicitly labelled local demo fallback otherwise

### Creator workspace

- `/creator` — overview
- `/creator/battles` — API-backed RLS-visible battles when configured; local sample list otherwise
- `/creator/battles/create` — API-backed creator-versus-creator invitation when configured; validated local demo wizard otherwise
- `/creator/battles/find` — opponent discovery
- `/creator/battles/invitations` — API-backed accept/decline when configured; local invitation responses otherwise
- `/creator/battles/history` — completed sample competitions
- `/creator/battles/:battleId` — demo lifecycle and competition detail
- `/creator/ai-director` — Challenge Studio with category-matched curated suggestions, local voting, and acceptance states
- `/creator/mini-games` and `/creator/mini-games/:gameId` — game hub and game/preview pages
- `/creator/championship` — creator championship view
- `/creator/rewards` — demo Clash Coin balance and cosmetics
- `/creator/analytics` — illustrative metrics and charts
- `/creator/settings` — creator settings and Twitch readiness
- `/creator/integrations/twitch` — disconnected Twitch state
- `/creator/overlay` — local OBS browser-source preview

### Community workspace

- `/community` — overview
- `/community/discover` — creators and competition discovery
- `/community/activities` — local voting and eligible activity examples
- `/community/support` — support confirmation preview; no client-side token transfer
- `/community/championship` — rounds and popularity rankings
- `/community/wallet` — separate Support Token history
- `/community/rewards` — participation milestones
- `/community/profile` — local profile and display preferences
- `/community/settings` — legacy redirect to `/community/profile`

Unknown public paths render a not-found screen. Workspace routes require a session and redirect to login otherwise. Supabase route gating does not replace server-side authorization; API tokens and database RLS enforce data access.

## Navigation and hierarchy

Public navigation provides Home, Explore competitions, Creators, Championship, How it works, and Sign in. Creator navigation has nine destinations: Overview, Battles, Find opponents, Challenge Studio, Activities, Championship, Rewards, Analytics, and Settings. Community navigation has six destinations: Home, Discover, Activities, Championship, Wallet, and Profile. Each workspace has a dedicated responsive sidebar, active route indication, public-site exit, Creator/Community mode switch, account control, and demo reset. On compact screens the sidebar collapses behind a keyboard-operable menu.

## Future service boundaries

The UI uses `services/competitionApi.ts` plus `services/apiClient.ts` for creator directory and battle invitation endpoints when configured. Other feature areas still read curated data from `services/demoData.ts` and locally persisted state from `stores/demoStore.ts`. Local votes, follows, mini-games and activity completion remain demo interactions. Wallet balances and transaction history are illustrative only; support, activity, and cosmetic interactions do not mutate balances. Never treat browser state as verified eligibility, battle results, Twitch activity, or a wallet ledger.
