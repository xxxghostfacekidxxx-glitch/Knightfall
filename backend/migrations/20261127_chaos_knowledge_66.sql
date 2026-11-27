-- Dedicated 66-identity collector; leave retired shared-fleet control disabled.
CREATE TABLE IF NOT EXISTS chaos_knowledge_66_control(id INTEGER PRIMARY KEY CHECK(id=1), enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)));
INSERT OR IGNORE INTO chaos_knowledge_66_control(id,enabled) VALUES(1,0);
CREATE TABLE IF NOT EXISTS chaos_knowledge_tools(
tool_id TEXT PRIMARY KEY, source TEXT NOT NULL CHECK(source IN ('github','gitlab','npm')), title TEXT NOT NULL, source_url TEXT NOT NULL, declared_license TEXT NOT NULL, version_hint TEXT NOT NULL, agent_key TEXT NOT NULL, division TEXT NOT NULL, query TEXT NOT NULL, retrieved_at TEXT NOT NULL,
review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')), reviewed_by TEXT, reviewed_at TEXT);
CREATE INDEX IF NOT EXISTS chaos_knowledge_tools_review_idx ON chaos_knowledge_tools(review_status,retrieved_at);
CREATE TABLE IF NOT EXISTS chaos_knowledge_lessons(
learner_key TEXT NOT NULL, entity_id TEXT NOT NULL REFERENCES chaos_knowledge_candidates(entity_id), teacher_key TEXT NOT NULL, received_at TEXT NOT NULL, PRIMARY KEY(learner_key,entity_id));
