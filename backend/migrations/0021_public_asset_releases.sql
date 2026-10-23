-- Public, approved game-asset release metadata. This is deliberately separate from private vault tables.
CREATE TABLE IF NOT EXISTS public_asset_releases (
  id TEXT PRIMARY KEY CHECK(length(id) = 32),
  asset_name TEXT NOT NULL CHECK(length(asset_name) BETWEEN 1 AND 64),
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK(content_type = 'image/png'),
  size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 8 AND 2097152),
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  etag TEXT
);
CREATE INDEX IF NOT EXISTS idx_public_asset_releases_created
  ON public_asset_releases(created_at DESC);
