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

The current push delivery helper catches per-subscription failures, so the consumer can acknowledge a job even if a remote push provider rejected delivery. Treat this as best-effort delivery until explicit failure classification and retry telemetry are added.

Do not enable Queues on production until the resource exists, the consumer is attached, and usage has been confirmed within free limits.
