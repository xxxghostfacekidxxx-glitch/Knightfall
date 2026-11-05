-- 0118: Separate server-authoritative party-card tables, without changing
-- the existing Connect Four migration's CHECK constraint or saved games.
CREATE TABLE IF NOT EXISTS arcade_chaos_card_matches(
  id TEXT PRIMARY KEY,
  player_one_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_two_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','active','completed','declined','cancelled')),
  state_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0 CHECK(version>=0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK(player_one_id<>player_two_id)
);
CREATE INDEX IF NOT EXISTS idx_chaos_card_matches_first ON arcade_chaos_card_matches(player_one_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chaos_card_matches_second ON arcade_chaos_card_matches(player_two_id,status,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chaos_card_one_open_pair ON arcade_chaos_card_matches(
 CASE WHEN player_one_id<player_two_id THEN player_one_id ELSE player_two_id END,
 CASE WHEN player_one_id<player_two_id THEN player_two_id ELSE player_one_id END
) WHERE status IN ('pending','active');
