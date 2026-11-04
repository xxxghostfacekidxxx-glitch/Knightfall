CREATE TABLE IF NOT EXISTS arcade_turn_matches (
  id TEXT PRIMARY KEY,
  game_key TEXT NOT NULL CHECK (game_key IN ('connect-four')),
  player_one_id INTEGER NOT NULL,
  player_two_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','active','declined','cancelled','completed')),
  state_json TEXT NOT NULL,
  current_player_id INTEGER,
  turn_number INTEGER NOT NULL DEFAULT 0 CHECK (turn_number >= 0),
  winner_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_move_at TEXT,
  CHECK (player_one_id <> player_two_id),
  FOREIGN KEY (player_one_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (player_two_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (current_player_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_arcade_turn_matches_player_one
  ON arcade_turn_matches(player_one_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_arcade_turn_matches_player_two
  ON arcade_turn_matches(player_two_id,status,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_arcade_turn_matches_one_open_pair
  ON arcade_turn_matches(
    game_key,
    CASE WHEN player_one_id < player_two_id THEN player_one_id ELSE player_two_id END,
    CASE WHEN player_one_id < player_two_id THEN player_two_id ELSE player_one_id END
  ) WHERE status IN ('pending','active');

CREATE TABLE IF NOT EXISTS arcade_turn_moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id TEXT NOT NULL,
  turn_number INTEGER NOT NULL CHECK (turn_number > 0),
  player_id INTEGER NOT NULL,
  move_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(match_id,turn_number),
  FOREIGN KEY (match_id) REFERENCES arcade_turn_matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_arcade_turn_moves_match
  ON arcade_turn_moves(match_id,turn_number);
