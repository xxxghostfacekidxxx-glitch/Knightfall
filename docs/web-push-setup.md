# Ash-Fall Web Push setup

The feature uses standards-based Web Push from the existing Cloudflare Worker. The private VAPID key must never be committed to GitHub.

## 1. Generate VAPID keys

Run locally from any directory with Node/npm available:

```sh
npx web-push generate-vapid-keys --json
```

Keep the generated private key private. Configure the values on the Worker using Wrangler. Run these commands from the repository root; paste the corresponding generated value when Wrangler prompts.

```sh
npx wrangler secret put VAPID_PUBLIC_KEY --config backend/wrangler.jsonc
npx wrangler secret put VAPID_PRIVATE_KEY --config backend/wrangler.jsonc
npx wrangler secret put VAPID_SUBJECT --config backend/wrangler.jsonc
```

Use the generated public key for `VAPID_PUBLIC_KEY`, generated private key for `VAPID_PRIVATE_KEY`, and a monitored contact such as `mailto:admin@ash-fall.com` for `VAPID_SUBJECT`. The Worker exposes only the public key to signed-in clients.

## 2. Apply the D1 migration and deploy

```sh
npx wrangler d1 migrations apply knightfall-forum --remote --config backend/wrangler.jsonc
npx wrangler deploy --config backend/wrangler.jsonc
```

Confirm the Worker is bound to the existing `knightfall-forum` D1 database. Do not create a second database for this migration.

## 3. Verify

1. Sign in to https://ash-fall.com/notifications.html on a supported browser.
2. Choose **Enable push notifications** and grant browser permission.
3. Save the message, community, and account alert preferences.
4. Use **Send test notification** and confirm it arrives with the tab backgrounded.
5. Send a message from a different account and verify only eligible recipients are notified.
6. Disable push, then confirm the subscription is removed for that account/device.
7. Check Worker logs for `web_push_delivery_failed` or `web_push_subscription_failed` warnings.

Quiet-hour values are interpreted as UTC. Browser/device support and permission settings affect whether background notifications can be displayed. In-app notifications remain available regardless of push permission.
