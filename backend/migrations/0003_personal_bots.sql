CREATE TABLE IF NOT EXISTS personal_bots (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  system_prompt TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(owner_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_personal_bots_owner ON personal_bots(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_bots_public ON personal_bots(is_public, updated_at DESC);