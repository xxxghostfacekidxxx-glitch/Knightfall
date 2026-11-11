-- 0126: Member profile wall interactions. Additive; no existing data changed.
-- Reactions belong to real authenticated accounts and can be changed or removed.
CREATE TABLE IF NOT EXISTS profile_wall_reactions (
  activity_id INTEGER NOT NULL REFERENCES social_activity(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK(reaction IN ('fire','heart','skull')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(activity_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_profile_wall_reactions_user ON profile_wall_reactions(user_id,created_at DESC);

-- One level of comments, soft deletion preserves moderation audit context.
CREATE TABLE IF NOT EXISTS profile_wall_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER NOT NULL REFERENCES social_activity(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_profile_wall_comments_activity ON profile_wall_comments(activity_id,id DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profile_wall_comments_user ON profile_wall_comments(user_id,created_at DESC);
