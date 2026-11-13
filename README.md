# Agree — Firebase Spark leaderboard PWA

Private friend leaderboards where a score counts only after both players agree. Google/email-password sign-in, groups, invitation codes, matches, corrections, cancellations, amendments, live rankings and an in-app inbox run directly on **Firestore**, without Cloud Functions or billing.

The app targets **leaguefolk-2b1c2**, with its default Firestore Standard database in **asia-south1 (Mumbai)**. Live site: https://leaguefolk-2b1c2.web.app. **Push notifications remain disabled.**

## Setup and deployment

1. Enable Google (select a support email) and Email/Password in Firebase Authentication. Email-link sign-in is not implemented.
2. Authorize the app domain in Authentication settings. This project already authorizes localhost, leaguefolk-2b1c2.web.app and leaguefolk-2b1c2.firebaseapp.com.
3. Use the existing default Cloud Firestore database. No manual collections or Realtime Database are required.
4. For another project, update public/firebase-config.js and .firebaserc. These hold public identifiers, never service-account keys. Keep features.push false.

```bash
npm install
npx firebase-tools login
npm test
npm run test:rules
npm run deploy
```

Deployment publishes **only Firestore rules/indexes and Hosting**. Spark quotas still apply; exceeding free quotas can interrupt service until they reset. No billing upgrade is required by this implementation.

For local UI development, run `npm run serve` and open **http://localhost:5000**. Local files connect to the configured live Authentication/Firestore project. Isolated tests use separate demo-project emulators; the app does not silently redirect production writes to local emulators. Do not use file://.

## Onboarding and password recovery

Email sign-up asks for a unique username. Google users and existing accounts without a reserved username choose one after signing in. Names use 3–24 letters, numbers or underscores and are unique regardless of capitalization. A transaction reserves `usernames/{lowercaseName}` together with the user's profile; Security Rules prevent duplicate claims and later username changes. Existing group name snapshots refresh after onboarding.

On the email sign-in screen, **Forgot password?** sends a reset email using Firebase Authentication. The link opens Firebase's hosted password-reset page. The confirmation is the same for registered and unregistered addresses; check the inbox and spam folder. The default Firebase reset template works without a custom email service. Customize it later in Authentication → Templates → Password reset if needed.

## Security and transactions

- public/firestore-api.mjs coordinates transactions. Firestore Rules independently validate the actor, invitation proof, membership, legal transition, exact accepted score, immutable fields and server timestamps. Client JavaScript is not a security boundary.
- Creating a group writes its invitation, creator membership and user membership together. Joining creates only the authenticated caller's membership, with a matching invitation code. Codes allow exact authenticated lookups; listing the invitation index is denied.
- Each match action atomically writes the ticket, immutable operation, audit event and recipient's private notification. Rules use getAfter() to require all companion records.
- Only the current recipient can confirm a proposal. A proposer cannot confirm their own score. A verified score remains active until the other player accepts a change or mutual void.
- Each action has a stable UUID. Replaying it returns its previous result. Every match change increments version; stale queued versions and proposal/amendment revisions are rejected.
- Groups and invitations are immutable in this version. A member may refresh only their own name snapshot to match their profile. Leaving/deleting groups and rotating invitation codes are not implemented. Group creation grants no moderation power.

## Rankings

A verified **21–17** score awards **42 XP** and **34 XP**. Rankings derive from finalized tickets, not a mutable XP balance. Weekly/monthly seasons use immutable, server-timestamped createdAt in **Asia/Kolkata**, with weeks starting Monday. Late confirmation or mutually approved amendments may change previous periods. Pending/cancelled matches do not count.

The browser observes the group's tickets in real time and computes totals locally. This suits small friend groups; large histories need pagination and a different aggregation design to stay within read quotas. Bilateral agreement does not prevent collusion or exaggerated scores.

## Offline and notifications

The service worker caches the app shell and SDK. Firestore caches previously read data. Offline match actions enter an IndexedDB outbox and replay as transactions when the same account returns online. A queued action is not confirmed; conflicting actions become **Needs review**.

Transactions and group creation/joining require connectivity. Closing all tabs does not guarantee delivery; reopen online to flush the outbox. Clearing site storage can lose unsent actions. A queued new match's submission season is determined by its server commit timestamp.

In-app notifications use the canonical /g/{groupId}/t/{ticketId} link and are readable only by the recipient. **System push, token registration and permission prompts are disabled.** Enabling push later requires a trusted sender and a separate implementation; toggling the old flag alone is insufficient.

## Verification and files

- `npm test`: domain transitions, Google/email auth behavior, leaderboard calculations and queue/deployment contracts.
- `npm run test:rules`: Authentication/Firestore emulators under demo-agree, with all match transitions, replay/concurrency and forged-batch attacks that bypass client validation. Requires Java 21+.
- tests/browser-smoke.py: optional UI fixture test requiring Python Playwright and Chromium.
- public/app.js: views, authentication, live listeners and outbox replay.
- public/firestore-api.mjs: direct Firestore transactions.
- public/domain.mjs: pure match state machine used by the app and unit tests.
- firestore.rules: authoritative authorization and validation.
- docs/SCHEMA.md: record and transaction contracts.
- functions/: legacy, inactive implementation retained for reference. It is absent from deployment configuration. Do not deploy it against the new data contract without migration.

Manual acceptance: use two accounts in separate browsers; create a group, join using its code, submit and confirm a match from the other account. Both rankings and the inbox should update. Test corrections/cancellations and a stale offline confirmation after the other player changes the match.
