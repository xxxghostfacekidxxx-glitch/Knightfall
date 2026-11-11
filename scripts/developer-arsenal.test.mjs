import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("developer arsenal has an authenticated workshop entry", async () => {
  const page = await load("public/devil-tools.html");
  assert.match(page, /id="developer-arsenal-ci"/);
  assert.match(page, /\$\('#developer-arsenal-ci'\)\.remove\(\)/);
  assert.match(page, /const administrator = isGod \|\|/);
  assert.match(page, /if \(!administrator\) \{/);
  assert.match(page, /developer-arsenal-audit\.yml/);
});

test("developer arsenal workflow is read-only and offline", async () => {
  const workflow = await load(".github/workflows/developer-arsenal-audit.yml");
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /node --test scripts\/developer-arsenal\.test\.mjs/);
  assert.doesNotMatch(workflow, /node scripts\/authorization-audit\.mjs/);
  assert.doesNotMatch(workflow, /KNIGHTFALL_(?:ADMIN|MEMBER|MODERATOR)_PASSWORD|wrangler deploy|cloudflare\/pages.*deploy/);
  assert.match(workflow, /continue-on-error: true/);
});

test("developer tools guide differentiates installed tools from candidates", async () => {
  const guide = await load("docs/developer-arsenal.md");
  assert.match(guide, /Playwright MCP/);
  assert.match(guide, /Chrome DevTools MCP/);
  assert.match(guide, /no MCP runtime provisioned/i);
  assert.match(guide, /GlitchTip/);
});

test("browser-role smoke test uses fixtures instead of live credentials", async () => {
  const script = await load("scripts/developer-arsenal-browser.mjs");
  assert.match(script, /role: "member"/);
  assert.match(script, /role: "admin"/);
  assert.match(script, /role: "god"/);
  assert.match(script, /route\.fulfill\(/);
  assert.doesNotMatch(script, /process\.env\.(?:KNIGHTFALL_.*PASSWORD|ADMIN_TOKEN)/);
  const flow = await load(".github/workflows/developer-arsenal-audit.yml");
  assert.match(flow, /node scripts\/developer-arsenal-browser\.mjs/);
});
