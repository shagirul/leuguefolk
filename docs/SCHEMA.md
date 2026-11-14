# Direct Firestore schema and transaction contracts

The browser writes transactions through public/firestore-api.mjs. Firestore Rules authorize each document independently of client code. Cloud Functions and Admin SDK credentials are not used by the deployed application.

## Documents

```text
users/{uid}: {displayName, username, avatarId, createdAt, updatedAt}
  memberships/{groupId}: {groupId, name, joinedAt}
  notifications/{actionId}: {kind, title, body, groupId, ticketId, path, createdAt, readAt}

groups/{groupId}: {name, creatorUid, inviteCode, createdAt, timeZone:"Asia/Kolkata"}
  members/{uid}: {displayName, avatarId, joinedAt, inviteCode}
  tickets/{ticketId}:
    groupId, playerA, playerB, createdBy
    createdAt, playedAt, updatedAt, finalizedAt
    status: "open" | "finalized" | "cancelled"
    revision: int (1..30), version: int, turn: uid | null, disputed: boolean
    proposal: {score:{a,b}, by, note, at}
    finalScore: {a,b} | null
    cancellation: {by, turn, note, at} | null
    amendment: {kind:"score"|"void", score:{a,b}|null, by, turn, revision, note, at} | null
    action: {id:actionId, kind, actor}
    events/{actionId}: {kind, actor, note, at, score?}
  operations/{actionId}: {actor, ticketId, kind, version, createdAt}

inviteCodes/{code}: {groupId, name, createdAt}
  players/{uid}: {displayName, avatarId, xp, played, wins, lastTicketId, lastActionId, updatedAt}
usernames/{lowercaseName}: {uid, createdAt}
```

Creation/action timestamps use server timestamp transforms checked against request.time. Ticket creation time, participants, creator and group are immutable. Scores are integers from 0 to 200. Season keys are not stored: the browser derives them from createdAt in Asia/Kolkata. Member counts derive from membership snapshots.

Usernames are 3–24 letters, numbers or underscores. `username == displayName.lower()` is the canonical key. Onboarding atomically creates the reservation and saves it on the user document; rules require matching owners via `getAfter()`. Reservations cannot be reassigned/deleted, and an existing profile's username cannot change. Legacy profiles without a username complete this step on their next sign-in. Their creation timestamps are preserved, and group name snapshots are refreshed to match the chosen name.

`avatarId` stores one of the 16 canonical IDs in `public/characters.mjs` (for example, `istj-anchor` or `estj-captain`), also enumerated by Security Rules. Names, quoted descriptions and artwork are static catalog metadata, not extra profile fields. This catalog replaces the original 20 animal IDs. A returning profile with an old or missing ID must select a current hero; saving refreshes that player's member and invite-preview identity snapshots without changing statistics. Release the catalog, assets, app, service worker and matching rules together. No database reset is required.

## Group authorization

Group creation atomically writes the group, invite index, creator member, user membership and a zero-XP invite-player projection. Joining reads a known invitation and creates only the caller's member, user-membership and zero-XP projection. Rules validate matching getAfter() records, invitation proof and profile name/avatar. Rejoining is a no-op. Creator UID is audit metadata, not an administrator role. Invitation lookups require authentication; listing codes is denied. Nonmembers cannot read private group contents.

## Share links and invitation consent

The canonical link is `/invite/{8-character-code}`. Capture it before authentication and retain a versioned pending intent in local storage. Internal navigation also carries `?invite=CODE` while unresolved, so storage restrictions do not erase the intent. Email login, signup, Google popup, password reset, username/avatar setup and auth-state changes do not consume it. A newer explicit invitation replaces the previous one. Malformed links show an invalid-invitation state rather than reviving an older stored link.

After authentication and profile setup, the pending invitation takes precedence over remembered group routing. The join card queries up to 20 preview players ordered by all-time wins (three competition points per win). It requires an explicit Join or Decline. Failed reads/joins retain the intent. Successful joins and explicit declines clear storage and replace the invite history entry; an existing member sees Open group. Async responses are checked against the current user and invitation before altering state.

