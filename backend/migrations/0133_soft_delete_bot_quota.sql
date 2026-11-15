-- Exclude soft-deleted bots from owner quota before a new bot is created.
DROP TRIGGER IF EXISTS personal_bots_owner_limit;
CREATE TRIGGER personal_bots_owner_limit
BEFORE INSERT ON personal_bots
WHEN (SELECT COUNT(*) FROM personal_bots WHERE owner_id=NEW.owner_id AND deleted_at IS NULL) >=
  (COALESCE((SELECT CASE
      WHEN u.role IN ('god','admin','moderator')
        OR EXISTS (SELECT 1 FROM member_bot_creator_privileges p
                   WHERE p.user_id=u.id AND (p.title='Digital Creator' OR p.unlimited_slots=1))
        THEN 2147483647
      WHEN EXISTS (SELECT 1 FROM member_premium_memberships m
                   WHERE m.user_id=u.id AND m.status='active'
                     AND (m.expires_at IS NULL OR datetime(m.expires_at)>CURRENT_TIMESTAMP))
        THEN 10
      ELSE 5 END FROM users u WHERE u.id=NEW.owner_id),0)
   + COALESCE((SELECT extra_bot_slots FROM member_shop_entitlements
               WHERE user_id=NEW.owner_id),0))
BEGIN
  SELECT RAISE(ABORT,'personal_bot_limit_reached');
END;
