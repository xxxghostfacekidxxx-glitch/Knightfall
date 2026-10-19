-- Persistent arcade leaderboards and per-account game save slots.
CREATE TABLE IF NOT EXISTS arcade_high_scores (
  user_id INTEGER NOT NULL,
  game_key TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
  achieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_arcade_scores_leaderboard
  ON arcade_high_scores(game_key, best_score DESC, achieved_at ASC);
CREATE TABLE IF NOT EXISTS arcade_saves (
  user_id INTEGER NOT NULL,
  game_key TEXT NOT NULL,
  save_key TEXT NOT NULL DEFAULT 'autosave',
  schema_version INTEGER NOT NULL DEFAULT 1,
  save_data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_key, save_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_arcade_saves_user_updated
  ON arcade_saves(user_id, updated_at DESC);
