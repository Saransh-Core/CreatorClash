# Creator Clash — Product Requirements

**Status:** Frontend demo scope implemented; production integrations remain future work.  
**Product model:** One website and one identity system with public, creator, and community experiences. The current account is a browser-local demo session only.

## Product overview

Creator Clash is an interactive competition platform where Twitch creators compete through battles, AI-assisted challenges, and mini-games while communities participate through Twitch and the website. Creator Clash complements Twitch as the livestream destination. A single account can enter both Creator and Community modes.

**Tagline:** “Your Community. Your Competition. Your Victory.”

## Product audiences and goals

- **Creators:** discover opponents, create and manage competitions, shape challenges, review competition history, explore analytics, and preview Clash Coin cosmetics.
- **Community members:** discover creators and competitions, take part in local demo activities, vote, support creators with demo Support Tokens, and review rewards.
- **Visitors:** understand the product, browse sample competitions and creator profiles, and choose a workspace entry point.

Make competition easy to understand and participate in. Make audience participation meaningful and explainable. Keep skill outcomes separate from popularity support. Clearly communicate reward rules and the state of every integration.

## Experience requirements

### Public website

Landing page, arena discovery and detail, creator directory and public profiles, championship overview, product explanation, login, registration, and account recovery screens. Public competition and creator content in the current build is realistic but illustrative demo data.

### Creator workspace

Overview, battle directory, create-battle wizard, opponent search, invitations, history, battle lifecycle room, curated Challenge Director, mini-game hub, championship, rewards/cosmetics, analytics, creator profile/settings, Twitch connection preparation, and OBS overlay preview.

### Community workspace

Overview, creator discovery/following, competition/activity participation, creator support, championship and rankings, Support Token wallet/history, community rewards, and preferences.

Navigation exposes a mode switch. Both workspaces use the same locally persisted demo profile. No real authentication is represented as connected.

## Currency and competition integrity

- **Support Tokens** belong to community members, are demo-awarded for eligible local activities, and are used to preview creator support.
- **Clash Coins** belong to creators and preview competition rewards and cosmetics.
- These currencies are distinct and never combined.
- In the demo, all balances and ledger rows are browser-local and visibly labelled DEMO. A reset action clears this local state.
- In production, the API must authorize every award, spend, reversal, and contribution. The browser may never set authoritative balances.
- Popularity support scores and skill competition scores must remain separate.

## Demo interaction requirements and limits

Local demo interactions include workspace mode switching, local demo session creation, battle creation, invitation response, battle lifecycle transitions, challenge suggestions and voting, follows, community voting, support contributions, cosmetic preview purchases, and three playable mini-games: Quick Quiz, Reaction Rush, and Guess the Majority. Six other mini-games have preview pages.

No production authentication, Twitch OAuth/Helix/EventSub, stream/chat connection, live battle synchronization, OpenAI call, server-side eligibility validation, or real financial-like transaction exists. UI labels must continue to distinguish curated examples from service-backed information.

## Quality requirements

- Responsive desktop, tablet, and mobile compositions; accessible semantic structure and keyboard controls.
- Respect `prefers-reduced-motion`; important data and actions are available outside WebGL.
- Lazy-load 3D and retain static CSS composition when unsupported, offscreen, mobile-sized, or reduced motion is preferred.
- Keep secrets out of committed files; validate authoritative inputs on the future server.
- Strict TypeScript, lint, typecheck, and production build must pass.

## Future production readiness

Before launch, define account/privacy/retention policies, competition formats and cancellation rules, moderation and creator eligibility, participation verification, token issuance and reversal policies, rate limits, idempotency, Twitch scope policy, and operational support. See `TECHNICAL_ARCHITECTURE.md` for trust boundaries and threat-sensitive services.
