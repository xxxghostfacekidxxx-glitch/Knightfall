-- Bounded latest executed coding practice per specialist and curriculum version.
CREATE TABLE IF NOT EXISTS chaos_coding_practice(
 agent_key TEXT NOT NULL,
 course TEXT NOT NULL,
 slot INTEGER NOT NULL CHECK(slot>=0),
 teacher_key TEXT NOT NULL CHECK(teacher_key<>agent_key),
 verified INTEGER NOT NULL CHECK(verified IN (0,1)),
 receipt_json TEXT NOT NULL CHECK(length(receipt_json)<=6000),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(agent_key,course)
);
