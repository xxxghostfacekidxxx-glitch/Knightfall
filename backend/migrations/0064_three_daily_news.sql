-- Rebuild cadence constraint while preserving bot service-account foreign keys via a new column.
ALTER TABLE god_bot_profiles ADD COLUMN news_frequency TEXT NOT NULL DEFAULT 'daily' CHECK(news_frequency IN ('daily','twice-daily','three-daily'));
UPDATE god_bot_profiles SET news_frequency=CASE WHEN cadence='twice-daily' THEN 'twice-daily' ELSE 'daily' END;
