# Player profiles

Group members can open `/g/{groupId}/players/{encodedUserId}` to see another current member's character, XP level, total matches, win ratio, P/D ratio, recent form and achievement collection. The same Profile theme and achievement drawers are reused, calculated from the selected player's perspective and the current group's verified table-tennis history. Pending scores never add progress. Corrections and voids recalculate results.

Other-player profiles are read-only. They offer Your matchup and Record match, with the player selected in the existing composer. Editing, invitations and Sign out remain on the signed-in player's own page. Achievement drawers label the selected player's progress. Clicking your own avatar opens your normal Profile page. The back button returns to the source page; direct links fall back to Ranks.

## Entry points

- Ranks: podium avatars/names, ranking row avatars/names, and the own-position avatar.
- Matches: opponent avatars, including queued reports. The separate row action opens the original match; swipe-to-record remains available.
- Inbox: known opponents' avatars in the current group. The separate notification action keeps its original behavior, including switching groups for updates from another group.
- Matchups: opponent list/featured avatars, Club All avatars, and both character tiles in the head-to-head detail. Names retain their matchup action.
- Match details: both player avatars.

Record-match picker, winner selection and hold-to-record avatars retain selection behavior. Group stacks retain their group/invite action. Invitation previews before joining do not bypass the group join flow to expose a profile. Former or missing members are shown as unavailable instead of reading a private user document.

## Data and authorization

Profiles reuse `groups/{groupId}/members` display names/characters and the existing complete group ticket snapshot. No other player's `users/{uid}` document, email, account settings or personal membership list is fetched. Existing membership-based Firestore read rules remain in effect; non-members cannot read group data. No database reset, migration, new index or security-rule change is required.

## Validation

Tests cover player routes, correct player score/achievement perspective, read-only controls, escaped profile labels and separate match/profile actions. Browser checks cover entry from Ranks, Matches, Inbox and Matchups, progress ownership, back navigation, preselected recording and narrow mobile layout.
