-- Eye of Horus: append-only access ledger. Do not store message bodies,
-- credentials, or personal media in audit records.
CREATE TABLE IF NOT EXISTS eye_of_horus_access_log (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 god_user_id INTEGER NOT NULL REFERENCES users(id),
 action TEXT NOT NULL CHECK(action IN ('review','media_preview')),
 category TEXT NOT NULL CHECK(category IN ('direct_messages','miss_chaos','personal_bot_chats','profile_photos','message_attachments','bot_definitions')),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 16 AND 300),
 target_user_id INTEGER,
 object_id TEXT,
 result_count INTEGER NOT NULL DEFAULT 0 CHECK(result_count BETWEEN 0 AND 30),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_eye_of_horus_access_recent ON eye_of_horus_access_log(id DESC);
CREATE TRIGGER IF NOT EXISTS eye_of_horus_access_no_update
BEFORE UPDATE ON eye_of_horus_access_log
BEGIN SELECT RAISE(ABORT,'eye_audit_append_only'); END;
CREATE TRIGGER IF NOT EXISTS eye_of_horus_access_no_delete
BEFORE DELETE ON eye_of_horus_access_log
BEGIN SELECT RAISE(ABORT,'eye_audit_append_only'); END;
