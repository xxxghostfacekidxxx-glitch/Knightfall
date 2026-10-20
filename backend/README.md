# Knightfall API

Cloudflare Worker backend for Knightfall.

## Endpoints

- `GET /health` - service health check
- `GET /api/categories` - forum categories
- `GET /api/adult/status` and `POST /api/adult/confirm` - account-bound 18+ self-attestation (30-day TTL)
- `GET /api/categories` hides the `adults-only` category until age confirmation; adult thread reads, creation, replies, and owner edits are checked server-side
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


## Password recovery email configuration

Password recovery requires a Resend API key and a sender address on a domain verified with Resend. Configure `RESEND_API_KEY` as a secret on the `knightfall-api` Worker, and configure `PASSWORD_RESET_FROM` as a Worker variable with the verified sender address. Do not commit the API key to Git. The public endpoint deliberately returns the same response for known and unknown emails. Reset links expire after 30 minutes and are invalidated after use. Staff recovery emails the account's registered address; staff cannot view or set a member's password directly. Password changes revoke existing sessions.
