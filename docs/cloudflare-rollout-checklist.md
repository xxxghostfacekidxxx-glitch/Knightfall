# Cloudflare rollout checklist

## Turnstile
Create a Turnstile widget for ash-fall.com and www.ash-fall.com. Configure the API Worker with TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY. Keep the secret server-side. Deploy both backend and Pages frontend, then test registration on staging before production. The registration verifier rejects missing, expired, or invalid tokens when both keys are configured. Partial configuration fails closed.

## Queues
Queues is available on the Workers Free plan, but the current production Worker still sends push notifications directly. Do not add a producer binding until the named queue and a consumer have been provisioned and verified. Use an explicit dead-letter policy and check daily operation limits before enabling production delivery.

## Staging
The staging-authorization workflow requires a separately deployed staging API URL and a working /health endpoint. The anonymous checks do not replace cross-account permission testing. Never run destructive tests against production.

## R2
Do not enable broad lifecycle deletion on VAULT, MESSAGE_ATTACHMENTS, PROFILE_MEDIA, or CREATOR_MEDIA. First inventory temporary upload prefixes and verify there are no references from D1. Lifecycle cleanup must only target verified disposable objects.

## Release gates
Run node --test scripts/turnstile.test.mjs, the static audit, and browser registration checks. Confirm GitHub Actions results and Cloudflare deployment status independently. No resource creation or production activation is implied by a Git commit.
