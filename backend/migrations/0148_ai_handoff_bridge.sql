-- AI-to-AI handoff: individually authorized, revocable, short-lived connections.
-- Only the SHA-256 digest is stored. The plaintext key is returned once to its owner.
CREATE TABLE IF NOT EXISTS ai_handoff_bridge_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK(length(token_hash)=64),
  label TEXT NOT NULL DEFAULT 'ChatGPT' CHECK(length(label) BETWEEN 1 AND 60),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS ai_handoff_bridge_keys_active
  ON ai_handoff_bridge_keys(user_id,revoked_at,expires_at);
