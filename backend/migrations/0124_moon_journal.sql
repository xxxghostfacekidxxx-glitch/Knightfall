CREATE TABLE IF NOT EXISTS moon_journal (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  phase_index INTEGER NOT NULL CHECK (phase_index BETWEEN 0 AND 7),
  phase_at TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version TEXT NOT NULL,
  PRIMARY KEY (user_id, entry_date)
);
