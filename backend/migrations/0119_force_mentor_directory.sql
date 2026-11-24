CREATE TABLE IF NOT EXISTS force_mentor_directory (
 user_id INTEGER NOT NULL,
 path TEXT NOT NULL CHECK(path IN ('jedi','sith')),
 listed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,path),
 FOREIGN KEY(user_id,path) REFERENCES force_academy_enrollments(user_id,path) ON DELETE CASCADE
);