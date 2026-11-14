# Achievement stones

The profile catalog uses the six supplied pastel stones. A tile's circular number is its **earned occurrence count**, not its current progress. Tapping a tile explains the requirement, the current attempt, its reset rule, and the verified matches or closed weeks that earned it. Locked stones remain discoverable with progress toward the first occurrence.

The v2 pack has six colored achievement assets plus `locked_placeholder.png`. The placeholder is presentation state, never a seventh achievement or Perfect Reign's identity. The collection uses three columns and two evenly spaced rows, rendering the shared placeholder until `unlocked` is true. Description drawers always preview the real colored stone, while the count and status still show whether it has been earned. Perfect Reign's earned asset is `06_perfect_reign.png`. Counts and rules remain tied to the existing stable achievement IDs. No profile showcase slots or slot occupancy records are introduced by this asset update.

## Competition decisions

- Existing Leaguefolk policy remains unchanged: every submitted match is ranked and there is no weekly opponent limit. The guide's older suggestion of a ranked limit does not apply. Explicit historical `mode: casual` / `ranked: false` results are ignored by ranked achievements, but can earn Whitewash.
- All six achievements require verified final scores in this club and table tennis. Missing sport identifiers belong to legacy table tennis. Pending results, cancelled results and explicit other sports are excluded.
- Match order uses immutable `playedAt`, falling back to `createdAt`, followed by ticket ID. Notification arrival and confirmation times do not reorder streaks. In the current API both immutable times are server set when a ticket is submitted; actual earlier offline play order is not independently captured.
- Whitewash requires exactly 11–0. Explicit non-single-game formats are excluded. Legacy scores lack format metadata; an exact 11–0 is treated as a standard game, matching the current single-game default.
- Five-win awards use non-overlapping blocks: 5 wins = one stone, 10 uninterrupted wins = two. A loss or draw resets the active consecutive-win attempt, retaining earlier valid awards. Rival streaks are independent per opponent.
- Table Conqueror requires at least two eligible opponents. An attempt starts with the first ranked win when at least two opponents are eligible. It freezes the roster at that time using member `joinedAt`; members who join later do not enlarge that attempt. Every roster opponent must be beaten once. A loss resets the attempt; a draw neither adds an opponent nor resets it. Earning the stone starts a fresh attempt on the next win.
- Eligibility currently means a club membership, excluding self and explicit other-sport membership. No undocumented activity threshold is imposed. Legacy members without `joinedAt` are treated as already eligible.
- Championship weeks close Monday at 00:00 Asia/Kolkata. Standings use the existing match-submission week (`createdAt`), 3 points per win, 0 per loss/draw. A championship stone requires a **sole** highest points leader with positive points. Shared ranking positions do not invent a tie-breaking winner. A tied, empty or missed week breaks Three-Peat progress.
- Three-Peat earns one stone per non-overlapping block of three consecutive closed championship weeks. Perfect Reign earns one per closed week when the sole champion has at least three ranked wins, beats at least two different opponents and has zero ranked losses. The live week only shows progress, even if every current condition is met.

## Recalculation and repeated events

`public/achievements.mjs` is a pure projection of the active group's complete ticket snapshot. It deduplicates ticket IDs, prefers the latest supplied version and rebuilds occurrences from authoritative final scores. An unresolved amendment retains the current agreed score. Accepted score changes or voids can invalidate an occurrence, and its earned count updates accordingly. Retried requests and repeated notifications do not add occurrences.

Occurrence IDs are stable achievement/ticket or achievement/week keys. Each includes the qualifying ticket or week and an earned timestamp. The projection preserves previous qualifying occurrences across later losses; it does not discard a valid earned stone merely because a new attempt fails.

## Current data limits

This release adds the catalog and derived progress. It does not create manually editable counters, achievement documents, an official championship archive, profile titles, a trophy showcase or share posts. Weekly stones derive from closed verified standings and can change when a late confirmation, correction or void changes a closed week. They must not be described as independently signed championship records.

The current membership collection does not preserve former members' historical eligibility intervals. `joinedAt` keeps late joiners out of an ongoing attempt, but full historical roster reconstruction after membership deletion/rejoin is unavailable. A durable audited award ledger and historical roster archive would be required before promising permanently preserved invalidated-award records or exact reconstruction of departed rosters. The current UI shows only occurrences supported by the available verified history.

## Validation

Tests cover exact Whitewash scores, score perspectives, duplicate results, pending/cancelled/other-group/other-sport exclusions, casual exclusions, repeatable streak blocks, independent rival attempts, match-order stability, corrections and voids, frozen conquest rosters, minimum opponents, draws, closed-week boundaries, ties/gaps and all Perfect Reign requirements.
