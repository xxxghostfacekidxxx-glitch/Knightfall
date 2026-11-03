-- 0107 Sanctuary Passport: permanent, server-earned collection milestones.
-- Cosmetic purchase is not required; first accessory can be earned with Cinders.
CREATE TABLE IF NOT EXISTS mascot_passport_badges(
 badge_id TEXT PRIMARY KEY,
 title TEXT NOT NULL,
 description TEXT NOT NULL,
 metric TEXT NOT NULL CHECK(metric IN ('pets','hatched','quests','equipped')),
 target INTEGER NOT NULL CHECK(target>0),
 reward_cinders INTEGER NOT NULL CHECK(reward_cinders BETWEEN 1 AND 5000)
);
INSERT OR IGNORE INTO mascot_passport_badges(badge_id,title,description,metric,target,reward_cinders) VALUES
 ('first_friend','First Little Monster','Rescue your first companion.','pets',1,100),
 ('misfit_trio','Misfit Trio','Collect three different species.','pets',3,200),
 ('madhouse_ten','Madhouse Menagerie','Collect ten different species.','pets',10,500),
 ('complete_crew','All 22, No Mercy','Complete the full species collection.','pets',22,2000),
 ('first_hatch','Cracked the Shell','Hatch a rescue egg earned from quests.','hatched',1,150),
 ('quest_scout','Midnight Scout','Complete five species quests.','quests',5,250),
 ('quest_legend','Eternal Pathfinder','Complete twenty-five species quests.','quests',25,750),
 ('fashion_fiend','Dress to Disturb','Equip a companion with an accessory.','equipped',1,125);
CREATE TABLE IF NOT EXISTS mascot_passport_claims(
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 badge_id TEXT NOT NULL REFERENCES mascot_passport_badges(badge_id),
 claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,badge_id)
);
CREATE INDEX IF NOT EXISTS idx_mascot_passport_user ON mascot_passport_claims(user_id,claimed_at DESC);
CREATE TRIGGER IF NOT EXISTS mascot_passport_claim_guard BEFORE INSERT ON mascot_passport_claims
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_passport_badges WHERE badge_id=NEW.badge_id)
 THEN RAISE(ABORT,'Unknown badge') END;
 SELECT CASE WHEN (
  SELECT CASE metric
    WHEN 'pets' THEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)
    WHEN 'hatched' THEN (SELECT COUNT(*) FROM mascot_rescue_eggs WHERE user_id=NEW.user_id AND status='hatched')
    WHEN 'quests' THEN (SELECT COUNT(*) FROM mascot_quest_claims WHERE user_id=NEW.user_id)
    WHEN 'equipped' THEN (SELECT COUNT(*) FROM mascot_equipment WHERE user_id=NEW.user_id)
    ELSE 0 END
  FROM mascot_passport_badges WHERE badge_id=NEW.badge_id
 ) < (SELECT target FROM mascot_passport_badges WHERE badge_id=NEW.badge_id)
 THEN RAISE(ABORT,'Passport milestone incomplete') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_passport_claim_fulfill AFTER INSERT ON mascot_passport_claims
BEGIN
 INSERT OR IGNORE INTO user_wallets(user_id,balance) VALUES(NEW.user_id,0);
 UPDATE user_wallets SET balance=balance+
 (SELECT reward_cinders FROM mascot_passport_badges WHERE badge_id=NEW.badge_id),updated_at=CURRENT_TIMESTAMP
 WHERE user_id=NEW.user_id;
 INSERT INTO wallet_ledger(user_id,amount,reason,created_at) VALUES(
 NEW.user_id,
 (SELECT reward_cinders FROM mascot_passport_badges WHERE badge_id=NEW.badge_id),
 'sanctuary passport: '||NEW.badge_id,CURRENT_TIMESTAMP
 );
END;
