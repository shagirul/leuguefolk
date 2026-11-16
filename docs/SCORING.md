# Skill and competition — pilot v1

Leaguefolk has one persistent **club Skill Rating** and one set of **competition points**, summed into weekly and monthly standings. XP levels and fixed three-point win scoring have been removed from the product.

## Engine and display

`public/ratings.mjs` uses the pinned MIT-licensed OpenSkill 5.0.1 implementation, bundled locally in `public/vendor/openskill.mjs`. Run `npm run build:ratings` after changing that dependency. The bundle and license are included in the offline service worker cache. No external rating service or runtime CDN is required.

The model is OpenSkill's default Plackett–Luce model, with default mean 25, sigma 25/3, beta and per-match dynamics. Displayed Skill = `round(1000 + 10 * (mu - 25))`. Only outcome ranks enter `rate`: no score margin, win-streak multiplier, XP or additional bonuses. Draws use equal ranks. `predictWin` runs on both pre-event ratings, before `rate`, with the same model defaults. See [the official API](https://openskill.philihp.com/api/) and [prediction documentation](https://openskill.philihp.com/predictions/).

Provisional players are visible in their own section, with no official skill position. The pilot requires at least **five eligible ranked matches and sigma ≤ 20/3** to become established. Five matches alone are not a confidence guarantee. Official positions use the displayed skill number; equal numbers share a position. Ratings are club-relative, never compared across disconnected clubs.

After seven days without an eligible match, uncertainty grows by variance `(25/30)^2` per elapsed day, capped at the initial sigma. This is a Leaguefolk pilot inactivity policy, separate from OpenSkill's per-match tau. Mu never decays or resets. Inactivity can return a player to provisional status; the next eligible result uses the increased uncertainty.

## Eligibility and points

- Matches explicitly choose **ranked** (default) or **casual** before submission. The field is immutable once submitted; both players see the choice when reviewing the match. Legacy tickets without `mode` are ranked.
- The first **two** verified ranked meetings per unordered pair per week are eligible in a 3+ player club. A two-player club permits **three**. Draws use a slot. Casual, open and cancelled tickets do not use slots.
- Club size uses members whose `joinedAt` is at or before the match's immutable server submission timestamp, plus its participants. A later member joining does not retroactively change an earlier match's cap. Excess games remain verified historical results, without rating, points or achievement effects.
- The winner receives **3** when their pre-match chance is above 65%, **4** from 35% through 65% inclusive, or **5** below 35%. Losses and draws receive zero. Thresholds use unrounded probabilities.
- Weekly and monthly totals sum the same eligible events. Weeks start Monday at midnight in Asia/Kolkata. Months are calendar months in that zone. The server `createdAt`, not client-supplied dates or confirmation dates, assigns both periods.
- A weekly title requires at least two eligible ranked matches and participation against two opponents in a club with 3+ active players (one opponent in a two-player club). Activity is evaluated at the end of a completed week, or now for live qualification hints. A monthly title uses the sole positive monthly points lead. Equal leaders share rank and receive no sole championship; an unqualified top scorer does not hand a title down to a lower scorer.

## Spark architecture and audit history

There is no privileged calculation runtime on Spark. Firestore stores the canonical mutually confirmed tickets, immutable submission timestamps, versions, operation IDs and per-ticket audit events. All screens run the **same deterministic replay** from those facts, maintaining mu, sigma and an event history in memory. Clients cannot store arbitrary skill, uncertainty, points or achievement balances: Firestore's allowed field lists reject them.

`buildRankedLedger` emits versioned events with ticket ID, source version, policy version, timestamp, season keys, eligibility/reason, pair limit, pre-match ratings and probabilities, points, and post-match ratings. It deduplicates IDs using the latest version, includes only valid finalized scores in the selected club/sport, and sorts by server submission time then ticket ID. It does not mutate the source records. Noneligible results remain in the event history with an explicit reason.

An unresolved amendment retains the currently verified result. Confirmation, agreed correction, void or late confirmation reconstructs the whole sequence: dependent ratings, prediction bands, pair slots, championships and all six achievements update together. Predictions are estimates **before each result in that reconstructed chronological sequence**, not permanently frozen forecasts made when an unconfirmed report was submitted. Original score changes remain in the existing Firestore audit records.

Every snapshot must contain the club's complete ticket history. Do not paginate this into only the latest games, convert old XP into skill, or allow clients to publish materialized rating balances. A future server-maintained rating cache would need a trusted runtime and its own reconciliation/versioning; it is not implemented here. For very large histories, move replay to a trusted backend rather than dropping old matches.

Historical membership deletion/rejoin intervals are not recorded by the current product. Exact reconstruction after adding those features will require an audited roster history. Policy/model changes must increment the policy version and intentionally rebuild all results.

## UI, achievements and old data

The three tabs are Skill, Week and Month. Profiles show a single skill estimate and provisional/established status. Raw verified match stats and head-to-head records still preserve casual and excess games; these are labelled historical stats, not rankings. Match details show official competition points, skill delta and pre-match chance, or why a verified game was excluded.

All six original achievement identities and assets remain. Their occurrences use the **same eligible ranked ledger**, including Whitewash. Streaks do not advance or reset on casual/excess games. Three-Peat uses consecutive completed qualifying sole championships. Perfect Reign additionally requires three eligible ranked wins, wins over two opponents and no eligible ranked losses. Corrections/voids can invalidate awards.

The old `inviteCodes/{code}/players/{uid}.xp` field is retained only for schema compatibility. New records have zero XP and no match adds any XP. Existing totals are ignored; the optional Admin preview backfill resets this obsolete field to zero. Invite previews show verified history, never an invented OpenSkill or championship rank. No production data reset, automatic migration or deployment is performed by implementing this feature.

Deploy Hosting **and Firestore rules together** before using the new schema against production. Existing old clients can still submit a missing-mode ranked ticket, but they should reload to show the new system. No Cloud Functions, billing upgrade, or push notifications are needed.

## Validation

`npm test` covers bands, uncertainty, pair limits, week/month boundaries, provisional positions, deduplication, replay, corrections, voids, unchanged pending amendments, roster timing, championship qualification, ties, achievements, and removal of XP levels. `npm run test:rules` uses only local Auth/Firestore emulators, including complete forged batches that attempt to alter match mode or submit fabricated rating fields.

`npm run simulate:ratings` runs four weeks involving an occasional expert, improving beginner, frequent average player and a peer. The fixed scenario has 80 reports, 32 eligible games and 48 excluded repeats. Removing the repeats leaves exactly the same skill estimates. The learner improves and the expert's skill estimate exceeds the frequent average. Week two ties, so no sole champion is declared. The last week has 7/8 correct winner predictions. This small illustrative scenario is a regression fixture, **not evidence of real-world calibration**; thresholds and inactivity behavior remain pilot settings requiring real club data.
