# Knightfall Sanctuary: Affinities, Bestiary and Earned Growth (2026-11-13)

## Shipped
- 32 persistent creatures, each assigned one of 11 distinct affinities: Wildwood, Tidal, Ember, Dusk, Spectral, Stone, Storm, Celestial, Feral, Toxic, Neon. **Neon is not the default.**
- New responsive sanctuary art compositor: type-specific environment illustration, shadows, surface grain, restrained light, growth treatment, and preserved animated pet illustrations/owned equipment/habitat art. Heavy WebGL and external script dependencies are deliberately avoided for Android support.
- Bestiary with serial numbers, discovery counts, affinity filter, search, saved ownership derived from the authenticated pet endpoint, silhouettes for missing creatures, species lore, and earned growth-chain requirements.
- Three growth stages for every species, calculated **server-side** from existing experience level and bond XP. Five existing Starborn signature forms retain their original higher requirements and original evolved images.
- Rooms, member profile showcases, and Species Trials display type and current form with matching type accents.
- Updated the stale 28/31 species counts in the Trials and profile pages.
- No new currency, paid evolution, pet resets or D1 migrations.

## Artwork caveat and next art pass
The renderer substantially changes presentation and color direction, but the underlying 32 legacy character drawings are still reused. For 27 ordinary species, Awakened/Ascended currently change presentation and form metadata rather than loading fully redrawn anatomical illustrations. Produce dedicated original art masters, pose sheets and form-specific character drawings before describing them as fully illustrated physical evolutions.

## Follow-up acceptance
- Deliver 96 original art masters (32 × 3 forms) with consistent silhouette language and varied non-neon palettes.
- Add pose atlas at accessible resolutions, then use a sprite-sheet-backed GPU/Canvas renderer if performance measurements justify it.
- Keep premium cosmetic items entirely separate from form requirements.
