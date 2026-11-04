-- Big-headed personal avatars. Two saved slots are included for every member;
-- additional slot inventory is purchased with Cinders through guarded triggers.
CREATE TABLE IF NOT EXISTS personal_avatar_entitlements (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  extra_slots INTEGER NOT NULL DEFAULT 0 CHECK(extra_slots BETWEEN 0 AND 20),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_avatars (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_no INTEGER NOT NULL CHECK(slot_no BETWEEN 1 AND 22),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 32),
  avatar_json TEXT NOT NULL CHECK(json_valid(avatar_json) AND length(avatar_json)<=12000),
  is_active INTEGER NOT NULL DEFAULT 0 CHECK(is_active IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,slot_no)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_avatars_one_active
 ON personal_avatars(user_id) WHERE is_active=1;

CREATE TABLE IF NOT EXISTS personal_avatar_slot_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slots INTEGER NOT NULL CHECK(slots IN (1,3)),
  cost_cinders INTEGER NOT NULL CHECK(cost_cinders IN (600,1500)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_avatar_slot_purchases_user ON personal_avatar_slot_purchases(user_id,created_at DESC);

CREATE TRIGGER IF NOT EXISTS personal_avatar_save_guard BEFORE INSERT ON personal_avatars BEGIN
 SELECT CASE WHEN NEW.slot_no > 2 + COALESCE((SELECT extra_slots FROM personal_avatar_entitlements WHERE user_id=NEW.user_id),0)
  THEN RAISE(ABORT,'Avatar slot is locked') END;
END;
CREATE TRIGGER IF NOT EXISTS personal_avatar_update_guard BEFORE UPDATE ON personal_avatars BEGIN
 SELECT CASE WHEN NEW.user_id!=OLD.user_id OR NEW.slot_no!=OLD.slot_no
  THEN RAISE(ABORT,'Avatar ownership and slot cannot change') END;
END;
CREATE TRIGGER IF NOT EXISTS personal_avatar_slot_purchase_guard BEFORE INSERT ON personal_avatar_slot_purchases BEGIN
 SELECT CASE WHEN NOT ((NEW.slots=1 AND NEW.cost_cinders=600) OR (NEW.slots=3 AND NEW.cost_cinders=1500))
  THEN RAISE(ABORT,'Invalid avatar slot price') END;
 SELECT CASE WHEN NEW.slots > 20 - COALESCE((SELECT extra_slots FROM personal_avatar_entitlements WHERE user_id=NEW.user_id),0)
  THEN RAISE(ABORT,'Avatar slot limit reached') END;
 SELECT CASE WHEN COALESCE((SELECT balance FROM user_wallets WHERE user_id=NEW.user_id),0)<NEW.cost_cinders
  THEN RAISE(ABORT,'Not enough Cinders') END;
 UPDATE user_wallets SET balance=balance-NEW.cost_cinders,updated_at=CURRENT_TIMESTAMP
  WHERE user_id=NEW.user_id AND balance>=NEW.cost_cinders;
 INSERT INTO wallet_ledger(user_id,amount,reason,created_at)
  VALUES(NEW.user_id,-NEW.cost_cinders,'personal avatar slots: '||NEW.slots,CURRENT_TIMESTAMP);
END;
CREATE TRIGGER IF NOT EXISTS personal_avatar_slot_purchase_fulfill AFTER INSERT ON personal_avatar_slot_purchases BEGIN
 INSERT INTO personal_avatar_entitlements(user_id,extra_slots,updated_at)
  VALUES(NEW.user_id,NEW.slots,CURRENT_TIMESTAMP)
  ON CONFLICT(user_id) DO UPDATE SET extra_slots=extra_slots+NEW.slots,updated_at=CURRENT_TIMESTAMP;
END;
