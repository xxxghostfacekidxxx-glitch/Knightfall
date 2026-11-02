-- Neon Nuisances Sanctuary: member-owned profile companions.
-- All actions bind to the authenticated users.id; original artwork remains first party.
CREATE TABLE IF NOT EXISTS mascot_pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 1 AND 28),
  adopted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fed_at TEXT,
  played_at TEXT,
  rested_at TEXT,
  experience INTEGER NOT NULL DEFAULT 0 CHECK(experience >= 0),
  featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN (0,1)),
  UNIQUE(user_id,species)
);
CREATE INDEX IF NOT EXISTS idx_mascot_pets_user ON mascot_pets(user_id,adopted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mascot_pets_featured ON mascot_pets(user_id) WHERE featured=1;
