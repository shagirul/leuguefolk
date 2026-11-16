# Leaguefolk PWA shell

The installed name and short name are Leaguefolk. The document title, Apple home-screen title and loading screens use the same branding. The PWA canvas, launch background and theme color are `#fcfaff`, matching the existing soft lavender pages. Violet remains the accent color and the supplied app icon background.

The icon pack supplies distinct standard, maskable and monochrome install icons. iOS uses the supplied 180px Apple touch icon; browsers use the supplied small favicons. Legacy icon URLs also serve the new artwork. The manifest keeps its existing `/` identity, start URL and scope so this remains an update of the same installed app.

The header now links to an install guide when installation is not detected. Controlled update prompts, release-specific caches and automatic build identities are described in [PWA_LIFECYCLE.md](PWA_LIFECYCLE.md). Long-press browser selection/callouts are disabled on app chrome while editable fields retain native copy/paste; avatar swipes support touches directly on the card and head.

The browser document is fixed with overscroll disabled. `#app` owns vertical scrolling and clips horizontal page overflow. Headers remain sticky, bottom navigation stays fixed, and opening a drawer locks the app scroller while the drawer scrolls independently. Navigation resets the inner scroller. Pinch zoom and intentional horizontal controls are not globally disabled. Device-owned edge navigation and install UI remain controlled by the operating system/browser.

Validation covers manifest/icon dimensions and file references, the existing app tests, and a phone-size browser preview showing document scroll at zero, independent app scrolling, anchored chrome, drawer scroll locking and quick-add score entry. Installed home-screen refresh and mobile keyboard behavior still need checking on physical iOS/Android devices after deployment.
