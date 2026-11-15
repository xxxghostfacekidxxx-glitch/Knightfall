# Knightfall Misfit Studio: Forge2D production renderer

HumanForge Forge2D v0.8.1, licensed under MIT, is the **only** Misfit figure rendering engine.

The former hand-built 47KB renderer has been replaced by `public/misfit-avatar.js`, a slim compatibility bridge mapping Knightfall's existing 27-field avatar JSON into Forge2D's model. The old illustration implementation, duplicate renderer lab, and old avatar-cartoon stylesheet are removed.

All saved slot data, D1 Worker validation, profile activation, avatar editor choices, SVG/PNG exports, and Sanctuary keeper images still use the original member data. The editor, profile editor, profile display and sanctuary await `KnightfallMisfitAvatars.ready` before rendering.

Some uncommon legacy choices (non-human ears, unnatural skin colors, special hairstyles) are visually approximated by Forge2D while the original values remain saved for future expanded art options.

The library currently loads from pinned URL `https://esm.sh/humanforge@0.8.1/forge2d?bundle`. External loading requires network access; there is no retired-engine fallback. Bundling Forge2D locally is recommended before offline use.

Upstream and license: https://github.com/abdulrehman043/humanforge ; https://github.com/abdulrehman043/humanforge/blob/main/LICENSE
