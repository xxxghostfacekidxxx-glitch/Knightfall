-- Game-wide chat. Apply to the staging D1 database before deploying chat routes.
CREATE TABLE IF NOT EXISTS monster_game_global_chat (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 500),
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_monster_global_chat_latest ON monster_game_global_chat(id DESC);
