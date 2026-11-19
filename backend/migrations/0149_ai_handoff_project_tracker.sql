-- Expand the authenticated two-person task register into a verifiable project tracker.
-- Additive changes only: current task IDs, edits, notes, versions and collaborator access remain intact.
ALTER TABLE ai_handoff_tasks ADD COLUMN area TEXT NOT NULL DEFAULT 'General';
ALTER TABLE ai_handoff_tasks ADD COLUMN verification TEXT NOT NULL DEFAULT 'needs_review';
ALTER TABLE ai_handoff_tasks ADD COLUMN source_url TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_handoff_tasks ADD COLUMN next_step TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_handoff_tasks ADD COLUMN blocker TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS ai_handoff_tasks_area_status ON ai_handoff_tasks(deleted_at,area,status,priority);