`inviteCodes/{code}/players` is a separate, deliberately shareable projection. A signed-in holder of that exact code can get these documents or query with `limit <= 20`; the UI displays only the top 20. Query limits bound each request, not the number of pages a code holder could request. The projection contains public player identity, aggregate verified statistics and source-action IDs, with no email, private profile fields, notes or individual match scores. Code enumeration, anonymous preview reads, and nonmember access to group/match/profile records remain denied. See [Firebase query rule guidance](https://firebase.google.com/docs/firestore/security/rules-query).

Group-picker avatar stacks use existing member-only queries capped at three real members. Tile selection and sharing are separate buttons. Sharing uses the clicked group's own code via native sharing, with copy-link fallback; it never silently joins anyone.

## Competition points

All matches are ranked, without a match-count limit or casual mode. A verified win is worth 3 points; losses and draws are worth 0. Equal point totals share a competition rank. Weekly/monthly standings derive from the immutable submission timestamp in Asia/Kolkata; Monday starts a new week without deleting tickets. Late confirmations and agreed amendments update the original submission period. There is no client-writable competition-points balance. The existing `wins` projection, independently validated by rules, orders invite previews; `xp` remains a cosmetic profile metric only. No schema migration or database reset is needed for this scoring change.

## Match actions

Initial submission uses ticketId == actionId, revision=1, version=1 and turn=playerB. Both players must be distinct members.

Every action atomically writes the ticket, operation, event and the other player's notification. Actions changing verified contributions additionally update both players' invite projections with server increments. Rules bind these changes to the same ticket/action, validate each XP/played/win delta from the old and new verified scores, and reject omitted or forged projection updates. Atomic increments allow different matches to finish concurrently. Operation/event/notification IDs are immutable; replay does not award XP twice. Profile edits synchronize avatar/name snapshots without changing statistics.

Transactions check expectedVersion against ticket.version on every change. Negotiations also check proposal revision; amendment counters/responses check amendment revision. Firestore retries concurrent transactions, then application checks reject stale input. Rules independently require version == old.version + 1 and legal field changes.

| Action | Allowed effect |
|---|---|
| confirm | Proposal recipient finalizes the exact proposed score. |
| propose | Recipient corrects/disputes, increments revision and swaps turn. |
| editOriginal | Reporter edits only revision 1 before any response. |
| withdrawOriginal | Reporter cancels an untouched original submission. |
| requestCancel | Either player requests cancellation; negotiation pauses. |
| respondCancel | Other player accepts cancellation or resumes negotiation. |
| startAmendment | Either player proposes a verified-score change/void; current XP remains. |
| counterAmendment | Recipient counters a score change and swaps turn. |
| respondAmendment | Recipient accepts/rejects a change or mutual void. |

Cancelled matches cannot change. A player cannot approve their own proposal or amendment. Other group members may read results but cannot mutate the match. No client can write an arbitrary XP balance; projection changes must match the verified-ticket delta.

## Existing-group rollout

Existing groups require an Admin backfill from their complete verified ticket history. `scripts/backfill-invite-players.mjs` defaults to a read-only dry run, requires an explicit project, supports `--group UUID`, and writes only with `--write`. It uses Application Default Credentials (or the local emulator), runs each group in a transaction, and refuses groups above 450 members instead of partially migrating them. Source match/profile records remain unchanged. The Admin SDK is a development dependency used only by this migration; the deployed app still runs without Cloud Functions or a paid backend.

Release order: build the `players` composite index and wait until ready; review the dry-run output; deploy the new rules; apply the backfill; deploy hosting and refresh older clients. Until backfill and new hosting are in place, old clients cannot confirm/amend verified scores because they omit the required projection writes. Coordinate this short transition during a quiet period. Emulator tests cover the dry run, applied backfill, next confirmation, corrections/voids, concurrent matches and forged batches.

## Inbox and offline replay

Notifications have fixed generic text and rule-validated /g/{groupId}/t/{ticketId} paths. The authorized live match supplies scores/actions. Only the recipient can read the inbox or update readAt. Notification contents and device/push registrations cannot be edited by clients.

The IndexedDB queue stores the original action ID, expected version and applicable revision. Reconnect/reopen replays that transaction. Permanent validation/authorization/conflict failures become blocked for review; transient network failures remain queued. Replay stops when the authenticated account changes. An offline queued action is not finalized until its transaction commits.
