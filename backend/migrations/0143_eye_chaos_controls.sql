-- 0143: durable GOD master pause for all Eye of Chaos execution.
-- Defaults to off; active research and AI generation must fail closed when absent.
CREATE TABLE IF NOT EXISTS eye_chaos_controls (
 id INTEGER PRIMARY KEY CHECK(id=1),
 paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN (0,1)),
 updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO eye_chaos_controls(id,paused) VALUES(1,0);
