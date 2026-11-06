-- 0122: user-owned, account-synced Deck Locker.
-- Client events are cosmetic activity claims (not verified game completion).
-- Premium entitlements are exclusively granted by trusted server-side order fulfillment.
CREATE TABLE IF NOT EXISTS arcade_deck_profiles (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 equipped_skin TEXT NOT NULL DEFAULT 'ash-classic',
 earned_deals INTEGER NOT NULL DEFAULT 0 CHECK(earned_deals BETWEEN 0 AND 100000),
 local_imported INTEGER NOT NULL DEFAULT 0 CHECK(local_imported IN (0,1)),
 last_deal_at TEXT,
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS arcade_deck_events (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_id TEXT NOT NULL,
 game_key TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,event_id)
);
CREATE INDEX IF NOT EXISTS idx_arcade_deck_events_history ON arcade_deck_events(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS arcade_deck_entitlements (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 skin_id TEXT NOT NULL CHECK(skin_id IN ('void-royalty','crimson-rite','holo-wraith','toxic-pop','eclipse-noir')),
 source TEXT NOT NULL CHECK(source IN ('stripe','admin_grant')),
 source_ref TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','revoked')),
 granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 revoked_at TEXT,
 PRIMARY KEY(user_id,skin_id),
 UNIQUE(source,source_ref,skin_id),
 CHECK((state='active' AND revoked_at IS NULL) OR state='revoked')
);
CREATE INDEX IF NOT EXISTS idx_arcade_deck_entitlements_active ON arcade_deck_entitlements(user_id,state);
-- Enforce that claimed digital purchases can never be written by the public Deck Locker API.
-- No checkout or entitlement-write client route is introduced by this migration.
