/**
 * Prevent stale queued or retried push deliveries from resurfacing after an
 * authenticated member has already opened/cleared their notification.
 *
 * Only persisted, unread, owner-bound notifications qualify for ordinary push.
 * Explicit device diagnostics use a short-lived receipt token and bypass this
 * check; they are not stored in the notification inbox.
 */
export async function shouldDeliverStoredNotification(env,userId,notification,receiptToken=null){
  if(receiptToken)return {send:true,reason:"device-test"};
  const id=notification?.id;
  if(!Number.isSafeInteger(id)||id<1)return {send:false,reason:"missing-record"};
  if(!Number.isSafeInteger(userId)||userId<1)return {send:false,reason:"invalid-recipient"};
  // Check the recipient too: an old job cannot be delivered to a changed owner.
  const row=await env.DB.prepare(
    "SELECT id FROM notifications WHERE id=? AND user_id=? AND read_at IS NULL LIMIT 1"
  ).bind(id,userId).first();
  return row?{send:true,reason:"unread"}:{send:false,reason:"already-handled"};
}
