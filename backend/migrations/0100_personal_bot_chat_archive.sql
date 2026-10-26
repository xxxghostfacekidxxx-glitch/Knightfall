-- Retained personal bot chat messages, scoped to signed-in users.
CREATE TABLE IF NOT EXISTS personal_bot_chat_messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 bot_id TEXT NOT NULL,
 user_id INTEGER NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('user','assistant')),
 content TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_personal_bot_chat_user ON personal_bot_chat_messages(user_id,bot_id,id DESC);
CREATE INDEX IF NOT EXISTS idx_personal_bot_chat_admin ON personal_bot_chat_messages(id DESC);
