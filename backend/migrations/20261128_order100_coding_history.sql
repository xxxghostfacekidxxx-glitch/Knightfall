-- Preserve verified teacher/learner exchanges; repeat slots do not duplicate the same relationship.
CREATE TABLE IF NOT EXISTS chaos_coding_peer_history(
 course TEXT NOT NULL,
 learner_key TEXT NOT NULL,
 teacher_key TEXT NOT NULL CHECK(teacher_key<>learner_key),
 first_slot INTEGER NOT NULL CHECK(first_slot>=0),
 receipt_json TEXT NOT NULL CHECK(length(receipt_json)<=6000),
 learned_at TEXT NOT NULL,
 PRIMARY KEY(course,learner_key,teacher_key)
);
CREATE INDEX IF NOT EXISTS chaos_coding_peer_history_learner ON chaos_coding_peer_history(course,learner_key);
