// KV-free fallback for rate limits. Atomic D1 upsert prevents concurrent bypass.
export async function databaseRateLimit(db, bucketKey, limit, windowSeconds, now = Date.now()) {
  if (!db || typeof bucketKey !== "string" || !bucketKey.trim() || bucketKey.length > 512 || !Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(limit) || limit < 1 ||
      !Number.isSafeInteger(windowSeconds) || windowSeconds < 1) return false;
  const resetAt = now + windowSeconds * 1000;
  if (!Number.isSafeInteger(resetAt)) return false;
  try {
    const row = await db.prepare(`
      INSERT INTO request_rate_limits (bucket_key, count, reset_at)
      VALUES (?1, 1, ?2)
      ON CONFLICT(bucket_key) DO UPDATE SET
        count = CASE WHEN request_rate_limits.reset_at <= ?3 THEN 1
                     ELSE request_rate_limits.count + 1 END,
        reset_at = CASE WHEN request_rate_limits.reset_at <= ?3 THEN ?2
                        ELSE request_rate_limits.reset_at END
      WHERE request_rate_limits.reset_at <= ?3 OR request_rate_limits.count < ?4
      RETURNING count
    `).bind(bucketKey, resetAt, now, limit).first();
    return row != null && Number.isInteger(row.count) && row.count >= 1 && row.count <= limit;
  } catch (error) {
    console.error("rate_limit_storage_unavailable", String(error));
    // Do not silently disable security limits when storage is unavailable.
    return false;
  }
}
