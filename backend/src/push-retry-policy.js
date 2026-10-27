// Keep queue retries conservative: a mixed result may have already reached
// some devices, and replaying it would create duplicate notifications.
export function shouldRetryPushDelivery(delivery) {
  if (!delivery || typeof delivery !== "object") return true;
  const accepted = Number(delivery.accepted) || 0;
  const failed = Number(delivery.failed) || 0;
  const attempted = Number(delivery.attempted) || 0;
  return accepted === 0 && failed > 0 && attempted > 0;
}
