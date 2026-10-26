-- Safety controls for social, dating, and creator interactions.
-- Kept separate from migration 0024 so deployed databases can apply this incrementally.
CREATE TABLE IF NOT EXISTS social_user_blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(blocker_id, blocked_id),
  CHECK(blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_social_user_blocks_blocked ON social_user_blocks(blocked_id, blocker_id);

CREATE INDEX IF NOT EXISTS idx_safety_reports_reporter ON safety_reports(reporter_id, created_at DESC);
