-- 0104: collectible mascot rescue system and cosmetic wardrobe.
-- Pet rescue and Cinders cosmetics use atomic SQLite triggers; no trusting client price.
-- Existing free pets remain owned and count toward 22. Each account can own all species.
CREATE TABLE IF NOT EXISTS mascot_species_market(
 species TEXT PRIMARY KEY,
 cost_cinders INTEGER NOT NULL CHECK(cost_cinders >= 0),
 unlock_level INTEGER NOT NULL CHECK(unlock_level BETWEEN 1 AND 20)
);
INSERT OR IGNORE INTO mascot_species_market(species,cost_cinders,unlock_level) VALUES
 ('moxie',350,1),
 ('bloop',350,1),
 ('pippa',350,1),
 ('nib',350,1),
 ('glim',350,1),
 ('zuzu',350,1),
 ('kiki',350,1),
 ('emberbun',350,1),
 ('rattlepop',750,2),
 ('gutterkit',750,2),
 ('volt-imp',750,2),
 ('casket-pup',750,2),
 ('chunky-monkey',750,2),
 ('boo-thang',750,2),
 ('crypt-koi',1400,3),
 ('void-sprout',1400,3),
 ('minion-mouse',1400,3),
 ('gravebyte',1400,3),
 ('thornriot',1400,3),
 ('statichex',2500,5),
 ('mini-villain',2500,5),
 ('mini-eddie',2500,5);

CREATE TABLE IF NOT EXISTS mascot_acquisitions(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 species TEXT NOT NULL REFERENCES mascot_species_market(species),
 nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 1 AND 28),
 cost_cinders INTEGER NOT NULL CHECK(cost_cinders >= 0),
 acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,species)
);
CREATE INDEX IF NOT EXISTS idx_mascot_acquisitions_user ON mascot_acquisitions(user_id,acquired_at);
CREATE TRIGGER IF NOT EXISTS mascot_acquire_guard BEFORE INSERT ON mascot_acquisitions
BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=NEW.user_id AND species=NEW.species) THEN RAISE(ABORT,'Already adopted') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)>=22 THEN RAISE(ABORT,'Sanctuary full') END;
 SELECT CASE WHEN NEW.cost_cinders !=
   CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)=0 THEN 0
    ELSE (SELECT cost_cinders FROM mascot_species_market WHERE species=NEW.species) END
   THEN RAISE(ABORT,'Invalid rescue cost') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)>0 AND
   (SELECT unlock_level FROM mascot_species_market WHERE species=NEW.species)>
   COALESCE((SELECT MAX(1+CAST(SQRT(CAST(experience AS REAL)/40) AS INTEGER)) FROM mascot_pets WHERE user_id=NEW.user_id),1)
   THEN RAISE(ABORT,'Train a companion to unlock this species') END;
 SELECT CASE WHEN NEW.cost_cinders>0 AND COALESCE((SELECT balance FROM user_wallets WHERE user_id=NEW.user_id),0)<NEW.cost_cinders
   THEN RAISE(ABORT,'Not enough Cinders') END;
 UPDATE user_wallets SET balance=balance-NEW.cost_cinders,updated_at=CURRENT_TIMESTAMP
   WHERE user_id=NEW.user_id AND NEW.cost_cinders>0 AND balance>=NEW.cost_cinders;
 INSERT INTO wallet_ledger(user_id,amount,reason,created_at)
   SELECT NEW.user_id,-NEW.cost_cinders,'mascot rescue: '||NEW.species,CURRENT_TIMESTAMP WHERE NEW.cost_cinders>0;
END;
CREATE TRIGGER IF NOT EXISTS mascot_acquire_fulfill AFTER INSERT ON mascot_acquisitions
BEGIN
 INSERT INTO mascot_pets(user_id,species,nickname,adopted_at,featured)
 VALUES(NEW.user_id,NEW.species,NEW.nickname,NEW.acquired_at,
   CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)=0 THEN 1 ELSE 0 END);
END;

