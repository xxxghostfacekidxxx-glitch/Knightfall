-- Personal Sanctuary Room layouts. All values are bounded; no rewards or currency.
-- Ownership and approved poses enforced independently of client-side UI.
CREATE TABLE IF NOT EXISTS mascot_room_layouts (
 pet_id INTEGER PRIMARY KEY REFERENCES mascot_pets(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 x_percent INTEGER NOT NULL DEFAULT 50 CHECK(x_percent BETWEEN 8 AND 92),
 y_percent INTEGER NOT NULL DEFAULT 65 CHECK(y_percent BETWEEN 25 AND 85),
 pose TEXT NOT NULL DEFAULT 'idle' CHECK(pose IN ('idle','bounce','mischief')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mascot_room_layouts_owner ON mascot_room_layouts(user_id);
CREATE TRIGGER IF NOT EXISTS mascot_room_layout_insert_guard BEFORE INSERT ON mascot_room_layouts
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id
 ) THEN RAISE(ABORT,'Cannot modify another member pet room') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_room_layout_update_guard BEFORE UPDATE ON mascot_room_layouts
BEGIN
 SELECT CASE WHEN NEW.user_id != OLD.user_id OR NEW.pet_id != OLD.pet_id OR NOT EXISTS (
  SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id
 ) THEN RAISE(ABORT,'Cannot transfer a pet room') END;
END;
