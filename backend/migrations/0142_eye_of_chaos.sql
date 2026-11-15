-- 0142: GOD-only Eye of Chaos command center. No autonomous publication.
-- Keep existing arcade CI bots and forum service identities unchanged.
CREATE TABLE IF NOT EXISTS eye_chaos_missions (
 id TEXT PRIMARY KEY,
 created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 agent_key TEXT NOT NULL,
 division TEXT NOT NULL CHECK(division IN ('agents','arcade','forums')),
 kind TEXT NOT NULL CHECK(kind IN ('research','draft','discussion','qa','cross')),
 instructions TEXT NOT NULL CHECK(length(instructions) BETWEEN 8 AND 3000),
 source_key TEXT NOT NULL DEFAULT '',
 destination TEXT NOT NULL DEFAULT '',
 cadence TEXT NOT NULL DEFAULT 'manual' CHECK(cadence IN ('manual','daily','weekly')),
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','paused','in_progress','ready','completed','cancelled','failed')),
 next_run_at TEXT,
 last_run_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_eye_chaos_missions_status ON eye_chaos_missions(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eye_chaos_missions_due ON eye_chaos_missions(cadence,status,next_run_at);
CREATE TABLE IF NOT EXISTS eye_chaos_drafts (
 id TEXT PRIMARY KEY,
 mission_id TEXT REFERENCES eye_chaos_missions(id) ON DELETE SET NULL,
 author_key TEXT NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 160),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 10000),
 source_url TEXT NOT NULL DEFAULT '',
 destination TEXT NOT NULL DEFAULT '',
 version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','published')),
 approved_version INTEGER,
 approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 approved_at TEXT,
 published_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(status NOT IN ('approved','published') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND approved_version=version))
);
CREATE INDEX IF NOT EXISTS idx_eye_chaos_drafts_review ON eye_chaos_drafts(status,created_at DESC);
CREATE TABLE IF NOT EXISTS eye_chaos_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 object_type TEXT NOT NULL CHECK(object_type IN ('mission','draft','system')),
 object_id TEXT NOT NULL,
 action TEXT NOT NULL,
 occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_eye_chaos_events_latest ON eye_chaos_events(id DESC);
