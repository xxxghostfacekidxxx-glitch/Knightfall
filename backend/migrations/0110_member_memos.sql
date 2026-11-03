-- Private owner-scoped Memo Pad, attached to Miss Chaos and member profile tools.
-- Messages are sent through the existing conversation API, never directly from this table.
CREATE TABLE IF NOT EXISTS member_memos (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL DEFAULT 'Untitled memo' CHECK(length(title) BETWEEN 1 AND 100),
 body TEXT NOT NULL DEFAULT '' CHECK(length(body) <= 4000),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_memos_owner_updated ON member_memos(user_id,updated_at DESC,id DESC);
