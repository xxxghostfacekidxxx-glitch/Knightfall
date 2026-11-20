import assert from "node:assert/strict";
import { chromium } from "playwright";

// Public-only browser smoke: inspect real computed styles and navigation
// without requiring credentials or modifying game canvases/member themes.
const base = process.env.THEME_TEST_BASE || "http://127.0.0.1:8765";
const routes = [
  "/", "/auth.html", "/community.html", "/members.html",
  "/shops.html", "/support.html", "/memo-pad.html",
  "/messages.html", "/devil-tools.html", "/chaos-cartridge.html"
];
const realmArtwork = {
  "/": "black-sun-temple.svg",
  "/community.html": "realm-madhouse.svg",
  "/members.html": "realm-members.svg",
  "/shops.html": "realm-market.svg",
  "/messages.html": "realm-messages.svg",
  "/devil-tools.html": "realm-foundry.svg",
  "/chaos-cartridge.html": "realm-arcade.svg"
};
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
            return !!document.querySelector('link[data-kf-canonical-theme]') &&
              !!body && body.dataset.kfTheme === "cathedral" &&
              getComputedStyle(body).backgroundColor === "rgb(9, 10, 11)";
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
          assert.equal(state.brand, "rgb(247, 228, 201)", label + " uses gilded Black Sun branding");
          assert.ok(state.scroll <= state.client + 1,
            label + " must not overflow horizontally: " + JSON.stringify(state));
          assert.equal(state.oldEmergency, false, label + " must not mount legacy emergency chrome");
          assert.equal(state.stylesheets.filter(sheet => sheet.includes("/theme.css")).length,1,
             label + " must mount exactly one canonical Knightfall stylesheet");
          await page.waitForFunction(() => document.body?.dataset.kfTheme === "cathedral" && !!window.KnightfallThemeCrew, null, {timeout: 15000});
          const crewCascade = await page.evaluate(() => {
            const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
            const shared = links.filter(node => new URL(node.href).pathname === "/theme.css");
            return {
              final: shared.at(-1)?.href || "",
              count: shared.length,
              imported: [...document.styleSheets].some(sheet=>{try{return [...sheet.cssRules].some(rule=>String(rule.href||"").includes("/knightfall-requiem.css"))}catch{return false}}),
              activeTheme: document.body.dataset.kfTheme
            };
          });
          assert.match(crewCascade.final,/\/theme\.css/,label + " must load one canonical root");
          assert.ok(crewCascade.imported,label + " must import the Black Sun Temple artwork");
          assert.equal(crewCascade.count,1,label + " must not inject duplicate Theme Crew CSS links");
          assert.equal(crewCascade.activeTheme,"cathedral",label + " must default to the approved Egyptian Black Sun identity");

          if (realmArtwork[route]) {
            const expected = realmArtwork[route];
            const selector = route === "/" ? ".home-intro" : "[data-kf-art-hero]";
            await page.waitForSelector(selector, {timeout: 10000});
            const background = await page.locator(selector).evaluate(node => getComputedStyle(node).backgroundImage);
            assert.ok(background.includes(expected),
              label + " must render original artwork " + expected + "; found " + background);
            assert.ok(state.stylesheets.some(sheet => sheet.includes("/theme.css")),
              label + " must mount the canonical artwork layer");
          }
          if (route === "/auth.html") {
            await page.waitForFunction(() => {
              const layout = document.querySelector(".entry-layout");
              return document.body.dataset.kfRealm === "members" && layout &&
                getComputedStyle(layout, "::before").backgroundImage.includes("realm-members.svg");
            }, null, {timeout: 12000});
            const authVisual = await page.evaluate(() => ({
              artwork: getComputedStyle(document.querySelector(".entry-layout"), "::before").backgroundImage,
              brand: document.getElementById("auth-title")?.textContent || ""
            }));
            assert.match(authVisual.artwork,/gothic-chrome-frame\.svg/,
              label + " must display decorative metal frame behind real auth form");
            assert.match(authVisual.brand,/Knightfall/,
              label + " must use current Knightfall identity");
          }
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
            assert.equal(await page.locator("body").evaluate(node => node.classList.contains("chaos-glitch-arcade")),false,
              label + " arcade hub must not activate the game-only CRT skin");
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
