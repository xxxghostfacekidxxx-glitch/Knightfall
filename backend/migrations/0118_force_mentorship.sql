CREATE TABLE IF NOT EXISTS force_academy_mentorship (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 learner_id INTEGER NOT NULL,
 mentor_id INTEGER NOT NULL,
 path TEXT NOT NULL CHECK(path IN ('jedi','sith')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','declined','ended')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(learner_id<>mentor_id),
 FOREIGN KEY(learner_id,path) REFERENCES force_academy_enrollments(user_id,path) ON DELETE CASCADE,
 FOREIGN KEY(mentor_id,path) REFERENCES force_academy_enrollments(user_id,path) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS force_mentorship_open ON force_academy_mentorship(learner_id,path) WHERE status IN ('pending','active');
CREATE INDEX IF NOT EXISTS force_mentorship_mentor ON force_academy_mentorship(mentor_id,path,status);