// Release guard: protect legal/account surfaces and disabled-shop UI from the
// retired warm/brown theme while keeping deletion and payment notices intact.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sources = {
  account: new URL("../public/account.html", import.meta.url),
  deletion: new URL("../public/account-deletion.html", import.meta.url),
  privacy: new URL("../public/privacy.html", import.meta.url),
  shop: new URL("../public/cinder-shop.html", import.meta.url)
};
const legacy = /#(?:5b3028|15100f|ff9b81|49413d|56306b|553b2b|4b382b|15110e|57433a|e8d4c8)\b/i;
for (const [name, url] of Object.entries(sources)) {
  test(`${name} retains the neon palette without legacy orange/brown`, () => {
    const html = readFileSync(url, "utf8");
    assert.doesNotMatch(html, legacy);
    assert.match(html, /#(?:ffb0ed|ff80e5|e8b5f5)/i);
  });
}
test("account deletion still requires confirmation and warns about manual processing", () => {
  const account = readFileSync(sources.account, "utf8");
  const deletion = readFileSync(sources.deletion, "utf8");
  assert.match(account, /delete-confirm/);
  assert.match(deletion, /does not immediately erase your account/i);
  assert.match(deletion, /operator processing/i);
});
test("shop previews never expose enabled checkout while payment setup is pending", () => {
  const html = readFileSync(sources.shop, "utf8");
  assert.match(html, /purchases are not available yet/i);
  assert.match(html, /support\.html/);
  const buttons = [...html.matchAll(/<button\b[^>]*>/gi)].map(x=>x[0]);
  assert.ok(buttons.length >= 1);
  for (const button of buttons) assert.match(button, /\bdisabled\b/i);
});
