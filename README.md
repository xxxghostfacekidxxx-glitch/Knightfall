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
- `public/shops.html` lists public creator shops; `public/shop-builder.html` is the quick-build planner; `public/my-shop.html` manages a member's own catalog; `public/store.html` renders a public shop.
- Personal bot limits are enforced by the API and the D1 `personal_bots_owner_limit` trigger: 10 for administrators and 5 for moderators.
- Shops currently publish product catalogs only. Checkout, payment processing, taxes, order management, and automated supplier fulfillment are not active; do not present catalog listings as completed ecommerce transactions.

## Checks and deployment

- Run `node scripts/static-audit.mjs` to syntax-check frontend and Worker JavaScript, inline HTML scripts, Wrangler configs, local asset references, duplicate HTML IDs, and CSS brace balance.
- The runtime smoke workflow checks the live public API and anonymous authorization boundaries. It does not create production test accounts.
- The role/ownership audits need the six `KNIGHTFALL_MEMBER_*`, `KNIGHTFALL_MODERATOR_*`, and `KNIGHTFALL_ADMIN_*` GitHub Actions secrets. Without them, those authenticated matrices are explicitly skipped.
- The Worker deployment workflow deploys code only. D1 migrations must be applied through an authorized Cloudflare connection before a migration-dependent release. From `backend/`, review `npx wrangler d1 migrations list knightfall-forum --remote` and apply pending migrations with `npx wrangler d1 migrations apply knightfall-forum --remote` only after verifying the target database and the migration order.
- Never use production smoke tests that create disposable accounts or permanent content unless the test includes verified cleanup. Prefer a dedicated staging database for mutating end-to-end tests.
