-- Add the two requested community categories after Astrology.
-- INSERT OR IGNORE keeps this migration safe if an administrator created either category first.
INSERT OR IGNORE INTO categories (name, slug, description, sort_order) VALUES
  ('True Crime', 'true-crime', 'Real cases, missing-person investigations, forensic developments, and unsolved mysteries. Bring evidence and reliable sources; respect victims and families. No doxxing, targeting private individuals, or presenting speculation as fact.', 9),
  ('The Sanctum Infernum', 'sanctum-infernum', 'A dark corner for occult traditions, symbolism, folklore, ritual as cultural or personal practice, horror, and esoteric discussion. Bring curiosity, creative work, and a healthy respect for context.', 10);
