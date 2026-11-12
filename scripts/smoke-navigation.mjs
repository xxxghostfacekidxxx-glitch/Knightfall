import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const origin = "https://ash-fall.com";
const publicDir = resolve("public");
const browser = await chromium.launch({ headless: true });
const sessions = [
  { name: "guest", status: 401 },
  { name: "auth unavailable", status: 503 },
  { name: "invalid auth response", status: 200 },
  { name: "member", user: { role: "member" } },
  { name: "creator", user: { role: "member", public_title: "Digital Creator" } },
  { name: "moderator", user: { role: "moderator" } },
  { name: "admin", user: { role: "admin" } },
  { name: "owner", user: { role: "god", username: "knightfall" } }
];

try {
  for (const [index, session] of sessions.entries()) {
    const mobile = index % 2 === 0;
    const context = await browser.newContext({
      viewport: { width: mobile ? 390 : 1440, height: 844 },
      serviceWorkers: "block"
    });
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) {
        const requested = resolve(publicDir, "." + url.pathname);
        const path = (await stat(requested).catch(() => null))?.isFile() ? requested : requested + ".html";
        return route.fulfill({ path }).catch(() => route.fulfill({ status: 404 }));
      }
      if (url.origin !== "https://api.ash-fall.com") return route.abort();
      const headers = { "access-control-allow-origin": origin, "access-control-allow-credentials": "true" };
      if (url.pathname === "/api/auth/me") {
        if (session.user) return route.fulfill({ headers, json: { user: { username: "fixture", ...session.user } } });
        if (session.status === 200) return route.fulfill({ headers, contentType: "text/html", body: "<p>Bad gateway</p>" });
        return route.fulfill({ headers, status: session.status, json: {} });
      }
      return route.fulfill({ headers, json: { unread_count: 3, settings: {} } });
    });

    const page = await context.newPage();
    try {
      const auth = page.waitForResponse("https://api.ash-fall.com/api/auth/me");
      await page.goto(origin + "/homepage#ecosystem", { waitUntil: "domcontentloaded" });
      await auth;
      const nav = page.getByRole("navigation", { name: "Primary navigation" });
      const toggle = page.getByRole("button", { name: "Open navigation" });
      if (mobile) await toggle.click();
      await nav.waitFor();
      assert.equal(await nav.getByRole("link", { name: "Explore", exact: true }).getAttribute("aria-current"), "page");

      const community = nav.locator("summary").filter({ hasText: "Community" });
      await community.click();
      const forum = nav.getByRole("link", { name: "Forums" });
      await forum.waitFor();
      assert.equal(await nav.getByRole("link", { name: "Member Directory" }).count(), 1);
      await forum.focus();
      await page.keyboard.press("Escape");
      assert.ok(await community.evaluate(el => el === document.activeElement));
      assert.equal(await forum.isVisible(), false);

      const account = nav.locator("summary").filter({ hasText: "My Account" });
      const staff = nav.locator("summary").filter({ hasText: "Staff" });
      if (session.user) {
        await account.waitFor();
        assert.equal(await nav.getByRole("link", { name: "Messages" }).count(), 1);
        await account.click();
        await nav.getByRole("link", { name: /Notifications.*3/ }).waitFor();
        const foundry = nav.getByRole("link", { name: "Creator Foundry" });
        const admin = ["admin", "god"].includes(session.user.role);
        assert.equal(await foundry.isVisible(), admin || session.name === "creator");
        const isStaff = admin || session.name === "moderator";
        assert.equal(await staff.isVisible(), isStaff);
        if (isStaff) {
          await staff.click();
          await nav.getByRole("link", { name: "Moderation" }).waitFor();
          await nav.getByRole("link", { name: "Settings & Tools" }).waitFor({ state: "hidden" });
          assert.equal(await nav.getByRole("link", { name: "Admin Dashboard" }).isVisible(), admin);
          if (admin) {
            await page.goto(origin + "/admin.html#master-task-list");
            const taskList = page.locator("#master-task-list[open]");
            await taskList.waitFor();
            const search = page.getByRole("textbox", { name: "Find a tool" }).or(page.getByRole("searchbox", { name: "Find a tool" }));
            await search.fill("privacy recovery");
            await search.press("Enter");
            const reports = page.locator('[data-panel="message-reports"].active');
            await reports.getByRole("link", { name: "Account Recovery" }).waitFor();
            assert.equal(new URL(page.url()).searchParams.get("tool"), "message-reports");
          }
        } else {
          await nav.getByRole("link", { name: "Settings & Tools" }).click();
          await page.locator("#account-tools").waitFor();
          assert.equal(await page.locator('#account-tools a[href="/memo-pad.html"]').count(), 1);
        }
      } else {
        assert.equal(await account.isVisible(), false);
        assert.equal(await staff.isVisible(), false);
        assert.equal(await nav.getByRole("link", { name: "Sign In" }).count(), 1);
      }
      const size = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]);
      assert.ok(size[1] <= size[0] + 3, "Page overflows viewport: " + size);
      console.log("PASS navigation", session.name, mobile ? "mobile" : "desktop");
    } catch (error) {
      const message = (session.name + " " + (mobile ? "mobile" : "desktop") + ": " + error.message).replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
      console.error("::error::" + message);
      await import("node:fs/promises").then(fs => fs.mkdir("priority-arcade-evidence", { recursive: true }));
      await page.screenshot({ path: "priority-arcade-evidence/navigation-failure.png", timeout: 3000 }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
