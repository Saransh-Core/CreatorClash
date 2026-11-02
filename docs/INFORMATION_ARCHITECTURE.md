# Creator Clash — Information Architecture

**Status:** Implemented frontend route map. Workspace access uses an explicitly labelled local demo profile; production authorization is pending backend integration.

## Application model

One React application serves one public experience plus Creator and Community workspace modes. `AuthGate` protects both workspaces using the same persisted demo session. The mode switch changes workspace context without creating another identity. Legacy `/app/creator` and `/app/community` paths redirect to the current routes.

## Route map

### Public

- `/` — product landing page
- `/arena` — searchable and filterable competition directory
- `/arena/:battleId` — competition detail
- `/championship` — monthly event introduction
- `/creators` and `/creators/:id` — directory and creator profile
- `/how-it-works` — product flow
- `/login`, `/signup`, `/forgot-password` — frontend-only demo account screens

### Creator workspace

- `/creator` — overview
- `/creator/battles` — all competitions
- `/creator/battles/create` — validated local demo battle wizard
- `/creator/battles/find` — opponent discovery
- `/creator/battles/invitations` — local invitation responses
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

Unknown public paths render a not-found screen. Workspace routes require a local demo profile and redirect to login otherwise. The demo gate is not production identity security.

## Navigation and hierarchy

Public navigation provides Home, Explore competitions, Creators, Championship, How it works, and Sign in. Creator navigation has nine destinations: Overview, Battles, Find opponents, Challenge Studio, Activities, Championship, Rewards, Analytics, and Settings. Community navigation has six destinations: Home, Discover, Activities, Championship, Wallet, and Profile. Each workspace has a dedicated responsive sidebar, active route indication, public-site exit, Creator/Community mode switch, account control, and demo reset. On compact screens the sidebar collapses behind a keyboard-operable menu.

## Future service boundaries

The current UI reads curated data from `services/demoData.ts` and locally persisted state from `stores/demoStore.ts`. `services/apiClient.ts` and `config/runtime.ts` establish an optional typed transport boundary; no endpoint is called until an API base URL and backend exist. Local votes, follows, and activity completion remain demo interactions. Wallet balances and transaction history are illustrative only; support, activity, and cosmetic interactions do not mutate balances. Never treat browser state as verified identity, eligibility, battle results, Twitch activity, or a wallet ledger.
