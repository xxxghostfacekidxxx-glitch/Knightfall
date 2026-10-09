CREATE TABLE IF NOT EXISTS chaos_conversations (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  mood TEXT NOT NULL DEFAULT 'default',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chaos_conversations_user_updated
  ON chaos_conversations(user_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS chaos_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL REFERENCES chaos_conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user','assistant')),
  content TEXT NOT NULL CHECK(length(content) <= 8000),
  mood TEXT NOT NULL DEFAULT 'default',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chaos_messages_conversation
  ON chaos_messages(conversation_id, id);
CREATE INDEX IF NOT EXISTS idx_chaos_messages_user
  ON chaos_messages(user_id, id);
