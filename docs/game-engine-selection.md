# Game engine and map-tool selection

Decision: retain existing browser engines and Cloudflare backend unless a specific feature fails acceptance. No new paid hosting or production dependency is authorized by this review.

| Candidate | Role | Decision | Adoption gate |
|---|---|---|---|
| Phaser (MIT) | Browser 2D rendering/input | Reference; optional isolated prototype | Existing canvas renderer cannot meet measured input, animation or scene requirements |
| Godot (MIT) | Standalone 2D/3D engine | Defer | A standalone game needs features unavailable in the browser stack; test web export size and mobile compatibility first |
| LDtk (MIT) | Entity-rich level authoring | Reference | A campaign needs structured entity/level data beyond current map schema; validate a small JSON fixture |
| Tiled (GPL-2.0-or-later editor) | Tile map authoring | Existing compatible JSON import in Foundry; retain | Verify layer, tileset and coordinate compatibility before expanding importer; exported art retains its own license |
| Colyseus (MIT) | Multiplayer room framework | Defer | Existing Durable Object rooms cannot meet measured synchronization requirements; prototype separately, with hosting cost and auth review |

Official references: https://phaser.io/ ; https://godotengine.org/ ; https://ldtk.io/ ; https://www.mapeditor.org/ ; https://colyseus.io/ . License labels describe projects, not all dependencies or assets; verify pinned versions before importing code.

## Integration rules

- Preserve server-authoritative combat, account ownership and save revisions regardless of renderer.
- Use existing Foundry map export/import for small tile projects. Never treat arbitrary map JSON as executable code.
- Require a reproducible benchmark or missing capability before replacing an engine. Compare touch input, frame time, memory, initial download, accessibility and offline behavior on target devices.
- Keep prototypes isolated from production credentials and databases. Record dependency licenses and rollback path before merging.
- Do not add a separate multiplayer server merely to duplicate existing Cloudflare room infrastructure.

This completes the selection review; it does not certify runtime performance or install any new engine.
