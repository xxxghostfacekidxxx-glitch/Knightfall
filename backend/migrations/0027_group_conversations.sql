-- Group conversations retain the same membership-scoped message model as direct chats.
ALTER TABLE conversations ADD COLUMN name TEXT;
ALTER TABLE conversations ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_kind_updated ON conversations(kind, updated_at);
