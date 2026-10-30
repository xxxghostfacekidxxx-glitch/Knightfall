-- Additive migration: keep the existing bot profile primary key and service-account foreign keys intact.
ALTER TABLE god_bot_profiles ADD COLUMN auto_post_enabled INTEGER NOT NULL DEFAULT 0 CHECK(auto_post_enabled IN (0,1));
