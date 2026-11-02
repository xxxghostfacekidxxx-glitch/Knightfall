# Devil Tools Vector Graphics Standard (v1)

This file defines production standards for Ash-Fall / Knightfall's original assets.

## Preserve APIs, not old pixels
- Existing SVG URLs and game sprite dimensions are public interfaces. Upgrade *in place*, rather than rename, delete or change \`viewBox\` coordinates without updating consumers.
- Canonical mascot artwork is under \`public/assets/devil-tools/neon-nuisances\`; game mirrors must be exact copies unless deliberately optimized, with that decision documented.
- SVGs must be self-contained: no external fonts, images, scripts, event handlers or resources.

## Distinct visual identity
- Keep high-contrast silhouettes at small sizes. Add detail where it improves recognition rather than noise.
- Acid green \`#c6ff45\`, hot pink \`#ff55d8\`, spectral cyan \`#79ffe7\`, bone white \`#ebfaff\`, bruised violet and dark ink are shared colors. Supporting colors can reflect the character.
- Use a dominant focal fill, secondary dimensional shading and restrained specular highlights. Glows should frame the art, not flatten it into a neon blur.
- Icons are legible at 24–48 px, game art at its native size, hero mascots at 128px and up.
- A character's face, posture, silhouette and motion should communicate personality independently of hue.

## Accessibility and animation
- \`<svg role="img" aria-labelledby="title desc">\` with meaningful \`<title id="title">\` and \`<desc id="desc">\` for expressive graphics.
- All animated variants must honor \`prefers-reduced-motion\`; when reduced motion is requested, leave the still frame readable.
- Keep CSS animation inside the SVG. Avoid external stylesheets and JavaScript.

## Quality gates
- \`node scripts/devil-tools-svg-audit.mjs --write-report\` inventories first-party assets, missing references and outdated game mirrors. It does **not** modify art.
- \`node scripts/devil-tools-svg-audit.mjs --strict\` rejects invalid SVG roots, unsafely embedded executables, duplicate IDs and broken mascot manifest references.
- \`node --test scripts/mascot-art.test.mjs scripts/test-mascot-remaster.mjs\` checks character assets, animation and gallery references.
- Visual inspection remains mandatory. Shape counts, gradients and file sizes are *review signals*, not an objective quality score. Flat icons are allowed where contrast, clarity and usability demand them.

## Design batches
1. Neon Nuisances: upgrade original masters and actual variants together.
2. Gravewave effects: upgrade 16 arcade gameplay icons while preserving 96x96 hitboxes.
3. Monster sprites: upgrade eight first-party creatures without changing their asset paths.
4. Large arcade sprites, tools icons, decorative art and UI marks: work from inventory, verify consumers and update only deliberate duplicates.
5. Validate desktop/mobile Devil Tools preview, arcade rendering and Cloudflare production assets. Never claim deployment from a source commit alone.
