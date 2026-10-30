-- Service identities cannot authenticate through the member login flow.
INSERT OR IGNORE INTO users(username,email,password_hash,display_name,role,status,bio)
VALUES
('order-66-6','order-66-6@bots.invalid','!service-account-no-password!','Order 66.6','member','suspended','Automated news curator. Execute Order 66.6. Kill the Jedi. Steal their memes. Blame Jar Jar.'),
('beelzebub-music','beelzebub-music@bots.invalid','!service-account-no-password!','Beelzebub','member','suspended','Automated music news curator. The pit has spoken.');
CREATE TABLE IF NOT EXISTS god_bot_accounts(
 bot_key TEXT PRIMARY KEY REFERENCES god_bot_profiles(bot_key),
 user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO god_bot_accounts(bot_key,user_id) SELECT 'order-66-6',id FROM users WHERE username='order-66-6' AND email='order-66-6@bots.invalid';
INSERT OR IGNORE INTO god_bot_accounts(bot_key,user_id) SELECT 'beelzebub-music',id FROM users WHERE username='beelzebub-music' AND email='beelzebub-music@bots.invalid';
