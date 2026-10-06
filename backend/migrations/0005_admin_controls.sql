-- Add account status for administrator controls.
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
