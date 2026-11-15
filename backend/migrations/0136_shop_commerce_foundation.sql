-- Knightfall seller-commerce foundation. Additive: no changes to existing products or shops.
-- Checkout and fulfillment are NOT enabled by this migration.
CREATE TABLE IF NOT EXISTS shop_business_profiles (
 shop_id TEXT PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
 support_email TEXT NOT NULL DEFAULT '',
 contact_url TEXT NOT NULL DEFAULT '',
 shipping_policy TEXT NOT NULL DEFAULT '',
 returns_policy TEXT NOT NULL DEFAULT '',
 processing_min_days INTEGER NOT NULL DEFAULT 1 CHECK(processing_min_days BETWEEN 0 AND 365),
 processing_max_days INTEGER NOT NULL DEFAULT 14 CHECK(processing_max_days BETWEEN 0 AND 365),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(processing_min_days <= processing_max_days)
);
CREATE TABLE IF NOT EXISTS shop_product_variants (
 id TEXT PRIMARY KEY,
 shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
 label TEXT NOT NULL CHECK(length(label) BETWEEN 1 AND 100),
 sku TEXT NOT NULL CHECK(length(sku) BETWEEN 2 AND 64),
 supplier_sku TEXT NOT NULL DEFAULT '',
 price_cents INTEGER NOT NULL CHECK(price_cents BETWEEN 0 AND 100000000),
 supplier_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK(supplier_cost_cents BETWEEN 0 AND 100000000),
 stock_status TEXT NOT NULL DEFAULT 'unknown' CHECK(stock_status IN ('unknown','available','unavailable','preorder')),
 is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
 deleted_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shop_variants_product ON shop_product_variants(shop_id,product_id,is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_variants_sku_active ON shop_product_variants(shop_id,sku) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS shop_orders (
 id TEXT PRIMARY KEY,
 shop_id TEXT NOT NULL REFERENCES shops(id),
 state TEXT NOT NULL DEFAULT 'pending_payment' CHECK(state IN ('pending_payment','paid','fulfillment_pending','fulfilling','shipped','delivered','canceled','refunded','disputed','fulfillment_failed')),
 currency TEXT NOT NULL DEFAULT 'usd' CHECK(currency='usd'),
 buyer_email TEXT NOT NULL DEFAULT '',
 subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK(subtotal_cents>=0),
 shipping_cents INTEGER NOT NULL DEFAULT 0 CHECK(shipping_cents>=0),
 tax_cents INTEGER NOT NULL DEFAULT 0 CHECK(tax_cents>=0),
 total_cents INTEGER NOT NULL DEFAULT 0 CHECK(total_cents>=0),
 stripe_checkout_session_id TEXT UNIQUE,
 stripe_payment_intent_id TEXT UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shop_orders_shop ON shop_orders(shop_id,created_at DESC);
CREATE TABLE IF NOT EXISTS shop_order_items (
 id TEXT PRIMARY KEY,
 order_id TEXT NOT NULL REFERENCES shop_orders(id),
 product_id TEXT REFERENCES shop_products(id),
 variant_id TEXT REFERENCES shop_product_variants(id),
 sku_snapshot TEXT NOT NULL DEFAULT '',
 title_snapshot TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 100),
 unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents>=0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);
CREATE TABLE IF NOT EXISTS shop_webhook_events (
 id TEXT PRIMARY KEY,
 provider TEXT NOT NULL CHECK(provider IN ('stripe','printful','cjdropshipping','printify')),
 event_id TEXT NOT NULL,
 processed INTEGER NOT NULL DEFAULT 0 CHECK(processed IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 processed_at TEXT,
 UNIQUE(provider,event_id)
);
