ALTER TABLE force_academy_exams ADD COLUMN stage INTEGER NOT NULL DEFAULT 1 CHECK(stage BETWEEN 1 AND 4);
DROP INDEX IF EXISTS force_exam_pending;
CREATE UNIQUE INDEX IF NOT EXISTS force_exam_pending_stage ON force_academy_exams(user_id,path,stage) WHERE status='pending';
CREATE UNIQUE INDEX IF NOT EXISTS force_exam_passed_stage ON force_academy_exams(user_id,path,stage) WHERE status='passed';