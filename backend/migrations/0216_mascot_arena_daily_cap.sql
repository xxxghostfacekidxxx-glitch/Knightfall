-- Three daily account-wide arena entries, allocated as unique tokens so
-- concurrent requests cannot overrun the cap or consume it twice per pet.
CREATE TABLE IF NOT EXISTS mascot_arena_daily_tokens (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 3),
  pet_id INTEGER NOT NULL REFERENCES mascot_pets(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id,day,slot),
  UNIQUE(user_id,day,pet_id)
);
CREATE INDEX IF NOT EXISTS idx_mascot_arena_tokens_user_day
  ON mascot_arena_daily_tokens(user_id,day);
