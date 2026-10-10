-- Private administrator media vault metadata and quota reservations.
CREATE TABLE IF NOT EXISTS vault_items (
  object_key TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK(size_bytes > 0 AND size_bytes <= 52428800),
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  etag TEXT
);
CREATE INDEX IF NOT EXISTS idx_vault_items_created ON vault_items(created_at DESC);
CREATE TABLE IF NOT EXISTS vault_reservations (
  id TEXT PRIMARY KEY,
  size_bytes INTEGER NOT NULL CHECK(size_bytes > 0 AND size_bytes <= 52428800),
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vault_reservations_expiry ON vault_reservations(expires_at);
