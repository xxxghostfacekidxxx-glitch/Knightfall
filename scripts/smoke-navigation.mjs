import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import {staffCapabilities} from "../backend/src/staff-capabilities.js";

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
  { name: "Isis", user: { role: "admin", is_isis:1 } },
  { name: "revoked partner", user:{role:"admin",username:"knightfallsamantha",is_isis:0} },
  { name: "pending invitation", user:{role:"member",handoff_invited:1} },
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
        const requested = resolve(publicDir, "." + (url.pathname === "/" ? "/index.html" : url.pathname));
        const path = (await stat(requested).catch(() => null))?.isFile() ? requested : requested + ".html";
        return route.fulfill({ path }).catch(() => route.fulfill({ status: 404 }));
      }
      if (url.origin !== "https://api.ash-fall.com") return route.abort();
      const headers = { "access-control-allow-origin": origin, "access-control-allow-credentials": "true" };
      if (route.request().method() === "OPTIONS") {
        return route.fulfill({ status: 204, headers: {
          ...headers,
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "GET, POST, OPTIONS"
        } });
      }
      if (url.pathname === "/api/auth/register") {
        return route.fulfill({ headers, status: 202, json: { verification_required: true } });
      }
      if (url.pathname === "/api/auth/verify-email") {
        return route.fulfill({ headers, json: { verified: true, next: "/account.html?from=verified" } });
      }
      if (url.pathname === "/api/auth/me") {
        if (session.user) {const user={id:1,username:"fixture",status:"active",...session.user};return route.fulfill({headers,json:{user:{...user,staff_access:staffCapabilities(user)}}});}
        if (session.status === 200) return route.fulfill({ headers, contentType: "text/html", body: "<p>Bad gateway</p>" });
        return route.fulfill({ headers, status: session.status, json: {} });
      }
      if(url.pathname==="/api/site-settings")return route.fulfill({headers,json:{settings:{
        announcements_enabled:"true",announcement_title:"Navigation regression",announcement_body:"A long announcement should not cover navigation links.",
        ticker_osiris:"Osiris fixture announcement",ticker_isis:"Isis fixture announcement"
      }}});
      return route.fulfill({ headers, json: { unread_count: 3, settings: {} } });
    });

    const page = await context.newPage();
    try {
      const auth = page.waitForResponse("https://api.ash-fall.com/api/auth/me");
      await page.goto(origin + "/#ecosystem", { waitUntil: "domcontentloaded" });
      await auth;
      const nav = page.getByRole("navigation", { name: "Primary navigation" });
      const toggle = page.getByRole("button", { name: "Open navigation" });
      const ticker=page.locator("#kf-shared-announcement");
      await ticker.waitFor({state:"visible"});
      if (mobile) {
        await toggle.click();
        await ticker.waitFor({state:"hidden"});
        assert.equal(await page.locator("body").evaluate(body => body.classList.contains("kf-navigation-open")), true,
          "Opening the mobile menu must lock background page scrolling");
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("body").evaluate(body => body.classList.contains("kf-navigation-open")), false,
          "Escape must restore normal page scrolling");
        await ticker.waitFor({state:"visible"});
        await page.getByRole("button", { name: "Open navigation" }).click();
        await ticker.waitFor({state:"hidden"});
      }
      await nav.waitFor();
      assert.equal(await page.getByRole("link", { name: "Knightfall home" }).getAttribute("aria-current"), "page");
      assert.equal(await nav.getByRole("link", { name: "Explore", exact: true }).count(), 0);

      const community = nav.locator("summary").filter({ hasText: "Community" });
      await community.click();
      const forum = nav.getByRole("link", { name: "Forums" });
      await forum.waitFor();
      await page.waitForFunction(()=>document.querySelector(".kf-header")?.dataset.kfMenuActive==="true");
      const geometry=await nav.evaluate(node=>{
        const header=node.parentElement,ticker=header.querySelector(".kf-leadership-ticker");
        const group=node.querySelector(".kf-nav-group[open]");
        const menu=group.querySelector(".kf-nav-menu");
        const scrollBox=node.classList.contains("open")?node:menu;
        const rect=scrollBox.getBoundingClientRect(),visual=window.visualViewport;
        return {navZ:Number(getComputedStyle(node).zIndex),tickerZ:Number(getComputedStyle(ticker).zIndex),
          bottom:rect.bottom,viewportBottom:(visual?.offsetTop||0)+(visual?.height||innerHeight),
          overflow:getComputedStyle(scrollBox).overflowY,paused:getComputedStyle(ticker.querySelector(".kf-ticker-track")).animationPlayState};
      });
      assert.ok(geometry.navZ>geometry.tickerZ,"Dropdown must paint above ticker");
      assert.ok(geometry.bottom<=geometry.viewportBottom+2,"Navigation scroll area must fit viewport");
      assert.equal(geometry.overflow,"auto","Navigation must scroll to reach every link");
      assert.equal(geometry.paused,"paused","Ticker motion must pause during navigation");
      assert.equal(await nav.getByRole("link", { name: "Member Directory" }).count(), 1);
      await forum.focus();
      await page.keyboard.press("Escape");
      assert.ok(await community.evaluate(el => el === document.activeElement));
      assert.equal(await forum.isVisible(), false);

      const account = nav.locator("summary").filter({ hasText: "My Account" });
      const staff = nav.locator(".kf-staff-group > summary");
      if (session.user) {
        await account.waitFor();
        assert.equal(await nav.getByRole("link", { name: /^(?:Messages|Chaosphere)$/ }).count(), 1);
        await account.click();
        await nav.getByRole("link", { name: /Notifications.*3/ }).waitFor();
        const foundry = nav.getByRole("link", { name: "Foundry", exact: true });
        const rights=staffCapabilities({status:"active",...session.user});
        assert.equal(await foundry.count(),rights.can_create?1:0,"Foundry entrance follows Worker permissions");
        if(rights.can_create)assert.equal(await foundry.getAttribute("href"),"/devil-tools.html");
        assert.equal(await page.locator("[data-kf-access=can_create]").first().isVisible(),rights.can_create);
        assert.equal(await nav.locator(".kf-handoff-link").isVisible(),rights.can_handoff);
        const admin = ["admin", "god"].includes(session.user.role);
        // Digital Creators still have server-authorized workshop access; they no longer need a duplicate Staff menu.
        const isStaff = admin || session.name === "moderator";
        assert.equal(await staff.isVisible(), isStaff);
        if (isStaff) {
          await staff.click();
          assert.equal(await nav.getByRole("link", { name: "Moderation" }).isVisible(), admin || session.name === "moderator");
          assert.equal(await nav.locator(".kf-god-eye-link").isVisible(),rights.can_eye_of_horus);
          await nav.getByRole("link", { name: "Settings & Tools" }).waitFor({ state: "hidden" });
          assert.equal(await nav.getByRole("link", { name: "Admin Dashboard" }).isVisible(), admin);
          if (admin) {
            await page.goto(origin + "/admin.html#master-task-list");
            const taskList = page.locator("#master-task-list[open]");
            await page.locator("#staff-controls").waitFor({state:"visible"});
            if(rights.can_read_handoff)await taskList.waitFor();
            else assert.equal(await page.locator("#master-task-list").isVisible(),false);
            const search = page.getByRole("textbox", { name: "Find a tool" }).or(page.getByRole("searchbox", { name: "Find a tool" }));
            await search.fill("Deleted Vault");
            assert.equal(await page.locator("[data-god-vault-tab]").isVisible(),rights.can_eye_of_horus);
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
        assert.equal(await page.locator("[data-kf-access=can_create]").first().isVisible(),false);
      }
      const size = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]);
      assert.ok(size[1] <= size[0] + 3, "Page overflows viewport: " + size);
      if (session.name === "guest") {
        await page.goto(origin + "/homepage.html?source=legacy#memorial");
        await page.waitForURL(origin + "/?source=legacy#memorial");
        await page.locator("footer.site-footer a[href='/remembering-josh.html']").waitFor();

        const next = "/account.html?from=legacy#account-tools";
        await page.goto(origin + "/index.html?mode=register&next=" + encodeURIComponent(next));
        await page.waitForURL(url => url.pathname === "/auth.html" && url.searchParams.get("next") === next);
        await page.getByRole("heading", { name: "Create a Knightfall account" }).waitFor();
        assert.equal(await page.locator("[data-provider]").count(), 0);
        await page.getByLabel("Display name").fill("Fixture");
        await page.locator("#register-username").fill("fixture");
        await page.getByLabel("Email address").fill("fixture@example.test");
        await page.locator("#register-password").fill("fixture-password");
        await page.getByRole("button", { name: "Create my account" }).click();
        await page.getByText(/Check your email for a verification link/).waitFor();
        assert.equal(new URL(page.url()).pathname, "/auth.html");

        await page.getByRole("tab", { name: "Log in" }).click();
        await page.getByLabel("Username or email").fill("fixture");
        await page.getByLabel("Password", { exact: true }).fill("fixture-password");
        await page.getByRole("button", { name: /Log in to Knightfall/i }).click();
        await page.waitForURL(origin + next);
        await page.goto(origin + "/verify-email.html#token=" + "a".repeat(64));
        await page.getByLabel("Password").fill("fixture-password");
        await page.getByRole("button", { name: "Verify and sign in" }).click();
        await page.waitForURL(origin + "/account.html?from=verified");
      }
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
