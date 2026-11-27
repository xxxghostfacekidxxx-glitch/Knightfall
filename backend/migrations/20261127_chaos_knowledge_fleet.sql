-- Additive independent research archive. Candidates are not trusted instructions.
CREATE TABLE IF NOT EXISTS chaos_knowledge_control(id INTEGER PRIMARY KEY CHECK(id=1), enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)));
INSERT OR IGNORE INTO chaos_knowledge_control(id,enabled) VALUES(1,1);
CREATE TABLE IF NOT EXISTS chaos_knowledge_runs(
 hour INTEGER NOT NULL, agent_key TEXT NOT NULL, division TEXT NOT NULL, query TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('running','complete','failed','paused')), found INTEGER NOT NULL DEFAULT 0,
 started_at TEXT NOT NULL, finished_at TEXT, PRIMARY KEY(hour,agent_key)
);
CREATE TABLE IF NOT EXISTS chaos_knowledge_candidates(
 entity_id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, source_url TEXT NOT NULL,
 license TEXT NOT NULL CHECK(license='CC0-1.0'), agent_key TEXT NOT NULL, division TEXT NOT NULL, query TEXT NOT NULL,
 retrieved_at TEXT NOT NULL, review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
 reviewed_by TEXT, reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS chaos_knowledge_review_idx ON chaos_knowledge_candidates(review_status,retrieved_at);
