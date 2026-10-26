-- Immich-inspired private album organization. All access is owner-scoped.
CREATE TABLE IF NOT EXISTS media_albums (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_albums_owner ON media_albums(owner_id,created_at DESC);
CREATE TABLE IF NOT EXISTS media_album_photos (
 album_id INTEGER NOT NULL REFERENCES media_albums(id) ON DELETE CASCADE,
 photo_id INTEGER NOT NULL REFERENCES profile_photos(id) ON DELETE CASCADE,
 added_at TEXT NOT NULL,
 PRIMARY KEY(album_id,photo_id)
);
CREATE INDEX IF NOT EXISTS idx_media_album_photos_photo ON media_album_photos(photo_id);
CREATE TABLE IF NOT EXISTS media_photo_favorites (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 photo_id INTEGER NOT NULL REFERENCES profile_photos(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL,
 PRIMARY KEY(user_id,photo_id)
);
