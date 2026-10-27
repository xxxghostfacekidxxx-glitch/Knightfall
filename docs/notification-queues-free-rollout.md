# Free-plan notification queue rollout

The Worker now supports an optional NOTIFICATION_QUEUE producer binding and a queue consumer. Without the binding, push delivery remains synchronous.

Cloudflare Queues is available on Workers Free. Verify current free operation limits and retention in the Cloudflare dashboard before activation. Do not upgrade to Workers Paid.

## Staging first

1. Create a queue named knightfall-notifications-staging and a separate dead-letter queue in the Cloudflare dashboard only if they can be created under the current free allocation.
2. In the staging Wrangler configuration, add a producer binding named NOTIFICATION_QUEUE for the staging queue, and a consumer pointing to the same queue with a small batch size, limited retries, and the staging dead-letter queue.
3. Deploy staging and test notifications for users with and without push subscriptions, muted conversations, and quiet hours.
4. Confirm the notification appears in D1 even if queue delivery is unavailable. Test fallback when enqueue fails.
5. Verify queue volume, free usage, retries and delivery behavior. Do not create production queues until these checks pass.

Example optional Wrangler fragment (do not paste over existing bindings):

```json
"queues": {
  "producers": [{"binding":"NOTIFICATION_QUEUE","queue":"knightfall-notifications-staging"}],
  "consumers": [{"queue":"knightfall-notifications-staging","max_batch_size":5,"max_retries":3,"dead_letter_queue":"knightfall-notifications-staging-dlq"}]
}
```

## Safety

The push helper tracks attempted, accepted, expired, failed and transient deliveries. The consumer retries only when no subscription accepted the notification and at least one transient delivery failure occurred. Permanent HTTP failures are not retried; a partially accepted notification is acknowledged to avoid duplicate alerts. This remains best-effort push delivery, not an exactly-once guarantee.

Do not enable Queues on production until the resource exists, the consumer is attached, and usage has been confirmed within free limits.

## Acceptance checklist before enabling production

- [ ] The standard static-audit job passes on main.
- [ ] Staging push test reaches a subscribed device while the page is closed.
- [ ] An expired subscription is removed without repeated delivery attempts.
- [ ] A temporary provider error is retried and a permanent rejection is not.
- [ ] Muted conversations, disabled alert categories and quiet hours remain respected.
- [ ] Queue retries are capped in the staging consumer configuration.
- [ ] Cloudflare dashboard confirms the intended queue operations fit within the current Free-plan allowance.
- [ ] A rollback is documented: remove the producer binding and deploy, which restores direct delivery.

**Important:** Merely committing the queue consumer does not create a Cloudflare queue or prove background notifications work. Keep the production binding absent until these checks pass.
