import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync(new URL("../backend/wrangler.jsonc", import.meta.url), "utf8"));

test("no paid-only Cloudflare resources enabled in production config", () => {
  for (const key of ["hyperdrive", "vectorize", "workflows", "containers", "analytics_engine_datasets", "unsafe"]) {
    assert.equal(config[key], undefined, key + " requires an explicit free-tier review before enabling");
  }
});

test("notification queue remains disabled until a free staging test passes", () => {
  assert.equal(config.queues, undefined);
});

test("existing data bindings are preserved", () => {
  assert.ok(Array.isArray(config.d1_databases) && config.d1_databases.length > 0);
  assert.ok(Array.isArray(config.kv_namespaces) && config.kv_namespaces.length > 0);
  assert.ok(Array.isArray(config.r2_buckets) && config.r2_buckets.length > 0);
});
