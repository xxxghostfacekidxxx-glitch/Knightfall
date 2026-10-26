CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username_snapshot TEXT NOT NULL,
  email_snapshot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
  requested_at TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  completed_at TEXT,
  processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  operator_note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status_due ON account_deletion_requests(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user ON account_deletion_requests(user_id, requested_at DESC);
