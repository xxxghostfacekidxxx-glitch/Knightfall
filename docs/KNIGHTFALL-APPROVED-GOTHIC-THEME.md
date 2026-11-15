# Approved Knightfall Gothic Creator theme (November 14, 2026)
The skull-and-eclipse crest and **Gothic Creator**, not the older Gravewave neon takeover, are the approved site-wide identity.

Colors: black stone `#0d1013`, bone `#ece1d3`, weathered steel `#96949e`, moss `#92a18a`, antique bronze `#c7a77c`, muted crimson `#b25b68`, eclipse violet `#82617c`.

The original crest remains on the header, favicon and PWA icons. `design-system.css` provides shared tokens and `knightfall-unified-theme.css` provides the site chrome. `nav.js` no longer injects Gravewave mascot/scanline/neon layers. Custom profile themes, pet illustrations, Creator artwork, games and Ruinwire's dedicated app icon are not replaced. Cached legacy decorations are suppressed. The PWA shell cache version is advanced to refresh stale styling.

Theme audit: `node scripts/site-theme-audit.mjs`. Real-device viewport and contrast acceptance remains to be performed.
