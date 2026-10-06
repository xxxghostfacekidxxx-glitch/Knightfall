# Knightfall / Ash-Fall

The Ash-Fall community site and its Cloudflare Pages frontend.

## Current layout

- `public/` - static site files served by Cloudflare Pages
- `public/index.html` - landing page
- `public/homepage.html` - forum/community page
- `public/*.css` - page styles
- `backend/` - reserved for backend work; it is not part of the public Pages output
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
