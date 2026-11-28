CREATE TABLE IF NOT EXISTS chaos_image_usage (owner_id INTEGER NOT NULL, day TEXT NOT NULL, attempts INTEGER NOT NULL CHECK(attempts BETWEEN 1 AND 3), PRIMARY KEY(owner_id,day));
