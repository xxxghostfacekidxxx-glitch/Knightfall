-- Paid theme ownership is granted only by verified server-side fulfillment.
-- Do not accept client-side grants or treat theme preview as ownership.
CREATE TABLE IF NOT EXISTS member_theme_entitlements (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL CHECK (sku LIKE 'theme.%'),
  source TEXT NOT NULL CHECK (source IN ('stripe','staff_grant','migration')),
  source_reference TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  PRIMARY KEY (user_id,sku)
);
CREATE INDEX IF NOT EXISTS idx_member_theme_entitlements_active ON member_theme_entitlements(user_id,revoked_at);
