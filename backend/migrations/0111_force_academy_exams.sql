CREATE TABLE IF NOT EXISTS force_academy_exams (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 path TEXT NOT NULL,
 answers TEXT NOT NULL CHECK(length(answers) BETWEEN 2 AND 20000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','passed','revision')),
 score INTEGER CHECK(score BETWEEN 0 AND 20),
 reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 feedback TEXT NOT NULL DEFAULT '',
 submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_at TEXT,
 FOREIGN KEY(user_id,path) REFERENCES force_academy_enrollments(user_id,path) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS force_exam_pending ON force_academy_exams(user_id,path) WHERE status='pending';
CREATE INDEX IF NOT EXISTS force_exam_owner ON force_academy_exams(user_id,path,id DESC);
