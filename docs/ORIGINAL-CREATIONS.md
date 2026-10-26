# Original Creations Archive

The canonical inventory is [public/arcade/original-creations.json](../public/arcade/original-creations.json). The administrator-only [Devil Tools](../public/devil-tools.html) workshop displays it under **Original Creations**. Every new first-party game should be added to the JSON manifest when its code and artwork are committed.

## Rules for new entries

1. Use a stable, unique game ID and a local `/arcade/hosted/<id>/index.html` path.
2. Keep editable SVG artwork under `/arcade/hosted/<id>/sprites/`; register each image in the manifest `assets` array.
3. Add a direct GitHub source link. Use `status` to distinguish committed work from browser-tested or production-verified work.
4. Do not describe a game as original when its runtime code or assets still depend on imported third-party game source.
5. Keep licenses and notices for any retained upstream material. The new manifest is a development inventory, not a substitute for a copyright or license audit.
6. Verify mobile controls, keyboard controls, fullscreen, persistence, game-over behavior and score API integration before changing the QA status.

## Current archive

The authoritative, up-to-date inventory is the JSON manifest rather than a manually maintained count in this document. Devil Tools reads the manifest dynamically, including game names, sprites, source links, and QA status.

The archive includes Cinder Merge, Cinder Drift, Ash Serpent, Ember Pop, Pyre Stacks, Ashbound Runner, Cinder Grid, Crypt Words, and Ember Clash. Each entry is committed; browser QA and live deployment confirmation remain pending.

Old imported game directories are intentionally not deleted until all references and license obligations are audited.
