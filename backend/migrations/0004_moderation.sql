ALTER TABLE threads ADD COLUMN deleted_at TEXT;
ALTER TABLE posts ADD COLUMN deleted_at TEXT;
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  thread_id INTEGER,
  post_id INTEGER,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  moderator_id INTEGER,
  moderator_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  FOREIGN KEY(reporter_id) REFERENCES users(id),
  FOREIGN KEY(thread_id) REFERENCES threads(id),
  FOREIGN KEY(post_id) REFERENCES posts(id),
  FOREIGN KEY(moderator_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_thread ON reports(thread_id);
CREATE INDEX IF NOT EXISTS idx_reports_post ON reports(post_id);
