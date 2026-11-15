-- 0141: NEW premium Deck Atelier skins. Original twelve remain forever free.
-- Separate table preserves legacy entitlement check constraints and historical orders.
CREATE TABLE IF NOT EXISTS arcade_deck_paid_entitlements (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 skin_id TEXT NOT NULL CHECK(skin_id IN ('obsidian-cathedral','mourning-rose','serpent-crown','arcane-tarot','blood-moon','rusted-relic','phantom-masquerade','starfall','witching-hour','thornbound','sacred-static','cinder-emperor')),
 source_order_id TEXT NOT NULL UNIQUE REFERENCES member_shop_orders(id),
 state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','revoked')),
 granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 revoked_at TEXT,
 PRIMARY KEY(user_id,skin_id)
);
CREATE INDEX IF NOT EXISTS idx_arcade_deck_paid_active ON arcade_deck_paid_entitlements(user_id,state);
