# Knightfall historical branch archival (2026-10-29)

The cleanup workflow at `.github/workflows/archive-and-prune-legacy-branches.yml` is intended to preserve each historical branch as a lightweight Git tag before deleting its branch ref. **An archive tag is not a merge:** unique code may remain outside `main`.

## Intended archive tags

- `archive/knightfall-cleanup-2026-10-29/add-chaos-cartridge-games-2026-10-19`
- `archive/knightfall-cleanup-2026-10-29/arcade-originality-upgrade-layer-2026-10-21`
- `archive/knightfall-cleanup-2026-10-29/arcade-progression-saves-round-ten-2026-10-22`
- `archive/knightfall-cleanup-2026-10-29/arcade-save-revision-conflicts-2026-10-20`
- `archive/knightfall-cleanup-2026-10-29/chaos-cartridge-mega-expansion-2026-10-19`
- `archive/knightfall-cleanup-2026-10-29/ci-trigger-fix-verification`
- `archive/knightfall-cleanup-2026-10-29/feat/arcade-save-restore-wave-8`
- `archive/knightfall-cleanup-2026-10-29/feat/devil-tools-eight-icons-2026-10-29`
- `archive/knightfall-cleanup-2026-10-29/feat/monster-four-move-loadouts`
- `archive/knightfall-cleanup-2026-10-29/feature/chaos-cartridge-card-room`
- `archive/knightfall-cleanup-2026-10-29/feature/monster-mmo-prototype`
- `archive/knightfall-cleanup-2026-10-29/fix/arcade-save-revisions-renumbered-2026-10-23`
- `archive/knightfall-cleanup-2026-10-29/fix/arcade-static-audit`
- `archive/knightfall-cleanup-2026-10-29/fix/messages-older-history-refresh-2026-10-23`
- `archive/knightfall-cleanup-2026-10-29/fix/rebase-save-resume`
- `archive/knightfall-cleanup-2026-10-29/opensource-toolkit-import-2026-10-22`
- `archive/knightfall-cleanup-2026-10-29/staging/monster-mmo-isolated`

## Recovery

After a workflow run succeeds, confirm the tag exists before using it:

```bash
git fetch origin --tags
git show-ref --verify 'refs/tags/archive/knightfall-cleanup-2026-10-29/feature/monster-mmo-prototype'
git switch -c restore-monster-prototype 'refs/tags/archive/knightfall-cleanup-2026-10-29/feature/monster-mmo-prototype'
```

To restore a different branch, substitute its archive tag. Review and selectively cherry-pick or port changes into a fresh branch from `main`. Do not merge an old branch wholesale into the current frontend/backend.

## Preserved in main during reconciliation

- Eight legacy original monster SVG sprites under `public/assets/monster-sprites/`.
- Archived historical prototype plan, status, staging smoke test, and isolated staging SQL in `docs/archive/monster-mmo/`.
- Current messaging pagination cursor fix and regression checks.

**Completion requires verification:** branch deletion is not complete merely because the workflow was committed. Check GitHub Actions and the branch list. Keep this recovery guide and archive tags after the workflow itself is removed.
