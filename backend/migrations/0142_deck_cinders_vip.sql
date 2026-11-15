-- 0142: Atomic Cinders spending for deck skins with VIP membership enforcement.
-- Existing free finishes and USD-paid finishes are NOT modified.
CREATE TABLE IF NOT EXISTS arcade_deck_cinder_catalog(
 skin_id TEXT PRIMARY KEY,
 cost_cinders INTEGER NOT NULL CHECK(cost_cinders>0),
 tier TEXT NOT NULL CHECK(tier IN ('cinders','vip'))
);
INSERT OR IGNORE INTO arcade_deck_cinder_catalog(skin_id,cost_cinders,tier) VALUES
 ('ashen-baroque',300,'cinders'),
 ('iron-maiden',350,'cinders'),
 ('moonlit-garden',400,'cinders'),
 ('broken-mirror',450,'cinders'),
 ('raven-script',500,'cinders'),
 ('witchglass',550,'cinders'),
 ('copper-cemetery',600,'cinders'),
 ('velvet-venom',650,'cinders'),
 ('storm-forged',700,'cinders'),
 ('frostbound',750,'cinders'),
 ('wildfire-tarot',800,'cinders'),
 ('nocturne-arcade',900,'cinders'),
 ('infernal-covenant',1200,'vip'),
 ('eclipse-sovereign',1400,'vip'),
 ('deathless-rose',1600,'vip'),
 ('seraphs-ruin',1800,'vip'),
 ('sovereign-ashes',2100,'vip'),
 ('eternal-flame',2500,'vip');
CREATE TABLE IF NOT EXISTS arcade_deck_cinder_purchases(
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 skin_id TEXT NOT NULL REFERENCES arcade_deck_cinder_catalog(skin_id),
 cost_cinders INTEGER NOT NULL CHECK(cost_cinders>0),
 purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,skin_id)
);
CREATE TRIGGER IF NOT EXISTS arcade_deck_cinder_purchase_guard BEFORE INSERT ON arcade_deck_cinder_purchases
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM arcade_deck_cinder_catalog WHERE skin_id=NEW.skin_id)
  THEN RAISE(ABORT,'Unknown Cinders skin') END;
 SELECT CASE WHEN NEW.cost_cinders != (SELECT cost_cinders FROM arcade_deck_cinder_catalog WHERE skin_id=NEW.skin_id)
  THEN RAISE(ABORT,'Invalid Cinders skin price') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM arcade_deck_cinder_purchases WHERE user_id=NEW.user_id AND skin_id=NEW.skin_id)
  THEN RAISE(ABORT,'Already owned') END;
 SELECT CASE WHEN (SELECT tier FROM arcade_deck_cinder_catalog WHERE skin_id=NEW.skin_id)='vip'
  AND NOT EXISTS(SELECT 1 FROM member_premium_memberships WHERE user_id=NEW.user_id AND status='active' AND (expires_at IS NULL OR datetime(expires_at)>CURRENT_TIMESTAMP))
  THEN RAISE(ABORT,'VIP membership required') END;
 SELECT CASE WHEN COALESCE((SELECT balance FROM user_wallets WHERE user_id=NEW.user_id),0)<NEW.cost_cinders
  THEN RAISE(ABORT,'Not enough Cinders') END;
 UPDATE user_wallets SET balance=balance-NEW.cost_cinders,updated_at=CURRENT_TIMESTAMP
  WHERE user_id=NEW.user_id AND balance>=NEW.cost_cinders;
 INSERT INTO wallet_ledger(user_id,amount,reason,created_at)
  VALUES(NEW.user_id,-NEW.cost_cinders,'deck skin: '||NEW.skin_id,CURRENT_TIMESTAMP);
END;
CREATE INDEX IF NOT EXISTS idx_arcade_deck_cinder_purchases_user ON arcade_deck_cinder_purchases(user_id,purchased_at DESC);
