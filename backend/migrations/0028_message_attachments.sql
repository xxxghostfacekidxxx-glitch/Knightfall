CREATE TABLE IF NOT EXISTS message_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_message_attachments_conversation_message ON message_attachments(conversation_id, message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_uploader_pending ON message_attachments(uploader_id, message_id, created_at);
