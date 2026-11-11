-- 0127: Three pinned gallery creations per member, owned and privacy-scoped.
-- Safe to apply once; existing profiles, photos, reactions, and achievements are untouched.
CREATE TABLE IF NOT EXISTS profile_featured_creations (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_id INTEGER NOT NULL REFERENCES profile_photos(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 3),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,slot),
  UNIQUE(user_id,photo_id)
);
CREATE INDEX IF NOT EXISTS idx_profile_featured_creations_photo ON profile_featured_creations(photo_id);
