-- Reproducible personal bot schema and database-enforced role limits.
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

-- Enforce the 10-admin / 5-moderator cap even if requests arrive concurrently.
CREATE TRIGGER IF NOT EXISTS personal_bots_owner_limit
BEFORE INSERT ON personal_bots
WHEN (SELECT COUNT(*) FROM personal_bots WHERE owner_id = NEW.owner_id) >=
  COALESCE((SELECT CASE role WHEN 'admin' THEN 10 WHEN 'moderator' THEN 5 ELSE 0 END FROM users WHERE id = NEW.owner_id), 0)
BEGIN
  SELECT RAISE(ABORT, 'personal_bot_limit_reached');
END;