CREATE TABLE IF NOT EXISTS mascot_items(
 sku TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 slot TEXT NOT NULL CHECK(slot IN ('head','eyes','neck','aura')),
 cinders_price INTEGER CHECK(cinders_price>0),
 usd_cents INTEGER CHECK(usd_cents>0),
 CHECK((cinders_price IS NULL) != (usd_cents IS NULL))
);
INSERT OR IGNORE INTO mascot_items(sku,name,slot,cinders_price,usd_cents) VALUES
 ('scrap_crown','Scrap Crown','head',450,NULL),
 ('witch_hat','Midnight Witch Hat','head',550,NULL),
 ('glitch_horns','Glitch Horns','head',NULL,299),
 ('toxic_shades','Toxic Shades','eyes',350,NULL),
 ('cyber_visor','Cyber Visor','eyes',650,NULL),
 ('void_eyes','Void Gaze','eyes',NULL,249),
 ('spike_collar','Spiked Collar','neck',400,NULL),
 ('skull_pendant','Skull Pendant','neck',750,NULL),
 ('royal_chains','Royal Chains','neck',NULL,199),
 ('ember_aura','Ember Aura','aura',650,NULL),
 ('acid_particles','Acid Sparks','aura',900,NULL),
 ('eclipse_aura','Eclipse Aura','aura',NULL,399);
CREATE TABLE IF NOT EXISTS mascot_wardrobe(
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 sku TEXT NOT NULL REFERENCES mascot_items(sku),
 acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,sku)
);
CREATE TABLE IF NOT EXISTS mascot_item_purchases(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 sku TEXT NOT NULL REFERENCES mascot_items(sku),
 cost_cinders INTEGER NOT NULL CHECK(cost_cinders>0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,sku)
);
CREATE TRIGGER IF NOT EXISTS mascot_item_purchase_guard BEFORE INSERT ON mascot_item_purchases
BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_wardrobe WHERE user_id=NEW.user_id AND sku=NEW.sku) THEN RAISE(ABORT,'Already owned') END;
 SELECT CASE WHEN NEW.cost_cinders != COALESCE((SELECT cinders_price FROM mascot_items WHERE sku=NEW.sku),-1)
   THEN RAISE(ABORT,'Invalid accessory cost') END;
 SELECT CASE WHEN COALESCE((SELECT balance FROM user_wallets WHERE user_id=NEW.user_id),0)<NEW.cost_cinders
   THEN RAISE(ABORT,'Not enough Cinders') END;
 UPDATE user_wallets SET balance=balance-NEW.cost_cinders,updated_at=CURRENT_TIMESTAMP
   WHERE user_id=NEW.user_id AND balance>=NEW.cost_cinders;
 INSERT INTO wallet_ledger(user_id,amount,reason,created_at)
 VALUES(NEW.user_id,-NEW.cost_cinders,'mascot accessory: '||NEW.sku,CURRENT_TIMESTAMP);
END;
CREATE TRIGGER IF NOT EXISTS mascot_item_purchase_fulfill AFTER INSERT ON mascot_item_purchases
BEGIN
 INSERT INTO mascot_wardrobe(user_id,sku,acquired_at) VALUES(NEW.user_id,NEW.sku,NEW.created_at);
END;

CREATE TABLE IF NOT EXISTS mascot_equipment(
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 pet_id INTEGER NOT NULL REFERENCES mascot_pets(id) ON DELETE CASCADE,
 slot TEXT NOT NULL CHECK(slot IN ('head','eyes','neck','aura')),
 sku TEXT NOT NULL REFERENCES mascot_items(sku),
 equipped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,pet_id,slot)
);
CREATE INDEX IF NOT EXISTS idx_mascot_equipment_pet ON mascot_equipment(pet_id);
CREATE TRIGGER IF NOT EXISTS mascot_equip_guard BEFORE INSERT ON mascot_equipment
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id)
   THEN RAISE(ABORT,'Not your pet') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_wardrobe WHERE sku=NEW.sku AND user_id=NEW.user_id)
   THEN RAISE(ABORT,'Accessory not owned') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_items WHERE sku=NEW.sku AND slot=NEW.slot)
   THEN RAISE(ABORT,'Wrong accessory slot') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_equip_update_guard BEFORE UPDATE ON mascot_equipment
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id)
   THEN RAISE(ABORT,'Not your pet') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_wardrobe WHERE sku=NEW.sku AND user_id=NEW.user_id)
   THEN RAISE(ABORT,'Accessory not owned') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_items WHERE sku=NEW.sku AND slot=NEW.slot)
   THEN RAISE(ABORT,'Wrong accessory slot') END;
END;
