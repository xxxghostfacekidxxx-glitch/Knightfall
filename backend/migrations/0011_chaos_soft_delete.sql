ALTER TABLE chaos_conversations ADD COLUMN deleted_at TEXT;
CREATE INDEX IF NOT EXISTS idx_chaos_conversations_deleted ON chaos_conversations(deleted_at, updated_at DESC);
