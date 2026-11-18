-- Private, two-person AI handoff. GOD owns it; a single explicitly invited and accepting member may collaborate.
CREATE TABLE IF NOT EXISTS ai_handoff_partner (
  slot INTEGER PRIMARY KEY CHECK (slot = 1),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  invited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at TEXT
);
CREATE TABLE IF NOT EXISTS ai_handoff_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 180),
  details TEXT NOT NULL DEFAULT '' CHECK(length(details)<=3000),
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS ai_handoff_tasks_active ON ai_handoff_tasks(deleted_at,status,updated_at DESC);
CREATE TABLE IF NOT EXISTS ai_handoff_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),
  category TEXT NOT NULL DEFAULT 'update' CHECK(category IN ('update','decision','blocker')),
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ai_handoff_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  task_id INTEGER,
  snapshot TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Project tasks last mentioned as unresolved; statuses are deliberately not marked completed.
INSERT INTO ai_handoff_tasks(title,details,status,priority)
VALUES
('Resolve arcade black screens','Audit Sudoku and other arcade games that load to a black screen; verify mobile and desktop launch.','todo','high'),
('Verify Knightfall cathedral theme','Check Gothic artwork and unified CSS across site pages and browsers.','todo','high'),
('Check Chaosphere messaging','Review mobile chat layout, older messages and push notification behavior.','todo','normal');
