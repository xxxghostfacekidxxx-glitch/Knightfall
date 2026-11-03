-- Member-controlled featured profile links. Display respects profile_visibility.
-- Public URLs are HTTPS only, enforced in the Worker. No link metadata is scraped.
CREATE TABLE IF NOT EXISTS profile_featured_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK(length(label) BETWEEN 1 AND 50),
  url TEXT NOT NULL CHECK(length(url) BETWEEN 1 AND 500),
  category TEXT NOT NULL CHECK(category IN ('website','social','music','art','gaming','other')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_profile_featured_links_owner_order ON profile_featured_links(user_id,sort_order,id);
