// Retry only transient failures and only when no device accepted the push.
// A partial success must not be replayed to devices that already received it.
export function isTransientPushStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export function shouldRetryPushDelivery(delivery) {
  if (!delivery || typeof delivery !== "object") return true;
  const accepted = Number(delivery.accepted) || 0;
  const transient = Number(delivery.transient) || 0;
  const attempted = Number(delivery.attempted) || 0;
  return accepted === 0 && transient > 0 && attempted > 0;
}
