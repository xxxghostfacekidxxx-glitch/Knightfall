import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("Turnstile loads only when server supplies a site key", () => {
  assert.match(html, /if \(!data\.site_key\) return;/);
});
test("register challenge is rendered at most once and after panel becomes visible", () => {
  assert.match(html, /if \(rendered \|\| registerForm\.hidden \|\| !window\.turnstile\) return;/);
  assert.match(html, /registerTab\.addEventListener\("click", \(\) => queueMicrotask\(render\)\)/);
});
test("registration errors reset one-time challenge tokens", () => {
  assert.match(html, /endpoint\.endsWith\("\/register"\) && turnstileEnabled && window\.turnstile\) window\.turnstile\.reset\(\)/);
});
test("registration payload includes challenge response", () => {
  assert.match(html, /turnstile_token: form\.querySelector/);
});
