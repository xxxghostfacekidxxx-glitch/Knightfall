-- Expand administrator controls: settings and audit history.
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by INTEGER,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  details TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(actor_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

INSERT INTO site_settings (key,value,updated_by,updated_at) VALUES
  ('site_name','Knightfall',NULL,CURRENT_TIMESTAMP),
  ('maintenance_mode','false',NULL,CURRENT_TIMESTAMP),
  ('registration_enabled','true',NULL,CURRENT_TIMESTAMP),
  ('forum_enabled','true',NULL,CURRENT_TIMESTAMP),
  ('announcements_enabled','false',NULL,CURRENT_TIMESTAMP),
  ('announcement_title','',NULL,CURRENT_TIMESTAMP),
  ('announcement_body','',NULL,CURRENT_TIMESTAMP),
  ('feature_miss_chaos','true',NULL,CURRENT_TIMESTAMP),
  ('feature_profiles','true',NULL,CURRENT_TIMESTAMP)
ON CONFLICT(key) DO NOTHING;
