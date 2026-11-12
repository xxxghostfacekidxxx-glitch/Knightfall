-- 0128: Install the previously un-applied deletion request table on production D1.
-- Preserve its request-only semantics; this migration does not erase user data.
-- Add a DB-enforced invariant: only one pending/in-progress request per account.
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_deletion_requests_one_active_user
  ON account_deletion_requests(user_id)
  WHERE status IN ('pending','in_progress') AND user_id IS NOT NULL;
