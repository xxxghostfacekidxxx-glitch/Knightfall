CREATE TABLE IF NOT EXISTS profile_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK(size_bytes > 0 AND size_bytes <= 8388608),
  caption TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'gallery' CHECK(kind IN ('avatar','gallery')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_kind_created
  ON profile_photos(user_id, kind, created_at DESC);
