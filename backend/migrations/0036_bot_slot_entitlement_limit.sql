-- Honor verified purchased bot slots at the database boundary.
-- Requires migration 0035_member_shop_foundation.sql.
DROP TRIGGER IF EXISTS personal_bots_owner_limit;
CREATE TRIGGER personal_bots_owner_limit
BEFORE INSERT ON personal_bots
WHEN (SELECT COUNT(*) FROM personal_bots WHERE owner_id=NEW.owner_id) >=
  (COALESCE((SELECT CASE role WHEN 'god' THEN 10 WHEN 'admin' THEN 10 WHEN 'moderator' THEN 5 ELSE 2 END FROM users WHERE id=NEW.owner_id),0)
   + COALESCE((SELECT extra_bot_slots FROM member_shop_entitlements WHERE user_id=NEW.owner_id),0))
BEGIN
  SELECT RAISE(ABORT,'personal_bot_limit_reached');
END;
