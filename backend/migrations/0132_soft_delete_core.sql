-- Knightfall soft-delete phase 1. A user deletion hides retained content;
-- hard purge is routed exclusively through the authenticated God console.
ALTER TABLE personal_bots ADD COLUMN deleted_at TEXT;
ALTER TABLE personal_bot_chat_messages ADD COLUMN deleted_at TEXT;
ALTER TABLE profile_photos ADD COLUMN deleted_at TEXT;
ALTER TABLE vault_items ADD COLUMN deleted_at TEXT;
ALTER TABLE chaos_memories ADD COLUMN deleted_at TEXT;
ALTER TABLE member_memos ADD COLUMN deleted_at TEXT;
ALTER TABLE member_memo_mail ADD COLUMN deleted_at TEXT;
ALTER TABLE moon_journal ADD COLUMN deleted_at TEXT;
ALTER TABLE shadow_journal ADD COLUMN deleted_at TEXT;
ALTER TABLE media_albums ADD COLUMN deleted_at TEXT;
ALTER TABLE shop_products ADD COLUMN deleted_at TEXT;
CREATE INDEX IF NOT EXISTS idx_personal_bots_active ON personal_bots(owner_id,deleted_at);
CREATE INDEX IF NOT EXISTS idx_profile_photos_active ON profile_photos(user_id,deleted_at);
CREATE INDEX IF NOT EXISTS idx_bot_chat_active ON personal_bot_chat_messages(user_id,bot_id,deleted_at);
CREATE INDEX IF NOT EXISTS idx_vault_items_deleted ON vault_items(deleted_at);
-- The God console no longer keeps a secondary private-reading audit trail.
DROP TABLE IF EXISTS eye_of_horus_access_log;
