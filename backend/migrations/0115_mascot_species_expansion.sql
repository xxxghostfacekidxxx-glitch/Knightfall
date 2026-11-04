-- 0115: Add six original Neon Nuisances and raise the collection ceiling to 28.
INSERT OR IGNORE INTO mascot_species_market(species,cost_cinders,unlock_level) VALUES
 ('lydibug',350,1),('sootsnoot',750,2),('rumblefluff',1400,3),
 ('glittergob',750,2),('craggle',1400,3),('prismare',2500,5);

DROP TRIGGER IF EXISTS mascot_acquire_guard;
CREATE TRIGGER mascot_acquire_guard BEFORE INSERT ON mascot_acquisitions
BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=NEW.user_id AND species=NEW.species) THEN RAISE(ABORT,'Already adopted') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)>=28 THEN RAISE(ABORT,'Sanctuary full') END;
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

DROP TRIGGER IF EXISTS mascot_egg_craft_guard;
CREATE TRIGGER mascot_egg_craft_guard BEFORE INSERT ON mascot_rescue_eggs
BEGIN
 SELECT CASE WHEN NEW.status!='incubating' THEN RAISE(ABORT,'Invalid egg state') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)=0
   THEN RAISE(ABORT,'Adopt your free first pet before crafting') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=NEW.user_id AND species=NEW.species)
   THEN RAISE(ABORT,'Species already owned') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)>=28
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

DROP TRIGGER IF EXISTS mascot_egg_hatch_guard;
CREATE TRIGGER mascot_egg_hatch_guard BEFORE UPDATE OF status ON mascot_rescue_eggs
WHEN NEW.status='hatched'
BEGIN
 SELECT CASE WHEN OLD.status!='incubating' THEN RAISE(ABORT,'Already hatched') END;
 SELECT CASE WHEN datetime(OLD.ready_at)>datetime('now') THEN RAISE(ABORT,'Egg still incubating') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=OLD.user_id AND species=OLD.species)
   THEN RAISE(ABORT,'Species already owned') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=OLD.user_id)>=28
   THEN RAISE(ABORT,'Sanctuary already complete') END;
END;

UPDATE mascot_passport_badges
 SET title='Original Crew',description='Complete the original 22-species collection.',target=22
 WHERE badge_id='complete_crew';
INSERT OR IGNORE INTO mascot_passport_badges(badge_id,title,description,metric,target,reward_cinders)
 VALUES('full_menagerie','Full Misfit Menagerie','Collect all 28 original companions.','pets',28,2500);
