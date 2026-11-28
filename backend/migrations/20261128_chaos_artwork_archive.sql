CREATE TABLE IF NOT EXISTS chaos_artwork_archive (
 id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL, filename TEXT NOT NULL, mime TEXT NOT NULL CHECK(mime IN ('image/jpeg','image/svg+xml')), engine TEXT NOT NULL, title TEXT NOT NULL, recipe_json TEXT NOT NULL CHECK(length(recipe_json)<=4096), sha256 TEXT NOT NULL CHECK(length(sha256)=64), byte_count INTEGER NOT NULL CHECK(byte_count BETWEEN 1 AND 4194304), created_at TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending','ready','deleting'))
);
CREATE INDEX IF NOT EXISTS chaos_artwork_owner_recent ON chaos_artwork_archive(owner_id,created_at DESC);
