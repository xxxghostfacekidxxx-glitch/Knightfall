import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const frontend = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const backend = readFileSync(new URL("../backend/src/turnstile.js", import.meta.url), "utf8");

test("registration Turnstile action agrees across frontend and backend", () => {
  assert.match(frontend, /sitekey:data\.site_key,action:"register"/);
  assert.match(backend, /result\.action === "register"/);
});
test("frontend submits the challenge response during registration", () => {
  assert.match(frontend, /turnstile_token: form\.querySelector/);
});
test("backend requires approved hostname as well as action", () => {
  assert.match(backend, /approved\.includes\(result\.hostname\)/);
});
