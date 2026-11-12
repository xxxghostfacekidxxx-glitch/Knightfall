import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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
      const cors = {
        "access-control-allow-origin": new URL(base).origin,
        "access-control-allow-credentials": "true"
      };
      if (url.pathname === "/api/auth/me") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: cors,
          body: JSON.stringify({ user: { id: 1234, username: "fixture", role: role.role, public_title: role.title } })
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", headers: cors, body: '{"error":"Fixture API denied"}' });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      const response = await page.goto(base + "/dev-toolkit.html?from=bookmark#tools", { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200, "The legacy Foundry page should serve over local static HTTP");
      await page.waitForURL("**/devil-tools.html?from=bookmark#tools");
      assert.match(await page.title(), /Creator Foundry/);
      if (role.allowed) {
        await page.locator("#workshop:not(.hidden)").waitFor({ timeout: 8000 });
        const developer = page.locator("#developer-arsenal-ci");
        assert.equal(await developer.count(), role.developer ? 1 : 0,
          role.role + " " + role.title + " developer section access");
        const catalog = page.locator("#foundry-catalog");
        assert.equal(await catalog.locator("[data-group]:visible").count(), 4);
        assert.equal(await catalog.getByRole("heading", { name: "Pixelorama", exact: true }).count(), role.developer ? 1 : 0);
        assert.equal(await page.locator("#release-simulator").count(), role.developer ? 1 : 0);
        assert.equal(await page.locator("#creator-handoff:visible").count(), role.developer ? 0 : 1);

        const search = catalog.getByRole("searchbox", { name: "Find a tool" });
        await catalog.getByRole("button", { name: "Game Development" }).click();
        assert.equal(await catalog.locator("[data-group]:visible").count(), 1);
        await search.fill(role.developer ? "phaser" : "trenchbroom");
        const result = catalog.locator(".foundry-card:visible");
        assert.equal(await result.count(), 1);
        assert.match(await result.locator("h3").textContent(), role.developer ? /^Phaser$/ : /^TrenchBroom$/);
        await search.fill("zz-no-such-tool");
        await catalog.getByText("No tools match.", { exact: false }).waitFor();

        await catalog.getByRole("button", { name: "Art & Assets" }).click();
        await search.fill("sprite workshop");
        await catalog.getByRole("link", { name: "Open sprite workshop" }).click();
        await page.locator("#sprite-workshop").waitFor();
        assert.equal(await page.locator("#sprite-catalog .asset").count(), 24);
        await page.locator("#sprite-catalog .asset").nth(1).click();
        assert.match(await page.locator("#metrics").textContent(), /Selected: SKULL/);
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: /Export selected sprite/ }).click();
        const download = await downloadPromise;
        assert.match(download.suggestedFilename(), /-skull\.svg$/);
        await page.getByRole("link", { name: "Back to catalog" }).click();
        await catalog.waitFor();
        assert.equal(await search.inputValue(), "sprite workshop");
        assert.equal(await catalog.getByRole("button", { name: "Art & Assets" }).getAttribute("aria-pressed"), "true");

        await page.goto(base + "/devil-tools.html#brand-library");
        await page.locator("#brand-library").waitFor();
        assert.equal(await page.locator("#foundry-catalog:visible").count(), 0);
        await page.goto(base + "/dev-toolkit.html#release-simulator");
        await page.waitForURL("**/devil-tools.html#release-simulator");
        await page.locator(role.developer ? "#release-simulator" : "#foundry-catalog").waitFor();
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
      console.log("PASS Creator Foundry role fixture:", role.role, role.title || "(no title)");
    } catch (error) {
      // Only mocked accounts and a local HTTP server are used in these tests.
      // Capture UI evidence; never store session cookies or request headers.
      const dir = "/tmp/developer-arsenal-browser-evidence";
      const safeName = role.role + (role.title ? "-creator" : "");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, safeName + ".json"), JSON.stringify({
        fixtureRole: role.role,
        fixtureTitle: role.title,
        error: String(error?.message || error),
        pageErrors: errors.slice(0, 10),
        route: "/devil-tools.html"
      }, null, 2));
      await page.screenshot({ path: path.join(dir, safeName + ".png"), fullPage: false, timeout: 4000 }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
