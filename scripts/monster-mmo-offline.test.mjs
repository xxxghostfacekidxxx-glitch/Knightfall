import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const read = p => readFileSync("public/" + p, "utf8");
test("admin can download a complete single-file offline creature game", async () => {
  const assets = new Map(["monster-mmo.html","monster-mmo.css","monster-mmo.js"].map(p => ["/" + p, read(p)]));
  let clickHandler, blob, filename;
  const button = { disabled: false, addEventListener(type, handler) { if (type === "click") clickHandler = handler; } };
  const status = { textContent: "" };
  const document = {
    getElementById(id) { return id === "mmo-download" ? button : id === "mmo-admin-status" ? status : null; },
    createElement() { return { click() { filename = this.download; }, remove() {} }; },
    body: { append() {} }
  };
  const context = {
    document, Blob, setTimeout() {},
    URL: { createObjectURL(value) { blob = value; return "blob:offline-test"; }, revokeObjectURL() {} },
    fetch: async path => ({ ok: assets.has(path), status: assets.has(path) ? 200 : 404, text: async () => assets.get(path) })
  };
  vm.runInNewContext(read("monster-mmo-offline-download.js"), context);
  assert.equal(typeof clickHandler, "function");
  await clickHandler();
  assert.equal(filename, "ash-fall-hell-and-high-orbit-offline.html");
  assert.ok(blob, status.textContent);
  const html = await blob.text();
  assert.ok(html.includes("<style>"));
  assert.ok(html.includes("<script>"));
  assert.ok(html.includes('id="players"'));
  assert.ok(!html.includes('src="/monster-mmo.js"'));
  assert.ok(!html.includes('href="/monster-mmo.css"'));
  assert.ok(!html.includes('id="connect"'));
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, "Embedded game script must be present");
  assert.doesNotThrow(() => new vm.Script(match[1]));
});
