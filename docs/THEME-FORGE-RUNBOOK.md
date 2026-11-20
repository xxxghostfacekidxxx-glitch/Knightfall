# Knightfall Theme Forge: switching and adding themes
Updated 2026-11-20.

## Switch a published theme (no redeploy)

1. Sign in as Osiris/GOD or an explicitly delegated, accepted admin partner.
2. Open **/theme-crew.html** in Knightfall's production domain.
3. Click one of the reviewed visual cards. The current tab previews it immediately; this is private to this browser session.
4. Use **Open homepage preview** or **Copy preview link** for a full-page example. Query previews cannot publish.
5. Press **Publish sitewide** and confirm. The backend enforces Origin, role, revision, and a compare-and-swap database update. Other open tabs on the same device refresh immediately through BroadcastChannel/storage signals; other visible devices check every 20 seconds.
6. Press **Rollback last change** if needed. This restores the previous published preset and records a new revision. Refresh live status after concurrency warnings.

Never make theme changes by editing generated HTML or pasting arbitrary CSS into member profiles. The backend has no arbitrary CSS publishing endpoint. The internal preset key `cathedral` remains the stable compatibility alias for **Black Sun Temple** until a data migration is designed and tested.

## Architecture and ownership

| Responsibility | Owner |
| --- | --- |
| Theme selection state, role checks, revision guard, audit log | `backend/src/theme-crew.js`, D1 `site_settings` |
| Live preview and same-device publish broadcast | `public/theme-crew-runtime.js` |
| Staff Theme Forge UI | `public/theme-crew.html`, `public/theme-crew-ui.js` |
| Preset color and shared presentation recipes | `public/theme-crew.css` |
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
6. Add applicable local art to the service worker cache; version the changed JS/CSS and `CACHE_NAME`. Existing home and runtime URL caches must revalidate.
7. Add a regression test for the new key and its accessibility properties. Run `node scripts/pages-release-guard.mjs` and browser smoke tests at 390px, 900px and 1366px before calling it production-ready. Verify the actual Cloudflare Pages deployment.

## Limits and safe defaults

- Only GOD and the accepted delegated admin partner can publish; other admins may inspect and preview.
- Keep `profile-custom-theme`, `#profile[data-theme]`, `.kf-gameplay-page` and `.chaos-glitch-arcade` exclusions. Do not retheme game canvases, private bots, user artwork or their self-selected styles.
- A remembered theme in localStorage is a visual offline fallback, never authorization. The public API remains the authority for the live theme. Query parameters and clipboard preview links never write server state.
- Live switches are instant to signal on the same browser and are normally seen within 20 seconds on other visible clients. Server-side publishing still requires an authorized request and a successful response.
- Keep CSS layering centralized; remove superseded rules rather than adding yet another higher-specificity override.
- Use one `main` branch. Do not create PRs or duplicate feature branches for routine Theme Forge work.
