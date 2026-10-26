-- Elgg-inspired social features plus separately gated adult creator and dating foundations.
-- No adult access is granted by default. A self-declared birth date or checkbox is NOT verification.
-- Payment entitlements must be issued only by a verified payment-provider webhook.
CREATE TABLE IF NOT EXISTS social_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('status','thread','reply','achievement','media','group_post','creator_post')),
  object_type TEXT,
  object_id TEXT,
  body TEXT NOT NULL DEFAULT '' CHECK(length(body) <= 5000),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','followers','friends','private','group')),
  group_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_social_activity_created ON social_activity(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_social_activity_user_created ON social_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_activity_group_created ON social_activity(group_id, created_at DESC);

CREATE TABLE IF NOT EXISTS social_groups (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 80),
  slug TEXT NOT NULL UNIQUE CHECK(length(slug) BETWEEN 2 AND 100),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 2000),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','private','invite')),
  join_policy TEXT NOT NULL DEFAULT 'open' CHECK(join_policy IN ('open','approval','invite')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived','removed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS social_group_members (
  group_id TEXT NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner','moderator','member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','banned')),
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(group_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_social_group_members_user ON social_group_members(user_id,status);

CREATE TABLE IF NOT EXISTS social_bookmarks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL CHECK(object_type IN ('thread','activity','group','creator_post')),
  object_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,object_type,object_id)
);

-- Adult verification is provider-backed. Keep only the provider reference/status, not ID scans.
CREATE TABLE IF NOT EXISTS adult_access_verifications (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unverified' CHECK(status IN ('unverified','pending','verified','expired','rejected','revoked')),
  provider TEXT,
  provider_reference TEXT,
  verified_at TEXT,
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_adult_verification_status ON adult_access_verifications(status,expires_at);

CREATE TABLE IF NOT EXISTS creator_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL CHECK(length(creator_name) BETWEEN 2 AND 80),
  bio TEXT NOT NULL DEFAULT '' CHECK(length(bio) <= 2000),
  is_adult_creator INTEGER NOT NULL DEFAULT 0 CHECK(is_adult_creator IN (0,1)),
  is_published INTEGER NOT NULL DEFAULT 0 CHECK(is_published IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creator_posts (
  id TEXT PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 3000),
  content_rating TEXT NOT NULL DEFAULT 'general' CHECK(content_rating IN ('general','mature','explicit')),
  visibility TEXT NOT NULL DEFAULT 'subscribers' CHECK(visibility IN ('public_preview','subscribers','paid_unlock')),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK(price_cents >= 0),
  media_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','removed')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_creator_posts_creator_status ON creator_posts(creator_id,status,published_at DESC);

CREATE TABLE IF NOT EXISTS creator_subscriptions (
  id TEXT PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscriber_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','past_due','cancelled','expired','refunded')),
  price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creator_id,subscriber_id),
  CHECK(creator_id <> subscriber_id)
);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_subscriber ON creator_subscriptions(subscriber_id,status);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_creator ON creator_subscriptions(creator_id,status);

CREATE TABLE IF NOT EXISTS creator_content_unlocks (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES creator_posts(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','refunded','chargeback')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id,buyer_id)
);

CREATE TABLE IF NOT EXISTS dating_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),
  bio TEXT NOT NULL DEFAULT '' CHECK(length(bio) <= 2000),
  age_range_min INTEGER NOT NULL DEFAULT 18 CHECK(age_range_min >= 18 AND age_range_min <= 120),
  age_range_max INTEGER NOT NULL DEFAULT 99 CHECK(age_range_max >= age_range_min AND age_range_max <= 120),
  city_label TEXT NOT NULL DEFAULT '' CHECK(length(city_label) <= 100),
  interests TEXT NOT NULL DEFAULT '[]',
  seeking TEXT NOT NULL DEFAULT '[]',
  visibility TEXT NOT NULL DEFAULT 'hidden' CHECK(visibility IN ('hidden','discoverable','paused')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dating_profiles_visibility ON dating_profiles(visibility,updated_at DESC);

CREATE TABLE IF NOT EXISTS dating_likes (
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(from_user_id,to_user_id),
  CHECK(from_user_id <> to_user_id)
);
CREATE TABLE IF NOT EXISTS dating_matches (
  user_low_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','unmatched','blocked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_low_id,user_high_id),
  CHECK(user_low_id < user_high_id)
);
CREATE INDEX IF NOT EXISTS idx_dating_matches_high ON dating_matches(user_high_id,status);

CREATE TABLE IF NOT EXISTS safety_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  object_type TEXT NOT NULL CHECK(object_type IN ('profile','activity','group','creator_post','dating_profile','message')),
  object_id TEXT,
  reason TEXT NOT NULL CHECK(length(reason) BETWEEN 3 AND 120),
  details TEXT NOT NULL DEFAULT '' CHECK(length(details) <= 3000),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved','dismissed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON safety_reports(status,created_at);
