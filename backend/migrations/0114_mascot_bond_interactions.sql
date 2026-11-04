-- 0114: A separate, non-decaying relationship track and cooldowns for
-- talking, cuddling, and grooming. These interactions award bond only;
-- they do not award Cinders or pet XP and pets never lose bond when a member is away.
ALTER TABLE mascot_pets ADD COLUMN bond_experience INTEGER NOT NULL DEFAULT 0 CHECK(bond_experience >= 0);
ALTER TABLE mascot_pets ADD COLUMN talked_at TEXT;
ALTER TABLE mascot_pets ADD COLUMN cuddled_at TEXT;
ALTER TABLE mascot_pets ADD COLUMN groomed_at TEXT;
