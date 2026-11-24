-- One free, server-resolved pet arena bout per companion each UTC day.
-- Rewards are deliberately XP-only and capped by the unique daily key.
CREATE TABLE IF NOT EXISTS mascot_arena_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id INTEGER NOT NULL REFERENCES mascot_pets(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  opponent TEXT NOT NULL,
  opponent_level INTEGER NOT NULL CHECK(opponent_level BETWEEN 1 AND 99),
  outcome TEXT NOT NULL CHECK(outcome IN ('win','draw','loss')),
  xp_reward INTEGER NOT NULL CHECK(xp_reward IN (10,20,35)),
  created_at TEXT NOT NULL,
  rewarded_at TEXT,
  UNIQUE(user_id,pet_id,day)
);
CREATE INDEX IF NOT EXISTS idx_mascot_arena_user_day
  ON mascot_arena_runs(user_id,day DESC,id DESC);
