-- Protect earned Rescue Shells: a mascot cannot be rescued with Cinders while an
-- egg of that species is incubating. Without this, users could spend both currencies
-- and be left with an impossible-to-hatch egg.
CREATE TRIGGER IF NOT EXISTS mascot_egg_reservation_guard
BEFORE INSERT ON mascot_acquisitions
BEGIN
 SELECT CASE WHEN EXISTS(
   SELECT 1 FROM mascot_rescue_eggs
   WHERE user_id=NEW.user_id AND species=NEW.species AND status='incubating'
 ) THEN RAISE(ABORT,'Species already reserved by incubating rescue egg') END;
END;
