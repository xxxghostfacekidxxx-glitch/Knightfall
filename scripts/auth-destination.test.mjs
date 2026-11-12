import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { authDestination } from "../public/auth-destination.mjs";

test("sign-in returns visitors to their original local page, query and anchor", () => {
  for (const route of [
    "/thread.html?id=123#reply-form",
    "/create-thread.html?category_id=5",
    "/cinder-shop.html#orders-heading",
    "/arcade/async-play.html",
    "/memo-pad?tab=inbox"
  ]) assert.equal(authDestination(route), route);
  assert.equal(authDestination("https://ash-fall.com/chaos-cartridge.html"), "/chaos-cartridge.html");
  assert.equal(authDestination("/homepage.html?source=legacy#ecosystem"), "/?source=legacy#ecosystem");
});

test("sign-in rejects external URLs and avoids redirects back into itself", () => {
  for (const route of [
    null, "", "//outside.example", "https://ash-fall.com.outside.example/",
    "/\\outside.example", "javascript:alert(1)", "/auth.html?next=/auth.html",
    "https://user@ash-fall.com/", "/%2f%2foutside.example"
  ]) assert.equal(authDestination(route), "/account.html", route);
  assert.equal(authDestination("/index.html?next=/vault.html&mode=register"), "/");
});

test("the root owns the home content and only the auth page contains account forms", () => {
  const read = name => readFileSync(new URL("../public/" + name, import.meta.url), "utf8");
  const home = read("index.html");
  const legacy = read("homepage.html");
  const auth = read("auth.html");
  assert.match(home, /id="ecosystem"/);
  assert.match(home, /href="\/remembering-josh\.html"/);
  assert.doesNotMatch(home + legacy, /id="(?:login-panel|register-panel)"/);
  assert.match(legacy, /location\.replace\("\/" \+ location\.search \+ location\.hash\)/);
  assert.match(auth, /id="login-panel"/);
  assert.match(auth, /id="register-panel"/);
  assert.match(auth, /href="\/reset-password\.html"/);
  assert.match(read("_redirects"), /^\/homepage \/ 301$/m);
});
