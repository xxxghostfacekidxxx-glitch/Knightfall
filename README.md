# Knightfall / Ash-Fall

The Ash-Fall community site and its Cloudflare Pages frontend.

## Current layout

- `public/` - static site files served by Cloudflare Pages
- `public/index.html` - landing page
- `public/homepage.html` - forum/community page
- `public/*.css` - page styles
- `backend/` - Cloudflare Worker API and D1 migrations; excluded from the public Pages output
- `wrangler.jsonc` - Cloudflare Pages configuration
- `GitHub CodeQL default setup` - JavaScript/TypeScript security analysis

## Cloudflare Pages

The site is configured to use `./public` as its Pages build output directory. There is no framework build step required for the current static frontend.

For local testing:

```bash
npx wrangler pages dev ./public
```

For a direct Pages deployment:

```bash
npx wrangler pages deploy ./public
```

The Cloudflare dashboard/Git integration should use the repository root as the project root and `public` as the build output directory when configured outside Wrangler.

## Architecture note

The public website and backend/API are intentionally kept separate. The frontend should not contain secrets, API credentials, or server-side code.

## Community features

- `public/bots.html` lists public personal bots; `public/personal-bots.html` is the signed-in admin/moderator bot workspace.
- `public/die-ary.html` provides each signed-in member with a private journal; entries are not shown on public profiles and API reads/edits/deletes are scoped to the authenticated owner.
- `public/shops.html` lists public creator shops; `public/shop-builder.html` is the quick-build planner; `public/my-shop.html` manages a member's own catalog; `public/store.html` renders a public shop.
- Personal bot limits are enforced by the API and the D1 `personal_bots_owner_limit` trigger: 10 for administrators and 5 for moderators.
- The `Adults Only (18+)` forum category is hidden until a signed-in member completes an 18+ self-attestation. The confirmation is account-bound in KV for 30 days and enforced by the API for category listing, thread viewing, creation, and replies. This is self-attestation, not identity verification.
- Public Miss Chaos is never configured for explicit NSFW content, even for age-confirmed users. Personal bots can use adult-theme guidance after 18+ confirmation. Public bots must be explicitly marked `NSFW (18+)` by their creator to enable adult-theme guidance; unmarked public bots remain general-audience and NSFW-marked bots require age confirmation before chat. The underlying AI model/provider may still restrict outputs, and sexual content involving minors, age-ambiguous participants, coercion, or exploitation remains prohibited.
- The `Astrology` forum category covers birth charts, zodiac signs, planetary transits, compatibility, and astrological traditions.
- Shops currently publish product catalogs only. Checkout, payment processing, taxes, order management, and automated supplier fulfillment are not active; do not present catalog listings as completed ecommerce transactions.

## Checks and deployment

- Run `node scripts/static-audit.mjs` to syntax-check frontend and Worker JavaScript, inline HTML scripts, Wrangler configs, local asset references, duplicate HTML IDs, and CSS brace balance.
- The runtime smoke workflow checks the live public API and anonymous authorization boundaries. It does not create production test accounts.
- The role/ownership audits need the six `KNIGHTFALL_MEMBER_*`, `KNIGHTFALL_MODERATOR_*`, and `KNIGHTFALL_ADMIN_*` GitHub Actions secrets. Without them, those authenticated matrices are explicitly skipped.
- The Worker deployment workflow deploys code only. D1 migrations must be applied through an authorized Cloudflare connection before a migration-dependent release. From `backend/`, review `npx wrangler d1 migrations list knightfall-forum --remote` and apply pending migrations with `npx wrangler d1 migrations apply knightfall-forum --remote` only after verifying the target database and the migration order.
- Never use production smoke tests that create disposable accounts or permanent content unless the test includes verified cleanup. Prefer a dedicated staging database for mutating end-to-end tests.
## Installable mobile app

The frontend now includes the first phase of the Knightfall Progressive Web App (PWA):

- `public/manifest.webmanifest` defines the app name, standalone display mode, theme, and launch page.
- `public/icons/knightfall.svg` supplies the initial scalable app icon.
- `public/sw.js` provides a small offline shell fallback. It does not cache API responses or private account, message, notification, admin, personal-bot, or vault routes.
- `public/nav.js` registers the service worker and exposes the browser's native install prompt when supported.

After the latest Pages deployment is live, open `https://ash-fall.com` in Chrome on Android. Use the browser's **Install app** or **Add to Home screen** option; if the browser exposes its native install prompt, Knightfall's navigation will also show **Install App**. Installation support and wording vary by browser. This is the web-app foundation, not yet a separately packaged Android APK or a Play Store release. The site still needs an online connection for account actions, forums, bots, and AI chats.
