-- Web Push subscriptions and per-account notification preferences.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY,
  push_messages INTEGER NOT NULL DEFAULT 1 CHECK(push_messages IN (0,1)),
  push_community INTEGER NOT NULL DEFAULT 1 CHECK(push_community IN (0,1)),
  push_account INTEGER NOT NULL DEFAULT 1 CHECK(push_account IN (0,1)),
  quiet_start TEXT,
  quiet_end TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
