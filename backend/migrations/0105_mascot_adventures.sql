-- Sanctuary Expeditions v1. Exact-species eggs only, never random or premium.
-- Rewards, egg fragment deductions and hatching are protected by SQLite triggers.
CREATE TABLE IF NOT EXISTS mascot_quest_runs(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 pet_id INTEGER NOT NULL REFERENCES mascot_pets(id) ON DELETE CASCADE,
 day TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('feed','play','rest')),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 90),
 progress INTEGER NOT NULL DEFAULT 0 CHECK(progress IN (0,1)),
 claimed INTEGER NOT NULL DEFAULT 0 CHECK(claimed IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,pet_id,day)
);
CREATE INDEX IF NOT EXISTS idx_mascot_quest_user_day ON mascot_quest_runs(user_id,day);
CREATE TRIGGER IF NOT EXISTS mascot_quest_start_guard BEFORE INSERT ON mascot_quest_runs
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id)
   THEN RAISE(ABORT,'Not your companion') END;
 SELECT CASE WHEN NEW.day!=date('now') THEN RAISE(ABORT,'Quest date expired') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_quest_runs WHERE user_id=NEW.user_id AND day=NEW.day)>=3
   THEN RAISE(ABORT,'Three daily quests already started') END;
END;
CREATE TABLE IF NOT EXISTS mascot_shell_fragments(
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 fragments INTEGER NOT NULL DEFAULT 0 CHECK(fragments>=0),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mascot_quest_claims(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 quest_id INTEGER NOT NULL UNIQUE REFERENCES mascot_quest_runs(id) ON DELETE CASCADE,
 day TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mascot_quest_claims_user_day ON mascot_quest_claims(user_id,day);
CREATE TRIGGER IF NOT EXISTS mascot_quest_claim_guard BEFORE INSERT ON mascot_quest_claims
BEGIN
 SELECT CASE WHEN NOT EXISTS(
   SELECT 1 FROM mascot_quest_runs WHERE id=NEW.quest_id AND user_id=NEW.user_id
   AND day=NEW.day AND progress=1 AND claimed=0)
   THEN RAISE(ABORT,'Quest unfinished or already claimed') END;
 SELECT CASE WHEN NEW.day!=date('now') THEN RAISE(ABORT,'Daily quest expired') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_quest_claims WHERE user_id=NEW.user_id AND day=NEW.day)>=3
   THEN RAISE(ABORT,'Daily claim limit reached') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_quest_claim_fulfill AFTER INSERT ON mascot_quest_claims
BEGIN
 UPDATE mascot_quest_runs SET claimed=1 WHERE id=NEW.quest_id AND user_id=NEW.user_id;
 INSERT OR IGNORE INTO user_wallets(user_id,balance) VALUES(NEW.user_id,0);
 UPDATE user_wallets SET balance=balance+75,updated_at=CURRENT_TIMESTAMP WHERE user_id=NEW.user_id;
 INSERT INTO wallet_ledger(user_id,amount,reason,created_at)
   VALUES(NEW.user_id,75,'sanctuary species quest',CURRENT_TIMESTAMP);
 INSERT INTO mascot_shell_fragments(user_id,fragments,updated_at) VALUES(NEW.user_id,1,CURRENT_TIMESTAMP)
   ON CONFLICT(user_id) DO UPDATE SET fragments=fragments+1,updated_at=CURRENT_TIMESTAMP;
END;
CREATE TABLE IF NOT EXISTS mascot_rescue_eggs(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 species TEXT NOT NULL REFERENCES mascot_species_market(species),
 nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 1 AND 28),
 started_at TEXT NOT NULL,
 ready_at TEXT NOT NULL,
 hatched_at TEXT,
 status TEXT NOT NULL DEFAULT 'incubating' CHECK(status IN ('incubating','hatched')),
 UNIQUE(user_id,species)
);
CREATE INDEX IF NOT EXISTS idx_mascot_eggs_owner ON mascot_rescue_eggs(user_id,status,ready_at);
CREATE TRIGGER IF NOT EXISTS mascot_egg_craft_guard BEFORE INSERT ON mascot_rescue_eggs
BEGIN
 SELECT CASE WHEN NEW.status!='incubating' THEN RAISE(ABORT,'Invalid egg state') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)=0
   THEN RAISE(ABORT,'Adopt your free first pet before crafting') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=NEW.user_id AND species=NEW.species)
   THEN RAISE(ABORT,'Species already owned') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)>=22
   THEN RAISE(ABORT,'Sanctuary already complete') END;
 SELECT CASE WHEN COALESCE((SELECT fragments FROM mascot_shell_fragments WHERE user_id=NEW.user_id),0)<3
   THEN RAISE(ABORT,'Need three shell fragments') END;
 SELECT CASE WHEN (SELECT unlock_level FROM mascot_species_market WHERE species=NEW.species)>
   COALESCE((SELECT MAX(1+CAST(SQRT(CAST(experience AS REAL)/40) AS INTEGER))
   FROM mascot_pets WHERE user_id=NEW.user_id),1)
   THEN RAISE(ABORT,'Species level not unlocked') END;
 SELECT CASE WHEN datetime(NEW.ready_at)<datetime('now','+30 minutes')
   THEN RAISE(ABORT,'Incubation must be at least thirty minutes') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_egg_craft_debit AFTER INSERT ON mascot_rescue_eggs
BEGIN
 UPDATE mascot_shell_fragments SET fragments=fragments-3,updated_at=CURRENT_TIMESTAMP
 WHERE user_id=NEW.user_id;
END;
CREATE TRIGGER IF NOT EXISTS mascot_egg_hatch_guard BEFORE UPDATE OF status ON mascot_rescue_eggs
WHEN NEW.status='hatched'
BEGIN
 SELECT CASE WHEN OLD.status!='incubating' THEN RAISE(ABORT,'Already hatched') END;
 SELECT CASE WHEN datetime(OLD.ready_at)>datetime('now') THEN RAISE(ABORT,'Egg still incubating') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=OLD.user_id AND species=OLD.species)
   THEN RAISE(ABORT,'Species already owned') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=OLD.user_id)>=22
   THEN RAISE(ABORT,'Sanctuary already complete') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_egg_hatch_fulfill AFTER UPDATE OF status ON mascot_rescue_eggs
WHEN NEW.status='hatched' AND OLD.status='incubating'
BEGIN
 INSERT INTO mascot_pets(user_id,species,nickname,adopted_at,featured)
 VALUES(NEW.user_id,NEW.species,NEW.nickname,COALESCE(NEW.hatched_at,CURRENT_TIMESTAMP),0);
END;
CREATE TABLE IF NOT EXISTS mascot_habitats(
 pet_id INTEGER PRIMARY KEY REFERENCES mascot_pets(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 theme TEXT NOT NULL CHECK(theme IN ('graveyard','neon-city','toxic-lagoon','cosmic-void')),
 decoration TEXT NOT NULL DEFAULT 'none' CHECK(decoration IN ('none','lantern','arcade','crystal')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mascot_habitats_user ON mascot_habitats(user_id);
CREATE TRIGGER IF NOT EXISTS mascot_habitat_insert_guard BEFORE INSERT ON mascot_habitats
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id)
   THEN RAISE(ABORT,'Not your companion') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_habitat_update_guard BEFORE UPDATE ON mascot_habitats
BEGIN
 SELECT CASE WHEN NEW.user_id!=OLD.user_id OR NEW.pet_id!=OLD.pet_id
   OR NOT EXISTS(SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id)
   THEN RAISE(ABORT,'Invalid habitat owner') END;
END;
