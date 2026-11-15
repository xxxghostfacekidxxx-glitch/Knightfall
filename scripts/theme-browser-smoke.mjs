import assert from "node:assert/strict";
import { chromium } from "playwright";

// Public-only browser smoke: inspect real computed styles and navigation
// without requiring credentials or modifying game canvases/member themes.
const base = process.env.THEME_TEST_BASE || "http://127.0.0.1:8765";
const routes = [
  "/", "/auth.html", "/community.html",
  "/messages.html", "/devil-tools.html", "/chaos-cartridge.html"
];
const viewports = [
  { width: 390, height: 844, isMobile: true },
  { width: 1366, height: 900, isMobile: false }
];
const browser = await chromium.launch({ headless: true });
let count = 0;
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.isMobile,
      deviceScaleFactor: 1
    });
    try {
      for (const route of routes) {
        const page = await context.newPage();
        try {
          const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 30000 });
          assert.ok(response && response.ok(), route + " HTTP status must be successful");
          await page.waitForSelector(".kf-header .kf-brand", { timeout: 15000 });
          await page.waitForFunction(() => {
            const body = document.body;
            return !!document.querySelector('link[data-knightfall-unified-theme]') &&
              !!body && getComputedStyle(body).backgroundColor === "rgb(13, 16, 19)";
          }, null, { timeout: 15000 });
          const state = await page.evaluate(() => {
            const color = selector => {
              const node = document.querySelector(selector);
              return node ? getComputedStyle(node).color : null;
            };
            const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')]
              .map(node => node.getAttribute("href") || "");
            return {
              client: document.documentElement.clientWidth,
              scroll: document.documentElement.scrollWidth,
              brand: color(".kf-brand"),
              header: !!document.querySelector(".kf-header"),
              oldEmergency: !!document.querySelector("#kf-nav-emergency-css"),
              oldTakeover: document.body.classList.contains("gravewave-everywhere") ||
                !!document.querySelector(".gw-character-crew,.gw-ambient,.gw-panel-mascot"),
              stylesheets: sheets,
              arcadeAccent: color(".cartridge-hero h1 span")
            };
          });
          const label = route + " / " + viewport.width + "px";
          assert.ok(state.header, label + " has shared navigation");
          assert.equal(state.brand, "rgb(236, 225, 211)", label + " uses bone-colored branding");
          assert.ok(state.scroll <= state.client + 1,
            label + " must not overflow horizontally: " + JSON.stringify(state));
          assert.equal(state.oldEmergency, false, label + " must not mount legacy emergency chrome");
          if (route === "/auth.html" || route === "/community.html") {
            assert.equal(state.oldTakeover, false, label + " must not inject Gravewave overlay");
            assert.ok(!state.stylesheets.some(sheet => sheet.includes("gravewave-takeover")),
              label + " must not load retired stylesheet");
          }
          if (route === "/devil-tools.html") {
            assert.ok(!state.stylesheets.some(sheet => sheet.includes("arcade-polish.css")),
              label + " must not load game-only neon stylesheet");
          }
          if (route === "/chaos-cartridge.html") {
            assert.ok(!state.stylesheets.some(sheet => sheet.includes("chaos-cartridge-theme.css")),
              label + " hub must not load per-game skins");
            assert.equal(state.arcadeAccent, "rgb(199, 167, 124)",
              label + " header accent must use antique bronze");
          }
          if (route === "/" && viewport.isMobile) {
            const toggle = page.locator(".kf-nav-toggle");
            await toggle.click();
            const nav = await page.locator(".kf-nav").evaluate(node => {
              const r = node.getBoundingClientRect();
              return { display: getComputedStyle(node).display,
                left: r.left, right: r.right, expanded: node.parentElement.querySelector(".kf-nav-toggle")?.getAttribute("aria-expanded") };
            });
            assert.equal(nav.expanded, "true", "Mobile menu must open on tap");
            assert.equal(nav.display, "grid", "Mobile menu must be visible");
            assert.ok(nav.left >= -1 && nav.right <= viewport.width + 1, "Mobile menu must fit viewport");
            await toggle.click();
            assert.equal(await toggle.getAttribute("aria-expanded"), "false",
              "Mobile menu must close on second tap");
          }
          count++;
          console.log("PASS Gothic Creator " + label);
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  }
  console.log("Gothic Creator browser smoke passed on " + count + " route/viewport combinations.");
} finally {
  await browser.close();
}
