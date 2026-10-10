ALTER TABLE personal_bots ADD COLUMN is_nsfw INTEGER NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO categories (name, slug, description, sort_order) VALUES (
  'Astrology',
  'astrology',
  'Birth charts, zodiac signs, planetary transits, compatibility, and astrological traditions. Share interpretations and compare perspectives respectfully.',
  8
);
