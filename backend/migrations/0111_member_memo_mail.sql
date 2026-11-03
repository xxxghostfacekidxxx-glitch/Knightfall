-- Separate memo inbox from live member messaging.
-- Each delivered memo is a private snapshot. Deleting only hides it from its respective owner.
CREATE TABLE IF NOT EXISTS member_memo_mail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK(length(subject) BETWEEN 1 AND 100),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL,
  read_at TEXT,
  sender_archived_at TEXT,
  recipient_archived_at TEXT,
  CHECK(sender_id<>recipient_id)
);
CREATE INDEX IF NOT EXISTS idx_memo_mail_inbox ON member_memo_mail(recipient_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_memo_mail_sent ON member_memo_mail(sender_id,created_at DESC,id DESC);
