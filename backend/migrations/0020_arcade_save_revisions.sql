-- Monotonic revisions allow clients to detect and reject stale concurrent saves.
ALTER TABLE arcade_saves ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);
