-- Monotonic revisions allow clients to detect and reject stale concurrent saves.
-- Numbered 0025 because 0020-0024 are already used by production migrations.
ALTER TABLE arcade_saves ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);
