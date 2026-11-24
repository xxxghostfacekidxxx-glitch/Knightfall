CREATE TABLE IF NOT EXISTS spiritual_academy_enrollments (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 path TEXT NOT NULL CHECK(path IN ('jedi','sith')),
 enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,path)
);
CREATE TABLE IF NOT EXISTS spiritual_academy_progress (
 user_id INTEGER NOT NULL,
 path TEXT NOT NULL,
 lesson_slug TEXT NOT NULL REFERENCES threads(slug),
 completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,path,lesson_slug),
 FOREIGN KEY(user_id,path) REFERENCES spiritual_academy_enrollments(user_id,path) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS spiritual_academy_journals (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 path TEXT NOT NULL,
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 12000),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id,path) REFERENCES spiritual_academy_enrollments(user_id,path) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS spiritual_journal_owner ON spiritual_academy_journals(user_id,path,created_at);
CREATE TABLE IF NOT EXISTS spiritual_academy_lessons (
 path TEXT NOT NULL CHECK(path IN ('jedi','sith')),
 lesson_slug TEXT NOT NULL REFERENCES threads(slug),
 position INTEGER NOT NULL CHECK(position>0),
 PRIMARY KEY(path,lesson_slug),
 UNIQUE(path,position)
);
INSERT OR IGNORE INTO spiritual_academy_lessons(path,lesson_slug,position) SELECT 'jedi',slug,CASE slug WHEN 'jedi-testament-awareness' THEN 1 WHEN 'jedi-testament-knowledge' THEN 2 WHEN 'jedi-testament-compassion' THEN 3 WHEN 'jedi-testament-discipline' THEN 4 WHEN 'jedi-testament-service' THEN 5 WHEN 'jedi-testament-impermanence' THEN 6 WHEN 'jedi-testament-accountability' THEN 7 END FROM threads WHERE slug IN ('jedi-testament-awareness','jedi-testament-knowledge','jedi-testament-compassion','jedi-testament-discipline','jedi-testament-service','jedi-testament-impermanence','jedi-testament-accountability');
INSERT OR IGNORE INTO spiritual_academy_lessons(path,lesson_slug,position) SELECT 'sith',slug,CASE slug WHEN 'sith-flame-passion' THEN 1 WHEN 'sith-flame-strength' THEN 2 WHEN 'sith-flame-power' THEN 3 WHEN 'sith-flame-victory' THEN 4 WHEN 'sith-flame-liberation' THEN 5 WHEN 'sith-flame-shadow' THEN 6 WHEN 'sith-flame-responsibility' THEN 7 END FROM threads WHERE slug IN ('sith-flame-passion','sith-flame-strength','sith-flame-power','sith-flame-victory','sith-flame-liberation','sith-flame-shadow','sith-flame-responsibility');