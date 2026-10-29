# Knightfall branch reconciliation audit — 2026-10-29

Baseline: production branch `main`. Compared every one of 31 non-main GitHub branches against `main` using GitHub's commit comparison. **Ahead** does not mean the changes are absent from production: cherry-picks, rebases and later rewrites can preserve equivalent functionality under different commit IDs.

## Already incorporated / no ahead commits (6)
- `arcade-account-bridge-rollout`
- `backend/forum-api`
- `backend/forum-api-v2`
- `feat/neon-vector-futuristic-racer`
- `fix/miss-chaos-memory-recall`
- `integrate/arcade-round-two-safe-merge-2026-10-24`

Correction: **six** branches have zero ahead commits. They can be archived after verifying no open PR or deployment depends on them.

## Monster RPG (3 branches)
- `feat/monster-four-move-loadouts`: 4 ahead, 182 behind. Adds `monster-mmo-moves.js`, a separate loadout model and tests. Current main already implements four-move display/level unlocks. **Do not merge directly**: reconcile its PP/accuracy/loadout features with server-authoritative battle validation before selectively porting.
- `feature/monster-mmo-prototype`: 123 ahead, 2862 behind. Old backend, migrations, game client and staging workflow. **Preserve as historical reference**, not a direct merge.
- `staging/monster-mmo-isolated`: 130 ahead, 2862 behind. Old isolated staging backend/migrations. **Preserve as historical reference** until active staging bindings and migrations are compared.

## Arcade and games (19 branches)
`add-chaos-cartridge-games-2026-10-19`, `arcade-account-saves-round-three-2026-10-22`, `arcade-all-games-next-steps-2026-10-21`, `arcade-every-game-round-two-2026-10-22`, `arcade-fullscreen-refinement-round-six-2026-10-22`, `arcade-fullscreen-ui-round-five-2026-10-22`, `arcade-game-specific-visuals-round-eight-2026-10-22`, `arcade-gameplay-feedback-round-nine-2026-10-22`, `arcade-gameplay-safety-round-four-2026-10-22`, `arcade-originality-upgrade-layer-2026-10-21`, `arcade-progression-saves-round-ten-2026-10-22`, `arcade-save-revision-conflicts-2026-10-20`, `arcade-ui-systems-round-seven-2026-10-22`, `chaos-cartridge-mega-expansion-2026-10-19`, `feat/arcade-save-restore-wave-8`, `feature/chaos-cartridge-card-room`, `fix/arcade-save-revisions-renumbered-2026-10-23`, `fix/arcade-static-audit`, `fix/rebase-save-resume`.
These are **19** old feature/fix branches. Most are thousands of commits behind main, and many touch the same files. Preserve unique assets and games; audit differences by file and test before cherry-picking. Never merge all simultaneously.

## Other work (3 branches)
- `ci-trigger-fix-verification`: 1 ahead, 3286 behind; README-only. No production integration needed unless documentation still relevant.
- `fix/messages-older-history-refresh-2026-10-23`: 2 ahead, 2448 behind; inspect `public/messages.html` against current messaging implementation before selective repair.
- `opensource-toolkit-import-2026-10-22`: 8 ahead, 2609 behind; preserve license-review materials and confirm license compatibility before importing any code.

## Production checks
- Cloudflare Pages project `knightfall` uses GitHub `xxxghostfacekidxxx-glitch/Knightfall`, branch `main`, automatic deployments.
- Cloudflare Workers `knightfall-api` and `knightfall-mmo-staging` exist and have recorded deployments. This **does not prove** current backend GitHub code is deployed; inspect Worker versions separately.
- Added `scripts/monster-mmo-regression.test.mjs` to protect battle navigation, viewport, pause-menu, sprite coverage, quest progress and region-save normalization.
- Do not delete branches or overwrite live Workers until migrations, active bindings and rollback points are checked.

## Reconciliation policy
1. Compare each candidate file against current main behavior, not commit count alone.
2. Prefer cherry-picking individual missing changes or rewriting small fixes on main.
3. Require syntax, regression and staging checks before production backend deployment.
4. Archive stale branches only after verifying no open PR, deployment or useful unported code depends on them.
