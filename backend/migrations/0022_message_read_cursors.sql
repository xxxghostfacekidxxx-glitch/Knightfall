-- Message-ID read cursors avoid timestamp collisions in unread counts and seen receipts.
ALTER TABLE conversation_members ADD COLUMN last_read_message_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_cursor
  ON messages(conversation_id, id);
