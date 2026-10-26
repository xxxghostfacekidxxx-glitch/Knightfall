-- Future member store: catalog and orders only. No paid fulfillment is active.
CREATE TABLE IF NOT EXISTS member_shop_orders (
 id TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 sku TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
 currency TEXT NOT NULL DEFAULT 'USD',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','fulfilled','cancelled','refunded')),
 provider TEXT,
 provider_payment_id TEXT UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_member_shop_orders_user ON member_shop_orders(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS member_shop_entitlements (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 extra_bot_slots INTEGER NOT NULL DEFAULT 0 CHECK(extra_bot_slots BETWEEN 0 AND 100),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS member_shop_fulfillments (
 order_id TEXT PRIMARY KEY REFERENCES member_shop_orders(id),
 user_id INTEGER NOT NULL REFERENCES users(id),
 sku TEXT NOT NULL,
 fulfilled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
