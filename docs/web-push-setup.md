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

## 3. Verify in a real browser

1. Sign in to https://ash-fall.com/notifications.html on a supported browser.
2. Choose **Enable push notifications** and grant browser permission.
3. Save the message, community, and account alert preferences.
4. Use **Send test notification** and confirm it arrives with the tab backgrounded, then repeat with the site closed.
5. Send a message from a different account and verify only eligible recipients are notified.
6. Disable push, then confirm the subscription is removed for that account/device.
7. Check Worker logs for `web_push_delivery_failed` or `web_push_subscription_failed` warnings.

## 4. Authenticated ownership acceptance test

Run this only against a staging deployment with two disposable test accounts and a real push subscription belonging to test account A. Do not use an administrator's or a real user's session cookie. The test registers the supplied subscription, attempts cross-account deletion as account B, verifies the subscription still belongs to A, and cleans up as A.

```sh
PUSH_TEST_BASE_URL=https://staging.example \
PUSH_TEST_USER_A_COOKIE='knightfall_session=TEST_ACCOUNT_A_SESSION' \
PUSH_TEST_USER_B_COOKIE='knightfall_session=TEST_ACCOUNT_B_SESSION' \
PUSH_TEST_SUBSCRIPTION_JSON='{"endpoint":"https://push-provider.example/…","keys":{"p256dh":"…","auth":"…"}}' \
node scripts/push-notifications-auth-acceptance.mjs
```

Replace placeholders locally. Never commit cookies, endpoint credentials, or subscription key material. The endpoint must be from a provider allowed by the Worker. The script deliberately does not call the test-send endpoint, which would deliver a real notification.

This acceptance test checks API authorization; it does not prove actual device delivery. The final delivery acceptance requires a real browser/device to receive a test push with the page backgrounded and closed, plus a separate message-recipient test.

Quiet-hour values are interpreted as UTC. Browser/device support and permission settings affect whether background notifications can be displayed. In-app notifications remain available regardless of push permission.


## 5. Android mobile troubleshooting and device-specific verification

Desktop delivery does **not** prove the Android subscription is healthy. Sign into the same Ash-Fall account on the phone, using Chrome or the installed Ash-Fall PWA, and open `/notifications.html`.

1. If an **Ash-Fall update ready** banner appears, apply it so the new push service worker activates. Close and reopen the app afterward.
2. Check the **This device** diagnostics: browser permission, local browser subscription, and D1 server registration must all agree. A browser subscription that is missing from D1 is automatically re-registered while permission is granted.
3. Tap **Repair push on this device** if a subscription expired, credentials changed, or registration still fails. On a fresh installation, use **Enable push notifications**. Permission is requested directly from the button tap, before any awaits or network traffic, to preserve Android's user-gesture requirement.
4. Tap **Test this device**, not a broad account-wide test. The client includes this subscription's endpoint and the Worker validates it belongs to the current user, then sends only to the matching row. A desktop delivery can no longer make a phone test falsely look successful.
5. Interpret the stages carefully: *server registration connected* means D1 has the phone; *provider accepted* means the push service accepted the encrypted payload; *service worker received* means the phone's service worker handled the event and `showNotification` resolved. None of these independently prove Android actually displayed a notification banner.
6. On Android, check Settings → Apps → Chrome (or the installed Ash-Fall app) → Notifications, and Chrome → Settings → Site settings → Notifications → ash-fall.com. Check Do Not Disturb, notification channels, and app background/battery restrictions. If using an embedded browser with no PushManager support, open the site directly in Chrome.
7. Remember quiet hours (UTC) and per-category preferences can prevent sends. The test endpoint now reports a useful reason for skipped or rejected sends. A mobile push provider's rejection (including expired 404/410 endpoints) no longer gets confused with another device's success.

Server delivery runs concurrently across each account's device subscriptions. If one provider accepts a push and another has a transient failure, queued work retries only the failed device's endpoint, rather than duplicating notifications to the successful devices. Expired devices are removed so the phone can re-register.

**Privacy:** Push endpoints and subscription keys are authentication-like tokens. Do not post them in chat, bug reports, or screenshots. Test output reports provider codes and delivery counts without exposing tokens. Web Push browser/device delivery cannot be conclusively validated from CI alone; acceptance still requires a real phone test.
