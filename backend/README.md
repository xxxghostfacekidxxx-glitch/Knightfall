# Knightfall API

Cloudflare Worker backend for Knightfall.

## Endpoints

- `GET /health` - service health check
- `GET /api/categories` - forum categories
- `GET /api/members` - member listing
- `GET /api/users/:username` - public profile
- `GET /api/threads` - forum thread collection
- `POST /api/threads` - create a thread (authenticated)
- `GET /api/threads/:id` - thread with replies
- `POST /api/threads/:id` - create a reply (authenticated)
- `PATCH /api/threads/:id` - edit/moderate a thread
- `PATCH /api/posts/:id` - edit a reply
- `DELETE /api/posts/:id` - delete a reply
- `POST /api/reports` - report a thread or reply
- `GET /api/moderation/reports` - moderation queue
- `PATCH /api/moderation/reports/:id` - resolve/dismiss a report

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
