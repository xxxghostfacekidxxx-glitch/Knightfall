-- Durable rate-limit counters replace high-churn KV writes.
CREATE TABLE IF NOT EXISTS request_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_request_rate_limits_reset ON request_rate_limits(reset_at);
