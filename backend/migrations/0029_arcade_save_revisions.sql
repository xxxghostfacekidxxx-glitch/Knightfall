-- Monotonic revisions allow clients to detect and reject stale concurrent saves.
-- Numbered 0029 because 0025-0028 are already used by production migrations.
ALTER TABLE arcade_saves ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);
