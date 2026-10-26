-- Owner-only private vault folders. Objects remain in private R2 storage.
CREATE TABLE IF NOT EXISTS vault_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS vault_folder_items (
  object_key TEXT PRIMARY KEY REFERENCES vault_items(object_key) ON DELETE CASCADE,
  folder_id INTEGER NOT NULL REFERENCES vault_folders(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vault_folder_items_folder ON vault_folder_items(folder_id,added_at DESC);
