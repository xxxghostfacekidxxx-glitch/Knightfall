-- Starborn companions are prestige rescues, with evolved forms earned through care and bond.
UPDATE mascot_species_market SET cost_cinders=4500,unlock_level=7 WHERE species IN ('lydibug','minion-mouse');
UPDATE mascot_species_market SET cost_cinders=5000,unlock_level=8 WHERE species='boo-thang';
UPDATE mascot_species_market SET cost_cinders=5500,unlock_level=9 WHERE species='mini-villain';
UPDATE mascot_species_market SET cost_cinders=6000,unlock_level=9 WHERE species='mini-eddie';

DROP TRIGGER IF EXISTS mascot_acquire_guard;
CREATE TRIGGER mascot_acquire_guard BEFORE INSERT ON mascot_acquisitions
BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=NEW.user_id AND species=NEW.species) THEN RAISE(ABORT,'Already adopted') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)>=28 THEN RAISE(ABORT,'Sanctuary full') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM mascot_pets WHERE user_id=NEW.user_id)=0 AND NEW.species NOT IN ('moxie','bloop','pippa','nib','glim','zuzu','kiki','emberbun')
   THEN RAISE(ABORT,'Choose a free starter for your first rescue') END;
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
