-- Reactions are scoped to a message and conversation and belong to a single account.
CREATE TABLE IF NOT EXISTS message_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('👍','❤️','😂','😮','😢','😡','🔥','🎉')),
  created_at TEXT NOT NULL,
  UNIQUE (message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_message_reactions_conversation_message
  ON message_reactions(conversation_id, message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message
  ON message_reactions(message_id);
