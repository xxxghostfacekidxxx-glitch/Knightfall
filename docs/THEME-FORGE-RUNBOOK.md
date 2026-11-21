# Knightfall Theme Forge: independently switching and adding realm themes
Updated 2026-11-20.

## Switch a published theme (no redeploy)

1. Sign in as Osiris/GOD or an explicitly delegated, accepted admin partner.
2. Open **/theme-crew.html** in Knightfall's production domain, then select **Knightfall / Shared**, **The Madhouse**, **Chaos Cartridge**, **Chaosphere**, or **Eye of Chaos / Osiris & Isis**.
3. Click one of the reviewed visual cards. The current tab previews it immediately; this is private to this browser session.
4. Use **Open homepage preview** or **Copy preview link** for a full-page example. Query previews cannot publish.
5. Press **Publish selected realm** and confirm. Only that realm changes; untouched realms inherit the shared appearance. The backend enforces Origin, role, revision, and a compare-and-swap database update. Other open tabs on the same device refresh immediately through BroadcastChannel/storage signals; other visible devices check every 20 seconds.
6. Press **Rollback last change** if needed. This restores the previous published preset of the selected realm and records a new realm-specific revision. Refresh live status after concurrency warnings.

Never make theme changes by editing generated HTML or pasting arbitrary CSS into member profiles. The backend has no arbitrary CSS publishing endpoint. The internal preset key `cathedral` remains the stable compatibility alias for **Black Sun Temple** until a data migration is designed and tested.

## Global Design Controls (sitewide shared elements)

The **Global Design Controls** panel appears above independent realm presets. It changes the shared interface *in every realm*, not each realm's chosen colors, identity or artwork. Its currently allowlisted options are:

| Global control | Approved choices | Intended ownership |
| --- | --- | --- |
| Interface spacing | Balanced, Compact, Relaxed | Shared header and navigation spacing |
| Corners | Soft, Angular, Rounded | Shared menus, UI panels and staff controls |
| Shared UI text | Standard, Large, Extra large | Shared navigation labels and staff controls |
| Shared atmosphere | Ceremonial, Subtle, Minimal | Shared panel and chrome shadows |

The controls are stored independently under D1 `site_settings.theme_crew_global_controls`, with their own revision and previous values. The public `GET /api/theme` provides the reviewed `globalControls` map alongside the existing realm presets. The staff `GET /api/god/theme/status` exposes published control state, approved choices, and previous settings for rollback. Authorized staff publish with `POST /api/god/theme/global` using `{controls,expectedRevision}`, or rollback with `POST /api/god/theme/global/rollback` using `{expectedRevision}`. The same Origin, GOD/delegated admin role, CSRF-origin and compare-and-swap guards apply. Writes are audited.

**Preview** changes only the current browser tab's approved chrome values, using a separate sessionStorage key. Neither preview nor global publication changes realm-specific presets; users retain their custom profile palettes and hosted game rendering stays out of scope. Reduced-motion OS preferences remain authoritative. Unknown values, extra CSS properties, or stale revisions are rejected. When the Worker has not yet deployed this contract, the UI disables global publication instead of silently sending an unsupported write.

This adds a bounded new global design layer, not a license to keep adding forced global overrides. The older legacy CSS remains to be migrated. New shared components should consume the four `--kf-global-*` tokens from `public/global-design-controls.css` and guard their selectors from user content/gameplay.

## Architecture and ownership

| Responsibility | Owner |
| --- | --- |
| Independent realm theme state, role checks, revision guard, audit log | `backend/src/theme-crew.js`, D1 `site_settings` |
| Live preview and same-device publish broadcast | `public/theme-crew-runtime.js` |
| Staff Theme Forge UI | `public/theme-crew.html`, `public/theme-crew-ui.js` |
| Global shared chrome controls | `backend/src/theme-crew.js`, `public/global-design-controls.css`, `public/theme-crew-ui.js` |
| Preset color and shared presentation recipes | `public/theme-crew.css` |
| Realm-specific chrome tokens and staff selector | `public/realm-theme-engine.css`, `public/theme-crew.html`, `public/theme-crew-ui.js` |
| Approved Egyptian Black Sun art and homepage visual | `public/assets/knightfall/black-sun-hero-illustration.webp`, `public/index.html`, `public/knightfall-requiem.css` |
| Canonical root stylesheet, cascade ordering | `public/theme.css`, `public/nav.js` |
| Installable offline cache | `public/sw.js` |
| Static source checks before release | `scripts/theme-forge-fast-switch.test.mjs`, `scripts/pages-release-guard.mjs` |

