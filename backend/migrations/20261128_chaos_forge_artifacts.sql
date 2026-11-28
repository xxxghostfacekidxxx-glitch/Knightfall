CREATE TABLE IF NOT EXISTS chaos_forge_artifacts(
 id TEXT PRIMARY KEY,
 owner_id INTEGER NOT NULL,
 filename TEXT NOT NULL CHECK(length(filename)<=80),
 data_base64 TEXT NOT NULL CHECK(length(data_base64)<=44000),
 sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 byte_count INTEGER NOT NULL CHECK(byte_count BETWEEN 1 AND 32768),
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chaos_forge_artifacts_owner_expiry ON chaos_forge_artifacts(owner_id,expires_at);
