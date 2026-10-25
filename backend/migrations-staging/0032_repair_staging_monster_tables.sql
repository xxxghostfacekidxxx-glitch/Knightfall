-- Repair staging-only schema drift: the staging migration ledger recorded 0030/0031,
-- but the two tables were absent. Idempotent so it is safe to rerun.
CREATE TABLE IF NOT EXISTS monster_game_saves (
  user_id INTEGER PRIMARY KEY,
  save_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_monster_game_saves_updated ON monster_game_saves(updated_at);

CREATE TABLE IF NOT EXISTS monster_game_battles (
  user_id INTEGER PRIMARY KEY,
  battle_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
