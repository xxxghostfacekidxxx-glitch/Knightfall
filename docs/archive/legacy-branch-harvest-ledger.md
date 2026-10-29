# Knightfall legacy branch harvest ledger

Historical source: `refs/tags/archive/knightfall-cleanup-2026-10-29/<branch>`. These tags preserve old commits; **archiving is not equivalent to merging**. Recovered production code must be tested separately.

| Archived branch | Review / disposition |
| --- | --- |
| `add-chaos-cartridge-games-2026-10-19` | Older arcade landing/catalog pages; current pages retained. |
| `arcade-originality-upgrade-layer-2026-10-21` | Wagonbound and Last Drop Lemonade already exist in newer main versions; regression protection added. |
| `arcade-progression-saves-round-ten-2026-10-22` | Broad older arcade pages, save, feedback, fullscreen, and CSS; current files are more developed, do not overwrite. |
| `arcade-save-revision-conflicts-2026-10-20` | Old migration number 0020 superseded by main's 0029; migration regression test added. |
| `chaos-cartridge-mega-expansion-2026-10-19` | Older arcade and Worker code; preserve archive, selectively port only demonstrably missing features. |
| `ci-trigger-fix-verification` | Historical README-only CI experiment; no production merge. |
| `feat/arcade-save-restore-wave-8` | Original downhill Slush Rush recovered as separate game; its browser save smoke case retargeted; other games have newer implementations. |
| `feat/devil-tools-eight-icons-2026-10-29` | Icon SVGs and neon CSS already on main; missing archived tests restored. |
| `feat/monster-four-move-loadouts` | Current main already has matching move code and tests; retain modern version. |
| `feature/chaos-cartridge-card-room` | Blackjack, Five-Card Draw and War exist in newer Card Room; regression protection added. |
| `feature/monster-mmo-prototype` | Eight SVGs restored and wired to current portraits; prototype plan, status and staging migrations archived. |
| `fix/arcade-save-revisions-renumbered-2026-10-23` | Production migration 0029 already identical on main; isolated arcade Wrangler staging example recovered. |
| `fix/arcade-static-audit` | Older static arcade pages and catalog; newer main versions retained. |
| `fix/messages-older-history-refresh-2026-10-23` | Cursor pagination repair selectively ported to newer messages page with regression test. |
| `fix/rebase-save-resume` | Arcade save-resume files superseded by newer main; older snapshot retained for reference. |
| `opensource-toolkit-import-2026-10-22` | Toolkit scripts/catalog already on main; historical license review archived. |
| `staging/monster-mmo-isolated` | Staging smoke script and configuration archived; no old production backend overwrite. |

## Recovery principles

1. Never apply an older database migration simply because it exists in a tag.
2. Compare modern behavior before replacing frontend pages or the Worker.
3. Keep old games as separate routes only when they offer materially different gameplay and are safe to host.
4. Add focused regression tests for recovered features and validate CI before claiming a release is healthy.
5. Preserve the archive tags for code that is not yet integrated; branch deletion did not destroy it.

## Remaining validation

The ledger records source review and recovery decisions, not a claim that every historic change was ported. Browser automation, GitHub Actions results, and Cloudflare deployment need independent verification.
