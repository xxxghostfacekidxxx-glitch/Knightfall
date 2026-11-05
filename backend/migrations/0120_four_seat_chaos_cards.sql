-- 0120: fixed four-seat Cards Against Chaos tables.
-- Independent of the earlier two-human/five-seat table (0118); no data dropped.
-- At most four distinct human invitations including the host; empty seats are AI.
CREATE TABLE IF NOT EXISTS arcade_chaos_four_matches (
 id TEXT PRIMARY KEY,
 player_one_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 player_two_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 player_three_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 player_four_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL CHECK(status IN ('lobby','active','completed','cancelled')),
 state_json TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 0 CHECK(version>=0),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 CHECK(player_two_id IS NULL OR player_two_id<>player_one_id),
 CHECK(player_three_id IS NULL OR (player_three_id<>player_one_id AND (player_two_id IS NULL OR player_three_id<>player_two_id))),
 CHECK(player_four_id IS NULL OR (player_four_id<>player_one_id AND (player_two_id IS NULL OR player_four_id<>player_two_id) AND (player_three_id IS NULL OR player_four_id<>player_three_id)))
);
CREATE INDEX IF NOT EXISTS idx_chaos_four_first ON arcade_chaos_four_matches(player_one_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chaos_four_second ON arcade_chaos_four_matches(player_two_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chaos_four_third ON arcade_chaos_four_matches(player_three_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chaos_four_fourth ON arcade_chaos_four_matches(player_four_id,status,updated_at DESC);
