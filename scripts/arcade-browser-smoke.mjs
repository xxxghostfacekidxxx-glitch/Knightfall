import { chromium } from "playwright";

const base = process.env.ARCADE_TEST_BASE || "http://127.0.0.1:8765";
const games = [
  { name: "Marshland Marksman", path: "/arcade/hosted/marshland-marksman/index.html", start: "#start", pause: false },
  { name: "Cinder Crossing", path: "/arcade/hosted/cinder-crossing/index.html", start: "#start", pause: true },
  { name: "Afterburn Breakout", path: "/arcade/hosted/afterburn-breakout/index.html", start: "#start", pause: true },
  { name: "Colossus Clash", path: "/arcade/hosted/colossus-clash/index.html", start: "#start", pause: false },
  { name: "Dino Run: Ash-Fall Edition", path: "/arcade/hosted/dino-run/index.html", start: "#btn-start", pause: false },
  { name: "Balloon Pop: Ash-Fall Edition", path: "/arcade/hosted/balloon-pop/index.html", start: "#btn-start", pause: false },
  { name: "Tower of Hanoi: Ash-Fall Edition", path: "/arcade/hosted/hanoi/index.html", start: "#btn-start", pause: false, canvas: false, board: "#board" },
];

const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  for (const game of games) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.stack || error.message));
    const response = await page.goto(base + game.path, { waitUntil: "networkidle", timeout: 30000 });
    if (!response || response.status() !== 200) {
      console.error(`FAIL ${game.name}: page returned ${response?.status() ?? "no response"}`);
      failed = true;
      await page.close();
      continue;
    }
    const canvas = page.locator("canvas").first();
    let pixels = 0;
    let boardVisible = false;
    if (game.canvas === false) {
      const board = page.locator(game.board || "svg").first();
      if (await board.count() < 1) {
        console.error(`FAIL ${game.name}: expected a visible game board`);
        failed = true;
        await page.close();
        continue;
      }
    } else if (await canvas.count() !== 1) {
      console.error(`FAIL ${game.name}: expected exactly one game canvas`);
      failed = true;
      await page.close();
      continue;
    }
    await page.locator(game.start).click();
    await page.waitForTimeout(350);
    if (game.canvas === false) {
      boardVisible = await page.locator(game.board || "svg").first().isVisible();
      if (!boardVisible) {
        console.error(`FAIL ${game.name}: game board is not visible after starting`);
        failed = true;
      }
    } else {
      pixels = await canvas.evaluate(el => {
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
    if (!errors.length && (game.canvas === false ? boardVisible : pixels >= 1000)) console.log(`PASS ${game.name}: mobile viewport, start interaction, ${game.canvas === false ? "visible SVG board" : "rendered canvas"}${game.pause ? ", pause/resume" : ""}`);
    await page.close();
  }

  // Exercise account score submission on a real bridged game page using a fake API.
  // No score data is written to an actual user account.
  const bridgePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await bridgePage.addInitScript(() => {
    window.__bridgeTestScores = [];
    window.AshFallArcade = {
      ready: Promise.resolve(),
      user: { id: "browser-smoke-test" },
      loadProgress: async () => ({ bestScore: 5 }),
      recordScore: async (gameId, score, meta) => {
        window.__bridgeTestScores.push({ gameId, score, meta });
        return { saved: true };
      }
    };
  });
  const bridgeResponse = await bridgePage.goto(base + "/arcade/hosted/hexa-havoc/index.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!bridgeResponse || bridgeResponse.status() !== 200) {
    console.error("FAIL account bridge: could not open the bridge test game");
    failed = true;
  } else {
    await bridgePage.locator("canvas").first().click({ position: { x: 20, y: 20 } });
    await bridgePage.evaluate(() => {
      const score = document.querySelector("#score");
      if (score) score.textContent = "42";
      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.id = "bridge-test-overlay";
      overlay.style.cssText = "display:block;position:fixed;inset:0;z-index:999999;background:#000;color:#fff";
      overlay.textContent = "Game Over";
      document.body.appendChild(overlay);
    });
    await bridgePage.waitForFunction(() => window.__bridgeTestScores.length === 1, null, { timeout: 4000 });
    const bridgeRecord = await bridgePage.evaluate(() => window.__bridgeTestScores[0]);
    if (bridgeRecord.gameId !== "cabinet-hexa-havoc" || bridgeRecord.score !== 42) {
      console.error("FAIL account bridge: submitted score did not match the ended run");
      failed = true;
    } else {
      console.log("PASS account bridge: detects game over and submits the correct score to the account API");
    }
  }
  await bridgePage.close();

  // Crawl every playable cabinet linked by the catalog. This catches dead routes and
  // page-start exceptions before the owner has to manually test the entire collection.
  const catalogPage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const catalogResponse = await catalogPage.goto(base + "/arcade-30-games.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!catalogResponse || catalogResponse.status() !== 200) {
    console.error("FAIL catalog crawl: catalog page did not return HTTP 200");
    failed = true;
  } else {
    const catalogRoutes = await catalogPage.locator('#grid article.game a[href^="/arcade/hosted/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))] );
    const mainResponse = await catalogPage.goto(base + "/chaos-cartridge.html", { waitUntil: "domcontentloaded", timeout: 30000 });
    let mainRoutes = [];
    if (!mainResponse || mainResponse.status() !== 200) {
      console.error("FAIL main arcade crawl: main shelf did not return HTTP 200");
      failed = true;
    } else {
      mainRoutes = await catalogPage.locator('.cartridge-shelf a[href^="/arcade/hosted/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))] );
    }
    const routes = [...new Set([...catalogRoutes, ...mainRoutes])];
    console.log(`INFO arcade crawl: checking ${routes.length} locally hosted game routes`);
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
      console.error("FAIL arcade route crawl:\n" + routeFailures.join("\n"));
      failed = true;
    } else {
      console.log(`PASS arcade route crawl: all ${routes.length} local game pages returned HTTP 200 with titles and no uncaught browser exceptions`);
    }
  }
  await catalogPage.close();
} finally {
  await browser.close();
}
if (failed) process.exit(1);
