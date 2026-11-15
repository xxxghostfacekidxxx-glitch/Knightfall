-- Official homepage updates, creator title consolidation, and server-owned bot tier limits.
-- Premium membership is granted by trusted billing/admin processes only, never by client input.
CREATE TABLE IF NOT EXISTS member_premium_memberships (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK(status IN ('active','inactive')),
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_activity_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 120),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),
  category TEXT NOT NULL DEFAULT 'update' CHECK(category IN ('update','announcement','event')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_activity_posts_latest ON site_activity_posts(id DESC);
UPDATE member_bot_creator_privileges
SET title='Digital Creator', unlimited_slots=1, advanced_builder=1
WHERE title='Bot Creator';
UPDATE member_bot_creator_privileges
SET unlimited_slots=1, advanced_builder=1
WHERE title='Digital Creator';
DROP TRIGGER IF EXISTS personal_bots_owner_limit;
CREATE TRIGGER personal_bots_owner_limit
BEFORE INSERT ON personal_bots
WHEN (SELECT COUNT(*) FROM personal_bots WHERE owner_id=NEW.owner_id) >=
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
DROP TRIGGER IF EXISTS site_activity_posts_staff_guard;
CREATE TRIGGER site_activity_posts_staff_guard
BEFORE INSERT ON site_activity_posts
WHEN NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id=NEW.user_id AND u.status='active'
    AND (u.role IN ('god','admin','moderator') OR EXISTS (
      SELECT 1 FROM member_bot_creator_privileges p
      WHERE p.user_id=u.id AND p.title='Digital Creator'))
)
BEGIN
  SELECT RAISE(ABORT,'staff_only');
END;
