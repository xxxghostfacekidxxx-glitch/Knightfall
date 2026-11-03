-- 0108: Interactive pet rooms. Coordinates are normalized 0-100 and
-- changes never deduct wallet currency. Every room is tied to a pet owner.
CREATE TABLE IF NOT EXISTS mascot_room_layouts (
 pet_id INTEGER PRIMARY KEY REFERENCES mascot_pets(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 pet_x INTEGER NOT NULL DEFAULT 50 CHECK(pet_x BETWEEN 8 AND 92),
 pet_y INTEGER NOT NULL DEFAULT 58 CHECK(pet_y BETWEEN 26 AND 84),
 decor_x INTEGER NOT NULL DEFAULT 72 CHECK(decor_x BETWEEN 10 AND 90),
 decor_y INTEGER NOT NULL DEFAULT 70 CHECK(decor_y BETWEEN 30 AND 90),
 ambiance TEXT NOT NULL DEFAULT 'mist' CHECK(ambiance IN ('mist','fireflies','glitch','none')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mascot_room_layouts_owner ON mascot_room_layouts(user_id);
CREATE TRIGGER IF NOT EXISTS mascot_room_layout_owner_insert
 BEFORE INSERT ON mascot_room_layouts
BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id
 ) THEN RAISE(ABORT,'Room belongs to another member') END;
END;
CREATE TRIGGER IF NOT EXISTS mascot_room_layout_owner_update
 BEFORE UPDATE ON mascot_room_layouts
BEGIN
 SELECT CASE WHEN NEW.pet_id!=OLD.pet_id OR NEW.user_id!=OLD.user_id
 OR NOT EXISTS (SELECT 1 FROM mascot_pets WHERE id=NEW.pet_id AND user_id=NEW.user_id)
 THEN RAISE(ABORT,'Room ownership cannot be changed') END;
END;
