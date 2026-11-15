-- Soft-delete phase 2: journals, official posts, creator drafts, and private folders.
ALTER TABLE die_ary_entries ADD COLUMN deleted_at TEXT;
ALTER TABLE site_activity_posts ADD COLUMN deleted_at TEXT;
ALTER TABLE creator_posts ADD COLUMN deleted_at TEXT;
ALTER TABLE vault_folders ADD COLUMN deleted_at TEXT;
CREATE INDEX IF NOT EXISTS idx_die_ary_active ON die_ary_entries(user_id,deleted_at);
CREATE INDEX IF NOT EXISTS idx_home_activity_active ON site_activity_posts(deleted_at,id DESC);
CREATE INDEX IF NOT EXISTS idx_creator_posts_active ON creator_posts(creator_id,deleted_at);
CREATE INDEX IF NOT EXISTS idx_vault_folder_active ON vault_folders(deleted_at);
