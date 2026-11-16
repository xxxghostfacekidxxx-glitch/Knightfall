# Knightfall Theme Crew / GOD operations

The Theme Crew is a code-defined, owner-controlled theme switchboard. It does not
alter game pixels, member-customized profile palettes, private messages or user data.

## Access

- GOD Mode → **Theme Crew**, or Eye of Chaos → **Division IV**.
- Public entry page: `/theme-crew.html`. The page may be viewed without login,
  but all controls remain hidden until the Worker verifies a GOD session.
- Existing themes: Cathedral Ascendant (default), Blood Moon Court, Verdant Crypt,
  Iron Eclipse, Royal Abyss. Recipes are built from reviewed local CSS, not
  untrusted LLM output or arbitrary member-provided CSS.
- The front end reads `GET /api/theme` without credentials; this reveals only
  preset, revision and update time. All writes require an authenticated GOD account.

## Four specialists

| Worker | Actually executes | Writes production? |
| --- | --- | --- |
| Veil Sentinel | GitHub Actions: scheduled whole-repository CSS inventory, imports, local assets, unscoped selectors, page runtime coverage | No |
| Morgue Mason | GOD-only deterministic mood-to-reviewed-recipe planner | No |
| Prism Warden | GitHub Actions: site-structure, styling, responsive, role and PWA regression gates | No |
| Switchblade | GOD-only `POST /api/god/theme/activate` or `rollback`, validated preset and optimistic revision guard | Only after explicit owner confirmation |

Workflow: `.github/workflows/theme-crew.yml`; scheduled at **10:17 UTC daily**,
manual `workflow_dispatch` available in GitHub Actions, and runs on relevant
`main` branch changes. Workflows do not create branches, PRs, or publish CSS.

## Fast visual change

1. Choose a preset or describe a mood for Morgue Mason.
2. Click **Preview locally**. Only that browser session changes; an optional
   separate preview tab opens `/?kf_theme_preview=<preset>`.
3. Review desktop/mobile and protected surfaces. Click **Publish sitewide**;
   GOD confirmation is required.
4. The backend compares the submitted `expectedRevision` against the D1
   stored revision and rejects stale requests. It writes the selected preset
   and its previous value to `site_settings`; it records an audit event.
5. Fresh pages load the new preset. Existing open tabs poll the public theme
   state every 45 seconds while visible. No Cloudflare Pages redeploy is needed.
6. **Rollback last change** is immediate and logs another revision; it restores
   the previous preset. This is not a Git revert or a content database rollback.

The public theme endpoint is `https://api.ash-fall.com/api/theme`.
JSON `POST` requests require the exact site origin and GOD authorization.
No endpoint accepts raw CSS, JavaScript, asset URLs or a GitHub token from browsers.

## Quality and limitations

- `node scripts/theme-crew-audit.mjs` inventories **all** `public/**/*.css`
  files and top-level HTML pages. It writes `artifacts/theme-crew/css-audit.json`;
  CI uploads this JSON as an artifact even when linting fails.
- `node --test backend/src/theme-crew.test.mjs scripts/theme-crew-route.test.mjs
  scripts/cathedral-overhaul.test.mjs scripts/knightfall-sitewide-artwork.test.mjs`
  tests the publisher, role isolation, presentation, and page coverage.
- Both legacy theme layers still contain significant `!important` overrides.
  This is documented technical debt. Removing them without screenshot-based
  comparisons would risk the approved theme. The scanner reports them.
- Hosted arcade games and local-first offline screens do **not** subscribe to
  the live theme. This is intentional to protect gameplay and offline behavior.
- The original 20 Agents of Chaos and ten arcade QA workers are unchanged.
  The Theme Crew is a separate division with no forum publishing rights.
- These workers are deterministic automation and owner-controlled commands,
  **not** unrestricted autonomous AI developers. A genuinely AI-generated new
  theme should go through repository tests, visual review and owner approval.
- If the Worker theme endpoint is unavailable, existing site styling falls
  back to the checked-in Cathedral appearance and site content still works.

## Troubleshooting

- If a newly published preset isn't visible: refresh after 45 seconds,
  check `/api/theme` revision, clear your session-local preview via
  **Clear my preview**, then check the current `main` Pages deployment.
- If GOD sees an authorization error: sign into your GOD account on the same
  Knightfall origin; staff/admin roles other than GOD cannot publish.
- If a CSS audit fails: open the Theme Crew workflow run, download the
  `knightfall-theme-css-inventory` artifact and inspect critical failures.
  Never auto-delete unused or game-specific styles without checking dependents.
- The theme API writes the existing D1 `site_settings` table and reuses
  `audit_logs`. It requires no new database migration.
