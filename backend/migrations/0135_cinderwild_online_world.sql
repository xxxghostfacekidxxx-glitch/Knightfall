-- Cinderwild online-world beta: server-owned coordinates and verified quest visits.
-- Does not grant creatures, money, badges, or other competitive inventory.
-- Deliberately additive; no existing arcade or member data is modified.
CREATE TABLE IF NOT EXISTS cinderwild_world_players (
  user_id INTEGER NOT NULL PRIMARY KEY,
  x INTEGER NOT NULL DEFAULT 8 CHECK(x BETWEEN 1 AND 62),
  y INTEGER NOT NULL DEFAULT 18 CHECK(y BETWEEN 1 AND 36),
  steps INTEGER NOT NULL DEFAULT 0 CHECK(steps BETWEEN 0 AND 10000000),
  facing TEXT NOT NULL DEFAULT 'down' CHECK(facing IN ('up','down','left','right')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  last_move_ms INTEGER NOT NULL DEFAULT 0,
  last_seen_ms INTEGER NOT NULL DEFAULT 0,
  online INTEGER NOT NULL DEFAULT 0 CHECK(online IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cinderwild_world_presence
ON cinderwild_world_players (online,last_seen_ms,x,y);
CREATE TABLE IF NOT EXISTS cinderwild_world_quests (
  user_id INTEGER NOT NULL,
  quest_id TEXT NOT NULL CHECK(length(quest_id) BETWEEN 1 AND 40),
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id,quest_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cinderwild_quests_member
ON cinderwild_world_quests(user_id,completed_at);
