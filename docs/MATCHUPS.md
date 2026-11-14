# Matchups — Phase 2A

Matchups uses the existing Leaguefolk shell: compact header, lavender canvas, purple raised tabs, character artwork, and four bottom destinations. Your Matchups shows lifetime verified records; Club All shows current members and clearly labelled weekly standings. Opponent detail uses two pop-out character tiles, a prominent head-to-head score, three compact metrics, one goal, recent form and original match links. First meetings have their own empty state without invented performance statistics.

## Data and scope

- Records derive from existing tickets for the active group and exact participant pair, from the signed-in player's perspective regardless of who reported the result.
- Only finalized tickets with valid final scores count. Open tickets appear separately. Cancelled/voided tickets do not count. A pending amendment retains the agreed score until accepted; accepted corrections and voids recalculate the record, streaks and goals.
- The current application is table tennis. Legacy tickets without a sport identifier belong to that existing sport; an explicit different sport identifier is excluded.
- Club standings retain the agreed Phase 1 rule: unlimited ranked matches, 3 points per win, 0 per loss/draw. Weekly standings and lifetime head-to-head records have separate labels.
- No score averages are shown because legacy tickets lack reliable match-format/ruleset metadata.
- Former opponents retain historical records with a generic name when their public membership snapshot is unavailable. Recording requires a current member and excludes self.
- No new Firestore collections, rules, indexes, backfill or database reset are required. Existing group ticket/member listeners provide the source data.

## Goals and featured matchups

Goals follow a fixed priority: first meeting, first victory, turn around a losing streak of at least two, maintain a winning streak of at least two, break a tie, extend a lead, or close the gap. Exactly one goal appears.

A featured matchup needs at least two verified games, a win for each player, a lifetime win difference of at most one, and both a win and loss in the last three meetings within 30 days. It awards no extra points. Lists otherwise order opponents by latest verified meeting; Club All orders by weekly rank then name.

New-result dots compare the current ordered result fingerprint with the last viewed fingerprint in local storage, scoped by user and group. This is a device-local read indicator. Corrections and removed results change that fingerprint.

Record match reuses the existing composer with the opponent selected. Verified match details link back to Matchups and can show factual first-win or current-streak milestones. No skill rating or unverified rank movement is inferred.

## Validation

Automated tests cover both score perspectives, scope filtering, pending/voided results, accepted corrections, goals/streaks, featured eligibility, unplayed/self states, escaping and read indicators. Browser checks use local fixture data: Your Matchups, Club All, opponent detail, first meeting, preselected recording, original ticket links and 320px layouts.
