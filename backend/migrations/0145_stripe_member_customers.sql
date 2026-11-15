-- 0145: Stripe Billing customer ownership, separate from shop orders.
-- One Stripe customer per member. Stripe secret keys never enter D1.
CREATE TABLE IF NOT EXISTS stripe_member_customers(
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 customer_id TEXT NOT NULL UNIQUE CHECK(customer_id LIKE 'cus_%'),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stripe_member_customers_customer
 ON stripe_member_customers(customer_id);
