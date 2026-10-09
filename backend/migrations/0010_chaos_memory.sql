CREATE TABLE IF NOT EXISTS chaos_memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory TEXT NOT NULL CHECK(length(memory) BETWEEN 1 AND 500),
  category TEXT NOT NULL DEFAULT 'personal' CHECK(category IN ('personal','preference','project','other')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chaos_memories_user_updated
  ON chaos_memories(user_id, updated_at DESC);
