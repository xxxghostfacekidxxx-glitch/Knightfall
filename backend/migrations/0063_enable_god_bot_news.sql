-- Permit God-controlled scheduled news posting while retaining the default-off setting.
PRAGMA foreign_keys=OFF;
CREATE TABLE god_bot_profiles_v2 (
 bot_key TEXT PRIMARY KEY,
 display_name TEXT NOT NULL,
 bio TEXT NOT NULL DEFAULT '',
 source_name TEXT NOT NULL,
 source_url TEXT NOT NULL,
 cadence TEXT NOT NULL DEFAULT 'manual' CHECK(cadence IN ('manual','daily','twice-daily')),
 posting_enabled INTEGER NOT NULL DEFAULT 0 CHECK(posting_enabled IN (0,1)),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO god_bot_profiles_v2 SELECT * FROM god_bot_profiles;
DROP TABLE god_bot_profiles;
ALTER TABLE god_bot_profiles_v2 RENAME TO god_bot_profiles;
PRAGMA foreign_keys=ON;
