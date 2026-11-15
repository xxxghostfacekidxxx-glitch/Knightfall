# Knightfall Creature Sanctuary · Storybook Comics

Updated November 15, 2026. **Source of truth:** the SVG files in `public/assets/devil-tools/neon-nuisances/`. This document covers original hand-authored SVG interpretations of the approved gothic-cartoon collection direction; the large presentation poster itself is a **concept**, not the raster source embedded in these SVGs.

## Art direction

All creatures should be **cute, mischievous, readable at phone sizes**, with exaggerated heads and big glassy eyes, thick deep-plum ink outlines, soft character highlights, compact silhouettes, and a moody storybook scene. Keep the site's gothic visual family but reserve highly saturated magenta/lime glows for **Neon** creatures. Feral types are warm and earthy, Stone uses weathered greens and gray, Dusk uses plums and burgundy, Spectral uses pale lavender, Wildwood uses soft nature colors, and Tidal uses sea-glass blue and sage.

Creature illustrations use a common 512×512 scalable SVG composition with the individual creature completely inside the viewport, an accessible title and description, a consistent dark pedestal, small background stars and ornamental corner marks. No text labels baked into art, no CDNs, no embedded raster payloads, no executable SVG, and no external file dependencies.

## The seven featured characters

| Species ID | On-site display | Signature identity and details |
| --- | --- | --- |
| `lydibug` | Lydibug | Big rosy beetle eyes, small gold crown, translucent fairy wings, crimson/pink spotted shell, cheerful expression |
| `mini-villain` | Mini Villain | Little horned demon, short bat wings, mischievous fang grin, crooked crown and burgundy outfit |
| `mini-eddie` | Eddie | Cartoon skeletal guardian pup, pale skull-like face, mismatched magical eyes, puppy ears and green lantern |
| `minion-mouse` | Minion Mouse | Giant rosy ears, soft cream fur, stitched oxblood hood, whiskers and gold moon charm |
| `boo-thang` | Boo Thang | Friendly lavender ghost with a teasing smile, rosy cheeks, antique crown and luminous little lantern |
| `crush` | Crush | Surfing green turtle, short beaded dreadlocks, glasses, face scruff, board, and a pink squid; creature honors Josh “Crush” Van Patten |
| `chunky-monkey` | Chunky Monkey | **Female** playful brown monkey with enormous ears, pink flower, little crown, golden jewelry, warm grin and green apple |

These are first-form, production-ready SVG illustrations. They deliberately reuse all three existing asset entrypoints per species: `<id>.svg`, `<id>-idle.svg`, and `portraits/<id>.svg`, so existing API objects, account ownership, care actions, room furniture, profile display and compatibility paths stay unchanged. The same master art is copied to all three entrypoints to eliminate inconsistent appearance.

**Evolution state remains controlled by the server:** signature evolutions earned with levels and bond continue to load `/evolutions/<id>.svg`. These files and their gameplay requirements are *not* overwritten by the first-form redraw. The seven new first forms stay visually consistent during room care actions; other creatures keep their existing pose sheets. The five earned Starborn evolution assets have now been repainted into the same storybook family, with distinctive wings, capes, wards, tools and spirit effects. The remaining species are the next art phase.

## Implementation and validation

- No new backend schema or currency rules.
- Existing ownership, wardrobes and account-linked pets are unchanged.
- Cache-bust asset references as `20261115-storybook1` in Sanctuary, personal rooms, profile companion displays and Trials.
- `node --test scripts/pet-storybook-assets.test.mjs` validates all 21 illustrated paths, continuity across entrypoints, runtime pose selection, and placement cache versions.
- `python3 scripts/devil-tools-validate-svg.py` parses first-party SVG XML and rejects broken markup, duplicate IDs, active scripts and external dependencies.
- Maintain one canonical `main` branch, without PRs or temporary release branches.

Future artwork goal: fully illustrated intermediate forms for signature species plus distinct idle/reaction poses that preserve silhouettes and props. After the core pets, give the remaining Sanctuary species their own natural affinity palettes; do not flatten the roster into a single Neon style.

## Evolved storybook portraits · November 15, 2026

All **five existing earned Starborn forms** now use the corresponding first-form character as the consistent silhouette, embellished with unique, manually authored SVG art layers behind and in front of the character. They replace the legacy neon-jungle illustrations, not the progression or server-granted unlocks. SVGs remain 512×512, self-contained, accessible, and without baked-in text.

| Evolution | Illustration changes |
| --- | --- |
| Lydibloom | Four fairy-petal wings, golden garden lantern buds and shell flourishes |
| Supreme Mini Villain | Large royal bat wings, velvet cape, crooked scepter and dusk sparkles |
| Everguard Eddie | Ancient protective shield, warding runes, lantern stars and chest crest |
| Minion Mouse: Mastermind | Moon-map compass, paper tunnel charts and tiny brass clockwork pieces |
| Boo Thang: Heartlight | Moon veil, translucent ribbon wings and softly shining heart talisman |

Chunky Monkey and Crush keep their new first-form artwork; neither has a server-authorized Starborn evolution yet, so no unauthorized game unlock or economy changes were made. Run `node --test scripts/pet-storybook-evolutions.test.mjs` to validate the new evolution source assets.
