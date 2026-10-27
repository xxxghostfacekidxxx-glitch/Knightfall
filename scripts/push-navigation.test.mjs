import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const start = source.indexOf("function safeNotificationPath(");
const end = source.indexOf("\nself.addEventListener(\"push\"", start);
assert.ok(start >= 0 && end > start, "safe path function exists");
const context = { URL, self: { location: { origin: "https://ash-fall.com" } } };
vm.runInNewContext(source.slice(start, end), context);
const safe = context.safeNotificationPath;

test("preserves legitimate same-origin notification routes", () => {
  assert.equal(safe("/messages.html?conversation=5"), "/messages.html?conversation=5");
  assert.equal(safe("/notifications.html"), "/notifications.html");
});
test("rejects off-site, protocol-relative and backslash destinations", () => {
  for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/%5c%5cevil.example", "javascript:alert(1)", null]) {
    assert.equal(safe(value), "/notifications.html", String(value));
  }
});
test("rejects control characters in destinations", () => {
  assert.equal(safe("/messages.html\nother"), "/notifications.html");
});
