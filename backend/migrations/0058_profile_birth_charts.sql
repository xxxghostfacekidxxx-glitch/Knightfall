CREATE TABLE IF NOT EXISTS profile_birth_charts (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 visible INTEGER NOT NULL DEFAULT 0 CHECK(visible IN (0,1)),
 chart_json TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_profile_birth_charts_visible ON profile_birth_charts(visible);
