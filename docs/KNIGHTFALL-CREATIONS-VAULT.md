# Knightfall Creations Vault

**Protected works:** all Git-tracked Knightfall artwork, original art source bundles, sprites, atlas images, icons, illustrations, 3D models and Creator Foundry source files. This includes artifacts across the arcade, not just the Egyptian theme.

## Durable repository boundary

`scripts/knightfall-creation-preserve.mjs` inventories the entire Git tree, not a handpicked collection of images. The stable preservation baseline is Git commit `1714af42e6ab0d7dd307a22f2a17549b1d867db7`.

The `--verify` check inspects every protected file at that baseline **and every protected path subsequently recorded in Git history**. It fails if any of those files is missing from current `HEAD`. This intentionally means renaming or deleting protected creations is blocked until an explicit preservation/recovery decision is made.

Only local, reviewable public artwork, images, models, original artwork archives and Foundry source qualify. Credentials, private keys, and dotenv files are excluded from archives. The script never deletes or rewrites artwork.

The `--audit` check is independent of Git history and runs in the Cloudflare Pages release guard. It verifies every required Creator Foundry workspace and the original artwork manifest's primary references still exist. These checks also cover the central `public/devil-tools.html` page, `public/creator-*` modules, the artwork gallery and source manifest. A build with a missing protected workspace will not release.

## Recoverable daily archive

The GitHub Actions workflow `Knightfall Creations Vault` runs on supported asset / Foundry changes, manually, and daily. It checks out **full Git history**, performs the deletion guard, tests module syntax, then builds:

- `knightfall-artwork-and-creator-foundry.tar.gz` containing original tracked artwork and Foundry sources
- `inventory.json` containing each protected file's relative path, file size and SHA-256 content hash

The workflow verifies the archive's file list before upload and stores both as a GitHub Actions artifact named `knightfall-art-and-creator-foundry` for 30 days. Daily successful runs refresh the recoverable snapshot. Git history remains the primary long-term version record.

To restore: open the repository's **Actions** tab, select a successful **Knightfall Creations Vault** run, download the named artifact and inspect `inventory.json`. Extract the tarball into a *separate* workspace using `tar -tzf` to preview and `tar -xzf` to extract. Verify content hashes using `sha256sum`. Do not overwrite production blindly; restore only the reviewed files and run the release guard first. For older revisions use `git show COMMIT:path/to/file` from an authorized local clone.

Local verification commands:

```bash
node scripts/knightfall-creation-preserve.mjs --audit
node --test scripts/knightfall-creation-preserve.test.mjs
node scripts/knightfall-creation-preserve.mjs --verify
node scripts/knightfall-creation-preserve.mjs --archive
node scripts/pages-release-guard.mjs
```

**Important limitation:** the Git-backed archive covers tracked source and static assets, *not* user-created drawings that were never exported, local browser drafts, unpublished member photos, or files in Cloudflare R2/D1. Approved Creator artwork is maintained separately in the existing R2 `PUBLIC_ASSETS` bucket. Protecting that bucket against account deletion requires a separately configured backup destination and retention policy. Do not create a hidden permanent archive of rejected or private member content without a clear user-facing policy. This workflow does not claim to cover R2.

## Rules for future cleanup

Keep the Creator Foundry / Developer Arsenal merged in `public/devil-tools.html` and preserve its workspace IDs, styles, sprite tools, art preparation, developer lab and original artwork manifest. Move or refactor components only when an equivalent tested path and recoverable archive are present. Never delete an image simply because a page no longer imports it, since the source may be reused for another realm, avatar, game or memorial. Keep a single `main` branch and update the protection tests whenever adding another original artwork format or Foundry workspace.
