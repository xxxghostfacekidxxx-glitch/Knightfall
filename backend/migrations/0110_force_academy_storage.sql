CREATE TABLE IF NOT EXISTS force_academy_enrollments (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 path TEXT NOT NULL CHECK(path IN ('jedi','sith')),
 enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,path)
);
CREATE TABLE IF NOT EXISTS force_academy_progress (
 user_id INTEGER NOT NULL,
 path TEXT NOT NULL,
 lesson INTEGER NOT NULL CHECK(lesson BETWEEN 1 AND 7),
 completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,path,lesson),
 FOREIGN KEY(user_id,path) REFERENCES force_academy_enrollments(user_id,path) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS force_academy_journal (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 path TEXT NOT NULL,
 body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 12000),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id,path) REFERENCES force_academy_enrollments(user_id,path) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS force_academy_journal_owner ON force_academy_journal(user_id,path,id DESC);
