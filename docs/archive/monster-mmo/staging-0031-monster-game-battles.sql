-- ARCHIVE ONLY. DO NOT RUN AGAINST PRODUCTION. Historical isolated monster MMO staging migration.
CREATE TABLE IF NOT EXISTS monster_game_battles (
  user_id INTEGER PRIMARY KEY,
  battle_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
