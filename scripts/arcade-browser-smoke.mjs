import { chromium } from "playwright";

const base = process.env.ARCADE_TEST_BASE || "http://127.0.0.1:8765";
const games = [
  { name: "Marshland Marksman", path: "/arcade/hosted/marshland-marksman/index.html", start: "#start", pause: false },
  { name: "Cinder Crossing", path: "/arcade/hosted/cinder-crossing/index.html", start: "#start", pause: true },
  { name: "Afterburn Breakout", path: "/arcade/hosted/afterburn-breakout/index.html", start: "#start", pause: true },
  { name: "Colossus Clash", path: "/arcade/hosted/colossus-clash/index.html", start: "#start", pause: false },
  { name: "Dino Run: Ash-Fall Edition", path: "/arcade/hosted/dino-run/index.html", start: "#btn-start", pause: false },
];

const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  for (const game of games) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(base + game.path, { waitUntil: "networkidle", timeout: 30000 });
    if (!response || response.status() !== 200) {
      console.error(`FAIL ${game.name}: page returned ${response?.status() ?? "no response"}`);
      failed = true;
      await page.close();
      continue;
    }
    const canvas = page.locator("canvas").first();
    if (await canvas.count() !== 1) {
      console.error(`FAIL ${game.name}: expected exactly one game canvas`);
      failed = true;
      await page.close();
      continue;
    }
    await page.locator(game.start).click();
    await page.waitForTimeout(350);
    const pixels = await canvas.evaluate(el => {
      const c = el.getContext("2d");
      if (!c) return 0;
      const data = c.getImageData(0, 0, el.width, el.height).data;
      let count = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
      return count;
    });
    if (pixels < 1000) {
      console.error(`FAIL ${game.name}: canvas appears blank after starting (${pixels} painted pixels)`);
      failed = true;
    }
    if (game.pause) {
      const pause = page.locator("#pause");
      await pause.click();
      if (!(await pause.innerText()).toLowerCase().includes("resume")) {
        console.error(`FAIL ${game.name}: pause button did not enter paused state`);
        failed = true;
      }
      await pause.click();
    }
    if (errors.length) {
      console.error(`FAIL ${game.name}: browser errors: ${errors.join(" | ")}`);
      failed = true;
    }
    if (!errors.length && pixels >= 1000) console.log(`PASS ${game.name}: mobile viewport, start interaction, rendered canvas${game.pause ? ", pause/resume" : ""}`);
    await page.close();
  }

  // Crawl every playable cabinet linked by the catalog. This catches dead routes and
  // page-start exceptions before the owner has to manually test the entire collection.
  const catalogPage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const catalogResponse = await catalogPage.goto(base + "/arcade-30-games.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!catalogResponse || catalogResponse.status() !== 200) {
    console.error("FAIL catalog crawl: catalog page did not return HTTP 200");
    failed = true;
  } else {
    const routes = await catalogPage.locator('#grid article.game a[href^="/arcade/hosted/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))] );
    console.log(`INFO catalog crawl: checking ${routes.length} locally hosted game routes`);
    const routeFailures = [];
    for (const route of routes) {
      const errors = [];
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on("pageerror", error => errors.push(error.message));
      try {
        const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 20000 });
        if (!response || response.status() !== 200) routeFailures.push(`${route}: HTTP ${response?.status() ?? "no response"}`);
        else if (!(await page.title()).trim()) routeFailures.push(`${route}: missing document title`);
        await page.waitForTimeout(100);
        if (errors.length) routeFailures.push(`${route}: ${errors.join(" | ")}`);
      } catch (error) {
        routeFailures.push(`${route}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
    if (routeFailures.length) {
      console.error("FAIL catalog route crawl:\n" + routeFailures.join("\n"));
      failed = true;
    } else {
      console.log(`PASS catalog route crawl: all ${routes.length} local game pages returned HTTP 200 with titles and no uncaught browser exceptions`);
    }
  }
  await catalogPage.close();
} finally {
  await browser.close();
}
if (failed) process.exit(1);
