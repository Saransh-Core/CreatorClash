# Mini-game Engine

**Status:** The frontend contains local demonstration experiences. No backend game engine or authoritative scoring exists yet.

## Planned model

Use one server-authoritative session lifecycle with game definitions, participants, rounds, deadlines, submissions, events, scores, and final results. Game-specific strategies validate inputs and calculate outcomes without owning session persistence. Store server timestamps; clients may show countdowns but cannot extend deadlines or submit authoritative scores.

## Planned game strategies

- Quick Quiz: serve the same question set to competitors; hide answer keys until the round closes; calculate correctness and any bounded speed bonus on the server.
- Guess the Majority: one eligible community vote per account per round; competitors predict the aggregate; community participation is separate from competitor points.
- Reaction Rush: issue round identifiers and server deadlines; reject premature, late, and duplicate responses; record server receipt times and document network-latency limitations.
- Word Clash: one bounded submission per competitor per round; objective rules only for initial scoring; optional community reaction is stored separately from the result.

Realtime is a delivery mechanism for persisted session changes, not an authorization or scoring authority. Session reconnects must reload current server state. Engine code and rules will be added with their integration tests in Phase 5.
