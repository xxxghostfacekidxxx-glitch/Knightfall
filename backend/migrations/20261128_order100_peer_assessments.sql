-- One bounded, latest advisory assessment per specialist, separate from human approval.
CREATE TABLE IF NOT EXISTS chaos_knowledge_peer_assessments(
 agent_key TEXT PRIMARY KEY,
 slot INTEGER NOT NULL CHECK(slot>=0),
 peer_key TEXT NOT NULL CHECK(peer_key<>agent_key),
 assessment_json TEXT NOT NULL CHECK(length(assessment_json)<=16000),
 updated_at TEXT NOT NULL
);
