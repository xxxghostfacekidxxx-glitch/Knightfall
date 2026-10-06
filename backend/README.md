# Knightfall API

Cloudflare Worker backend for Knightfall.

## Endpoints

- `GET /health` - service health check
- `GET /api/threads` - forum thread collection (currently empty until storage is connected)

## Local development

From this directory:

```bash
npx wrangler dev
```

## Deployment

```bash
npx wrangler deploy
```

The public website remains on Cloudflare Pages. This Worker is API-only.
