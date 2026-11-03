-- Member-managed public profile Link Hub. Links inherit the full profile visibility policy.
-- Position is owner-scoped and replaced atomically by the API on explicit save.
CREATE TABLE IF NOT EXISTS member_profile_links (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 7),
  label TEXT NOT NULL CHECK(length(label) BETWEEN 1 AND 50),
  url TEXT NOT NULL CHECK(length(url) BETWEEN 1 AND 500),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id,position)
);
CREATE INDEX IF NOT EXISTS idx_member_profile_links_owner_position ON member_profile_links(user_id,position);
