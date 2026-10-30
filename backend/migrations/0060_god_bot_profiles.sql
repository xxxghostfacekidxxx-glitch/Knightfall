-- God-only editable bot profile configurations. No user accounts or posting automation created here.
CREATE TABLE IF NOT EXISTS god_bot_profiles (
 bot_key TEXT PRIMARY KEY,
 display_name TEXT NOT NULL,
 bio TEXT NOT NULL DEFAULT '',
 source_name TEXT NOT NULL,
 source_url TEXT NOT NULL,
 cadence TEXT NOT NULL DEFAULT 'manual' CHECK(cadence IN ('manual','daily','twice-daily')),
 posting_enabled INTEGER NOT NULL DEFAULT 0 CHECK(posting_enabled=0),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO god_bot_profiles(bot_key,display_name,bio,source_name,source_url) VALUES
('order-66-6','Order 66.6','Execute Order 66.6. Kill the Jedi. Steal their memes. Blame Jar Jar.\nThe Jedi Council denied me the rank of Master, so I became a Reddit moderator.\n99.9% Sith propaganda. 0.1% death stick residue.\nPalpatine''s burner account. Don''t tell the Senate.\nFunded by the Empire. Fact-checked by a drunk Jawa.','Star Wars News Net','https://www.starwarsnewsnet.com/'),
('beelzebub-music','Beelzebub','The pit has spoken. Your playlist has been judged.\nMusic news, riffs, breakdowns, and unsolicited opinions from the underworld.','Billboard','https://www.billboard.com/');
