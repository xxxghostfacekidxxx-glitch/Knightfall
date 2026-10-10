-- Multi-tenant creator shops and product catalog foundation.
-- Checkout and supplier fulfillment are intentionally handled by future provider integrations.
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
  slug TEXT NOT NULL UNIQUE CHECK(length(slug) BETWEEN 1 AND 80),
  description TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT 'custom',
  is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shops_public_updated ON shops(is_public, updated_at DESC);
CREATE TABLE IF NOT EXISTS shop_products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK(price_cents >= 0 AND price_cents <= 100000000),
  image_url TEXT NOT NULL DEFAULT '',
  supplier_url TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shop_products_shop_active ON shop_products(shop_id,is_active,created_at DESC);