### Add a new approved theme

1. Create and optimize original, local artwork in `public/assets/knightfall/`. Prefer AVIF or WebP. Include dimensions and meaningful alternative text when placed in HTML. Keep static images reasonably sized for mobile.
2. Add an allowlisted preset with a stable snake_case key to `THEME_CREW_PRESETS` in `backend/src/theme-crew.js`. A color-only or visual preview is **not** permission to publish arbitrary code.
3. Add that key to `KNOWN` in `public/theme-crew-runtime.js`, and the local thumbnail path to `PREVIEW_ART` in `public/theme-crew-ui.js`.
4. Define the theme's colors in one scoped preset block in `public/theme-crew.css`, using existing `--kf-realm-*` and `--kf-crew-*` tokens instead of duplicating 100 selectors. Do not add independent stylesheets for every new preset.
5. If the theme needs different homepage artwork, use the existing controlled artwork treatment and keep real text readable; do not layer permanent pseudo-elements over buttons, chat, or the editor.
6. Add applicable local art to the service worker cache and increment `CACHE_NAME`. Public pages reference stable `/theme.css`, `/nav.js`, and `/theme-crew-runtime.js` URLs, which revalidate at the edge and use network-first PWA caching. Only centralized CSS `@import` versions should change when a child stylesheet changes. Do not restore per-page query-string versions.
7. Update the backend preset, browser `KNOWN` allowlist, preview thumbnail map, and scoped CSS together. The regression test checks that they remain synchronized. Add an accessibility test for the new artwork. Run `node scripts/pages-release-guard.mjs` and browser smoke tests at 390px, 900px and 1366px before calling it production-ready. Verify the actual Cloudflare Pages deployment.

## Limits and safe defaults

- Only GOD and the accepted delegated admin partner can publish; other admins may inspect and preview.
- Keep `profile-custom-theme`, `#profile[data-theme]`, `.kf-gameplay-page` and `.chaos-glitch-arcade` exclusions. Do not retheme game canvases, private bots, user artwork or their self-selected styles.
- A remembered theme in localStorage is a visual offline fallback, never authorization. The public API remains the authority for the live theme. Query parameters and clipboard preview links never write server state.
- Live switches are instant to signal on the same browser and are normally seen within 20 seconds on other visible clients. Server-side publishing still requires an authorized request and a successful response.
- Keep CSS layering centralized; remove superseded rules rather than adding yet another higher-specificity override.
- Use one `main` branch. Do not create PRs or duplicate feature branches for routine Theme Forge work.

## Realm isolation and API contract

There are five selectors: `site` (shared site), `madhouse`, `arcade`, `chaosphere`, and `admin` (Eye of Chaos, Osiris and Isis). The public `GET /api/theme` response retains its original top-level preset and revision fields and adds the `realms` map. Realms without a published override inherit the current shared theme. The first independent publish snapshots the inherited preset. Subsequent changes and rollback use a separate `theme_crew_realm_<realm>` row and revision in the existing D1 `site_settings` table.

Authorized staff POST the chosen `realm` and `expectedRevision` to the existing `/api/god/theme/activate` or `/rollback` API. The backend still enforces the original GOD or verified delegated admin partner permission, allowed origins, vetted preset names, compare-and-swap, and audit log. The admin **appearance** is shared by Osiris and Isis; this is not a new authorization role.

`public/theme-crew-runtime.js` chooses the known realm from the current route, not from user-supplied custom CSS, and applies one active preset. Preview state is per-realm and session-only, and preview URLs are accepted only on matching realm routes. Hosted arcade games, individual profile palettes, and offline pages remain isolated. The small new `realm-theme-engine.css` adds scoped chrome identity without adding `!important` rules. The older shared theme files are still being migrated to simpler component ownership, so this rollout is not yet a complete CSS rewrite.
