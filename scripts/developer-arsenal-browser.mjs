import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.DEV_TOOLS_TEST_BASE || "http://127.0.0.1:8765";
const browser = await chromium.launch({ headless: true });
const roles = [
  { role: "member", title: "", allowed: false, developer: false },
  { role: "member", title: "Digital Creator", allowed: true, developer: false },
  { role: "admin", title: "", allowed: true, developer: true },
  { role: "god", title: "", allowed: true, developer: true }
];

try {
  for (const role of roles) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: "block"
    });
    await context.route("https://api.ash-fall.com/**", async route => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/auth/me") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user: { id: 1234, username: "fixture", role: role.role, public_title: role.title } })
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: '{"error":"Fixture API denied"}' });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      const response = await page.goto(base + "/devil-tools.html", { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200, "Devil Tools should serve over local static HTTP");
      if (role.allowed) {
        await page.locator("#workshop:not(.hidden)").waitFor({ timeout: 8000 });
        const developer = page.locator("#developer-arsenal-ci");
        assert.equal(await developer.count(), role.developer ? 1 : 0,
          role.role + " " + role.title + " developer section access");
        const toolbox = await page.locator("#dt-section-nav button").count();
        assert.ok(toolbox > 1, "Workshop navigation should be initialized");
        const size = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth
        }));
        assert.ok(size.content <= size.viewport + 3, "Workshop overflows mobile viewport: " + JSON.stringify(size));
      } else {
        await page.locator("#status.bad").waitFor({ timeout: 8000 });
        assert.equal(await page.locator("#workshop:not(.hidden)").count(), 0);
      }
      assert.deepEqual(errors, [], "Page JavaScript errors for role " + role.role);
      console.log("PASS Devil Tools role fixture:", role.role, role.title || "(no title)");
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
