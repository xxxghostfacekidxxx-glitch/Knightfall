-- 0109: Original Sanctuary room furniture, priced and owned on D1.
-- Independent from the canonical 0108 mascot_room_layouts table.
CREATE TABLE IF NOT EXISTS mascot_room_furniture_catalog(
 item_key TEXT PRIMARY KEY,name TEXT NOT NULL,
 cost_cinders INTEGER NOT NULL CHECK(cost_cinders BETWEEN 0 AND 100000),
 unlock_level INTEGER NOT NULL CHECK(unlock_level BETWEEN 1 AND 20)
);
INSERT OR IGNORE INTO mascot_room_furniture_catalog(item_key,name,cost_cinders,unlock_level) VALUES
('lantern','Haunted Lantern',0,1),
('skull_pile','Bone Pile',0,1),
('bone_tree','Bone Tree',0,2),
('grave_marker','Cursed Headstone',0,2),
('glitch_console','Glitch Console',500,2),
('neon_throne','Neon Throne',850,3),
('spirit_fountain','Spirit Fountain',1100,4),
('chaos_portal','Chaos Portal',1600,5);
CREATE TABLE IF NOT EXISTS mascot_room_furniture_inventory(
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 item_key TEXT NOT NULL REFERENCES mascot_room_furniture_catalog(item_key),
 acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,item_key)
);
CREATE TABLE IF NOT EXISTS mascot_room_furniture_purchases(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 item_key TEXT NOT NULL REFERENCES mascot_room_furniture_catalog(item_key),
 cost_cinders INTEGER NOT NULL CHECK(cost_cinders>0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,item_key)
);
CREATE TRIGGER IF NOT EXISTS mascot_room_furniture_buy_guard BEFORE INSERT ON mascot_room_furniture_purchases BEGIN
 SELECT CASE WHEN NEW.cost_cinders!=COALESCE((SELECT cost_cinders FROM mascot_room_furniture_catalog WHERE item_key=NEW.item_key),-1)
 THEN RAISE(ABORT,'Invalid furniture price') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_room_furniture_inventory WHERE user_id=NEW.user_id AND item_key=NEW.item_key)
 THEN RAISE(ABORT,'Already owned') END;
 SELECT CASE WHEN COALESCE((SELECT balance FROM user_wallets WHERE user_id=NEW.user_id),0)<NEW.cost_cinders
 THEN RAISE(ABORT,'Insufficient Cinders') END;
 UPDATE user_wallets SET balance=balance-NEW.cost_cinders,updated_at=CURRENT_TIMESTAMP
 WHERE user_id=NEW.user_id AND balance>=NEW.cost_cinders;
 INSERT INTO wallet_ledger(user_id,amount,reason,created_at) VALUES
 (NEW.user_id,-NEW.cost_cinders,'sanctuary room furniture: '||NEW.item_key,CURRENT_TIMESTAMP);
END;
CREATE TRIGGER IF NOT EXISTS mascot_room_furniture_buy_fulfill AFTER INSERT ON mascot_room_furniture_purchases BEGIN
 INSERT INTO mascot_room_furniture_inventory(user_id,item_key,acquired_at)
 VALUES(NEW.user_id,NEW.item_key,NEW.created_at);
END;
CREATE TABLE IF NOT EXISTS mascot_room_furniture_placements(
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 pet_id INTEGER NOT NULL REFERENCES mascot_pets(id) ON DELETE CASCADE,
 item_key TEXT NOT NULL REFERENCES mascot_room_furniture_catalog(item_key),
 x_pct INTEGER NOT NULL CHECK(x_pct BETWEEN 8 AND 92),
 y_pct INTEGER NOT NULL CHECK(y_pct BETWEEN 16 AND 85),
 flipped INTEGER NOT NULL DEFAULT 0 CHECK(flipped IN (0,1)),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(pet_id,item_key)
);
CREATE INDEX IF NOT EXISTS idx_room_furniture_owner ON mascot_room_furniture_placements(user_id,pet_id);
CREATE TRIGGER IF NOT EXISTS mascot_room_furniture_place_guard BEFORE INSERT ON mascot_room_furniture_placements BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id)
 THEN RAISE(ABORT,'Not your pet') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_room_furniture_placements WHERE pet_id=NEW.pet_id)>=8
 THEN RAISE(ABORT,'Room is full') END;
 SELECT CASE WHEN (SELECT unlock_level FROM mascot_room_furniture_catalog WHERE item_key=NEW.item_key)>
 COALESCE((SELECT 1+CAST(SQRT(CAST(experience AS REAL)/40) AS INTEGER)
 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id),1)
 THEN RAISE(ABORT,'Furniture level locked') END;
 SELECT CASE WHEN (SELECT cost_cinders FROM mascot_room_furniture_catalog WHERE item_key=NEW.item_key)>0
 AND NOT EXISTS(SELECT 1 FROM mascot_room_furniture_inventory WHERE user_id=NEW.user_id AND item_key=NEW.item_key)
 THEN RAISE(ABORT,'Furniture not owned') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_room_furniture_update_guard BEFORE UPDATE ON mascot_room_furniture_placements BEGIN
 SELECT CASE WHEN NEW.user_id!=OLD.user_id OR NEW.pet_id!=OLD.pet_id OR NEW.item_key!=OLD.item_key
 OR NOT EXISTS(SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id)
 THEN RAISE(ABORT,'Furniture ownership cannot be changed') END;
END;
