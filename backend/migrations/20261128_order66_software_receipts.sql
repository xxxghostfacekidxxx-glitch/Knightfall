CREATE TABLE IF NOT EXISTS chaos_knowledge_software_receipts (
 learner_key TEXT NOT NULL,
 tool_id TEXT NOT NULL REFERENCES chaos_knowledge_tools(tool_id) ON DELETE CASCADE,
 teacher_key TEXT NOT NULL,
 received_at TEXT NOT NULL,
 PRIMARY KEY(learner_key,tool_id)
);
CREATE INDEX IF NOT EXISTS idx_order66_software_receipts_tool ON chaos_knowledge_software_receipts(tool_id);
