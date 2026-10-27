import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const headers = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");
const directives = new Map(headers.split(/\r?\n/).filter(line => /^  [\w-]+:/.test(line)).map(line => { const split = line.indexOf(":"); return [line.slice(2, split).toLowerCase(), line.slice(split + 1).trim()]; }));

test("Cloudflare Pages serves baseline security headers for all routes", () => {
  assert.match(headers, /^\/\*\s*$/m);
  assert.equal(directives.get("x-content-type-options"), "nosniff");
  assert.equal(directives.get("x-frame-options"), "DENY");
  assert.match(directives.get("strict-transport-security") || "", /max-age=31536000/);
});

test("CSP blocks embedding, plugin content and injected base URLs", () => {
  const csp = directives.get("content-security-policy") || "";
  for (const rule of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"]) assert.ok(csp.includes(rule), rule);
});
