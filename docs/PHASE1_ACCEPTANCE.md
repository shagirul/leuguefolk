# Phase 1 technical acceptance

Validated locally on 14 November 2026 (Asia/Kolkata), using the actual app, Firebase Auth/Firestore emulators and synthetic Alex, Dev and Maya accounts. Production data was not modified.

## Final competition policy

- Every match is ranked, with no weekly or per-pair match limit and no casual mode. This is the user's revised decision and supersedes the two-match limit in the original brief.
- A verified win earns 3 points. Losses and drawn scores earn 0.
- Equal points share a competition rank (1, 1, 3); names only keep display order stable.
- Weeks begin Monday at midnight in Asia/Kolkata. Submission time selects the period; late confirmation updates that original period. Month view remains available. History is retained.
- The reporter agrees by submitting a score; the other participant must explicitly accept that exact proposal. A correction swaps the response turn. Neither player can approve their own proposal.
- Existing profile XP/levels are cosmetic and do not contribute to competition points. Invite previews use verified wins, worth 3 points each.

## Acceptance checklist: 10/10 technical checks passed

| Check | Evidence |
| --- | --- |
| Create a group and share its invite code | Real browser created Office TT Club and copied its generated code; emulator checks invitation ownership and access. |
| Two other players join and appear | Dev joined with the code; Maya opened the share link and explicitly joined. All three appeared at zero points in the browser. |
| Record a match in under 20 seconds | Browser measured 5.289 seconds from Record a match to submitting Alex 11–9 Dev. This is an automated interaction measurement, not a human usability study. |
| Open the exact match from a notification | Dev opened the in-app notification and reached the matching ticket URL. Reopening the old notification showed the current verified result rather than approval controls. |
| Mutual agreement updates weekly standings | Dev's queued confirmation became verified only after reconnection; Alex received 3 points, Dev and Maya remained at 0. Three emulator clients independently read the same standings. |
| Corrections and counters work | Real emulator transactions: Dev proposed 9–11, Alex countered 10–9, Dev accepted; the final exact score and 3-point win were checked. Existing tests cover verified amendments and mutual voids too. |
| Unresolved matches contribute zero | Pending, disputed and cancelled reports added no competition points. The creator could not forge another player's identity or approve their own score. |
| Offline submissions sync without duplicates | The real IndexedDB outbox survived reopening. A simulated lost acknowledgement after a real server commit retried the same action ID and produced exactly one ticket/event. |
| Stale offline confirmations are blocked | A queued confirmation for an earlier version became Needs review after the reporter changed the score. No points were awarded until a fresh review was accepted. The browser also verified offline confirmation persistence across reload. |
| Weekly reset preserves history | Boundary tests check Sunday 23:59:59.999 to Monday 00:00 in Asia/Kolkata. Weekly points reset to zero, monthly totals and persisted tickets remain. Third and later matches count; Dev and Maya continue after Alex signs out. |

## Reproduce

```powershell
npm test
npm run test:rules
```

The emulator suite includes `tests/phase1.emulator.cjs`, which exercises actual Firebase transactions and the actual IndexedDB queue. Other suites check authorization attacks, concurrent changes, replay, profile setup and invitation persistence. Browser checks used the same app and the same demo-project emulators at 390×844 and 320×640; no horizontal overflow was observed.

Final results: **66/66 app tests**, **36/36 emulator checks**, **0 dependency vulnerabilities** from `npm audit`, and **37 valid PWA precache paths**. JavaScript syntax and Git whitespace checks passed. Validation ran on Node 24.18.1. Targeted dependency overrides replace vulnerable gRPC, glob, UUID and OpenTelemetry dependencies; the complete suites were rerun with those overrides, and Firebase tooling ZIP/glob packaging was also exercised successfully. The browser Firebase CDN SDK remains unchanged.

No accounts or Firestore collections need deleting. Competition points are derived from existing verified tickets, so there is no points backfill. The hosting release must include the new outbox module and updated service worker. These Phase 1 changes have not been deployed to production.

## Office pilot remains outstanding

The technical checks do not establish engagement or retention. Recruit three real coworkers and observe four weeks of actual use, including whether people record matches without reminders, check standings voluntarily and keep participating at different skill levels. This real-world pilot has not been run by the automated checks.
