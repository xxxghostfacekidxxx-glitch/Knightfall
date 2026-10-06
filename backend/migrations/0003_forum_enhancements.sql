CREATE INDEX IF NOT EXISTS idx_posts_thread_created ON posts(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_threads_category_updated ON threads(category_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_user_updated ON threads(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at);
