-- Reject duplicate or out-of-order Stripe subscription events before changing Premium access.
-- Stripe event timestamps are in whole seconds; when two events share a timestamp,
-- inactive status has priority to avoid accidental VIP access.
ALTER TABLE stripe_member_customers
 ADD COLUMN last_subscription_event_created INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stripe_member_customers
 ADD COLUMN last_subscription_event_priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stripe_member_customers
 ADD COLUMN last_subscription_event_id TEXT;
