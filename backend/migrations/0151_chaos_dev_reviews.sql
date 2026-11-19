-- Miss Chaos supervised developer review docket.
-- Only immutable full-file proposals; NO code execution, GitHub write, or deployment.
-- Apply through the separately approved D1 migration workflow, not Worker deployment.
CREATE TABLE IF NOT EXISTS chaos_dev_reviews (
  id TEXT PRIMARY KEY,
  author_id INTEGER NOT NULL,
  source_sha TEXT NOT NULL CHECK(length(source_sha)=40),
  path TEXT NOT NULL,
  original TEXT NOT NULL,
  candidate TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  syntax_status TEXT NOT NULL CHECK(syntax_status IN ('passed','not_supported')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision=1),
  reviewer_id INTEGER,
  review_note TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS chaos_dev_reviews_status_created ON chaos_dev_reviews(status,created_at DESC);
CREATE INDEX IF NOT EXISTS chaos_dev_reviews_author_created ON chaos_dev_reviews(author_id,created_at DESC);
CREATE TABLE IF NOT EXISTS chaos_dev_review_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id TEXT NOT NULL,
  actor_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('submitted','approved','rejected')),
  source_sha TEXT NOT NULL CHECK(length(source_sha)=40),
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(proposal_id) REFERENCES chaos_dev_reviews(id)
);
CREATE INDEX IF NOT EXISTS chaos_dev_review_events_by_proposal ON chaos_dev_review_events(proposal_id,id);
