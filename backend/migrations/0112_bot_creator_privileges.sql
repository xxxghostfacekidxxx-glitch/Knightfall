-- Per-account bot creator privileges do not grant moderation or admin permissions.
CREATE TABLE IF NOT EXISTS member_bot_creator_privileges (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Bot Creator',
  unlimited_slots INTEGER NOT NULL DEFAULT 0 CHECK(unlimited_slots IN (0,1)),
  advanced_builder INTEGER NOT NULL DEFAULT 0 CHECK(advanced_builder IN (0,1)),
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO member_bot_creator_privileges (user_id,title,unlimited_slots,advanced_builder)
SELECT id,'Bot Creator',1,1 FROM users WHERE lower(username)='mrsshroom14';

DROP TRIGGER IF EXISTS personal_bots_owner_limit;
CREATE TRIGGER personal_bots_owner_limit
BEFORE INSERT ON personal_bots
WHEN NOT EXISTS (
  SELECT 1 FROM member_bot_creator_privileges p
  WHERE p.user_id=NEW.owner_id AND p.unlimited_slots=1
) AND (SELECT COUNT(*) FROM personal_bots WHERE owner_id=NEW.owner_id) >=
  (COALESCE((SELECT CASE role WHEN 'god' THEN 10 WHEN 'admin' THEN 10 WHEN 'moderator' THEN 5 ELSE 2 END FROM users WHERE id=NEW.owner_id),0)
   + COALESCE((SELECT extra_bot_slots FROM member_shop_entitlements WHERE user_id=NEW.owner_id),0))
BEGIN
  SELECT RAISE(ABORT,'personal_bot_limit_reached');
END;
