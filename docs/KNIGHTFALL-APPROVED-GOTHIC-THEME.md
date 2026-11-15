# Approved Knightfall Gothic Creator theme (November 14, 2026)
The skull-and-eclipse crest and **Gothic Creator**, not the older Gravewave neon takeover, are the approved site-wide identity.

Colors: black stone `#0d1013`, bone `#ece1d3`, weathered steel `#96949e`, moss `#92a18a`, antique bronze `#c7a77c`, muted crimson `#b25b68`, eclipse violet `#82617c`.

The original crest remains on the header, favicon and PWA icons. `design-system.css` provides shared tokens and `knightfall-unified-theme.css` provides the site chrome. `nav.js` no longer injects Gravewave mascot/scanline/neon layers. Custom profile themes, pet illustrations, Creator artwork, games and Ruinwire's dedicated app icon are not replaced. Cached legacy decorations are suppressed. The PWA shell cache version is advanced to refresh stale styling.

Theme audit: `node scripts/site-theme-audit.mjs`. Real-device viewport and contrast acceptance remains to be performed.

## November 15 rollout and live verification

The shared Gothic Creator palette was corrected in admin, community forums, auth/legal, store
previews, profiles, Profile Studio, Link Hub, staff privacy tools, and the arcade directory.
Old Gravewave art and game-specific graphics remain available only as intentional assets,
not as global page chrome. User-selected profile accents continue to have precedence.
Service-worker cache v45 and Gothic CSS cache version `20261115-gothic9` refresh installed copies.

GitHub main-branch smoke/regression suite passed for commit `69a63309`.
Cloudflare Pages production deployment succeeded for `69a63309` on November 15.
Live Cloudflare browser rendering verified the homepage and Madhouse at a 390px mobile
viewport: Gothic body and bone brand colors loaded, with no horizontal overflow.
The remaining routes, authenticated screens, and device-specific interactions still need
independent manual visual acceptance; passing static checks is not proof of full visual QA.
