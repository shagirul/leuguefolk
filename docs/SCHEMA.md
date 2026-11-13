# Direct Firestore schema and transaction contracts

The browser writes transactions through public/firestore-api.mjs. Firestore Rules authorize each document independently of client code. Cloud Functions and Admin SDK credentials are not used by the deployed application.

## Documents

```text
users/{uid}: {displayName, createdAt, updatedAt}
  memberships/{groupId}: {groupId, name, joinedAt}
  notifications/{actionId}: {kind, title, body, groupId, ticketId, path, createdAt, readAt}

groups/{groupId}: {name, creatorUid, inviteCode, createdAt, timeZone:"Asia/Kolkata"}
  members/{uid}: {displayName, joinedAt, inviteCode}
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
```

Creation/action timestamps use server timestamp transforms checked against request.time. Ticket creation time, participants, creator and group are immutable. Scores are integers from 0 to 200. Season keys are not stored: the browser derives them from createdAt in Asia/Kolkata. Member counts derive from membership snapshots.

## Group authorization

Group creation atomically writes the group, invite index, creator member and user membership. Joining reads a known invitation and creates only the authenticated caller's member and user-membership records. Rules validate matching getAfter() records, invitation proof and profile name. Rejoining is a no-op. Creator UID is audit metadata, not an administrator role. Invitation lookups require authentication; listing codes is denied. Nonmembers cannot read group contents.

## Match actions

Initial submission uses ticketId == actionId, revision=1, version=1 and turn=playerB. Both players must be distinct members.

Every action atomically writes four records: ticket, operation, event and the other player's notification. Rules bind the action ID, actor, kind, version and request timestamp across them. Operation/event/notification IDs are immutable. Reusing an operation returns its result instead of mutating twice.

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

Cancelled matches cannot change. A player cannot approve their own proposal or amendment. Other group members may read results but cannot mutate the match. No client can write an XP balance.

## Inbox and offline replay

Notifications have fixed generic text and rule-validated /g/{groupId}/t/{ticketId} paths. The authorized live match supplies scores/actions. Only the recipient can read the inbox or update readAt. Notification contents and device/push registrations cannot be edited by clients.

The IndexedDB queue stores the original action ID, expected version and applicable revision. Reconnect/reopen replays that transaction. Permanent validation/authorization/conflict failures become blocked for review; transient network failures remain queued. Replay stops when the authenticated account changes. An offline queued action is not finalized until its transaction commits.
