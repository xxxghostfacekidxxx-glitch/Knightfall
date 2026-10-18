-- Add missing discussion topics. Existing topic categories are grouped visually under Community on the homepage.
INSERT OR IGNORE INTO categories (name, slug, description, sort_order) VALUES
  ('Gaming', 'gaming', 'Games, consoles, PC builds, tabletop campaigns, co-op chaos, and the arguments that somehow start over fictional worlds.', 11),
  ('Mindless Scribbling', 'mindless-scribbling', 'Doodles, sketches, half-formed ideas, creative experiments, and whatever escaped your brain onto a page.', 12);
