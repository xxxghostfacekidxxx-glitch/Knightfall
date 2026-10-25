import { chromium } from "playwright";
import { readdir } from "node:fs/promises";
import path from "node:path";

const base = process.env.ARCADE_TEST_BASE || "http://127.0.0.1:8765";
const hostedRoot = path.resolve("public/arcade/hosted");

async function listHostedHtml(dir = hostedRoot) {
  const routes = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) routes.push(...await listHostedHtml(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      routes.push("/" + path.relative("public", full).split(path.sep).join("/"));
    }
  }
  return routes;
}
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
    await bridgePage.waitForSelector(".af-report", { timeout: 4000 });
    const reportHref = await bridgePage.locator(".af-report").getAttribute("href");
    const reportUrl = new URL(reportHref);
    const reportBody = reportUrl.searchParams.get("body") || "";
    if (!reportUrl.searchParams.get("title")?.includes("Hexa Havoc") || !reportBody.includes("/arcade/hosted/hexa-havoc/index.html") || !reportBody.includes("Steps to reproduce:") || !reportBody.includes("Device/browser")) {
      console.error("FAIL account bridge: issue report is missing game/page/reproduction context");
      failed = true;
    } else {
      console.log("PASS account bridge: issue report includes game, page, reproduction prompts, and browser context");
    }
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
      await bridgePage.waitForTimeout(900);
      const repeatedScores = await bridgePage.evaluate(() => window.__bridgeTestScores.length);
      if (repeatedScores !== 1) {
        console.error("FAIL account bridge: the same game-over state submitted the score " + repeatedScores + " times");
        failed = true;
      } else {
        console.log("PASS account bridge: persistent game-over state does not duplicate score submissions");
      }
    }
  }
  await bridgePage.close();

  // Verify a cloud save restores actual game state, not just leaderboard metadata.
  const restorePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await restorePage.addInitScript(() => {
    window.AshFallArcade = {
      ready: Promise.resolve(),
      user: { id: "browser-smoke-test" },
      loadProgress: async gameId => gameId === "cabinet-last-ember" ? ({
        bestScore: 11,
        serialized: {
          wood: 27, scrap: 6, food: 4, warm: 82, people: 2, day: 4,
          shelter: 1, alive: true, log: [{ msg: "Restored from cloud save", event: true }]
        }
      }) : null,
      saveProgress: async () => ({ revision: 2 }),
      recordScore: async () => ({ saved: true })
    };
  });
  const restoreResponse = await restorePage.goto(base + "/arcade/hosted/last-ember/index.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!restoreResponse || restoreResponse.status() !== 200) {
    console.error("FAIL cloud save restore: could not open Last Ember");
    failed = true;
  } else {
    try {
      await restorePage.waitForFunction(() =>
        document.querySelector("#wood")?.textContent === "27" &&
        document.querySelector("#day")?.textContent === "4" &&
        document.querySelector("#story")?.textContent.includes("Restored from cloud save"),
      null, { timeout: 5000 });
      const localCopy = await restorePage.evaluate(() => JSON.parse(localStorage.getItem("last-ember-save-v1") || "null"));
      if (!localCopy || localCopy.wood !== 27 || localCopy.day !== 4) {
        console.error("FAIL cloud save restore: restored state was not persisted locally");
        failed = true;
      } else {
        console.log("PASS cloud save restore: Last Ember restores remote resources/day/journal and updates local save");
      }
    } catch {
      console.error("FAIL cloud save restore: remote game state did not appear in the UI");
      failed = true;
    }
  }
  await restorePage.close();

  // Verify cloud restore for the city builder and turn-based board game.
  const cabinetRestoreCases = [
    {
      name: "Ashen Blocks",
      path: "/arcade/hosted/ashen-blocks/index.html",
      gameId: "cabinet-ashen-blocks",
      saved: {
        bestScore: 0,
        serialized: {
          grid: Array.from({ length: 9 }, (_, y) => Array.from({ length: 12 }, (_, x) => (y === 4 && x < 4) ? "road" : "empty")),
          tool: "road", money: 845, day: 7, pop: 0, happy: 50
        }
      },
      check: () => document.querySelector("#money")?.textContent === "$845" && document.querySelector("#day")?.textContent === "7"
    },
    {
      name: "Connect Four",
      path: "/arcade/hosted/connect-four/index.html",
      gameId: "cabinet-connect-four",
      saved: {
        serialized: {
          board: Array.from({ length: 6 }, (_, y) => Array.from({ length: 7 }, (_, x) => y === 5 && x === 3 ? 1 : y === 5 && x === 4 ? 2 : 0)),
          history: []
        }
      },
      check: () => document.querySelectorAll("#board .p1").length === 1 && document.querySelectorAll("#board .p2").length === 1
    }
  ];
  for (const testCase of cabinetRestoreCases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await page.addInitScript(save => {
      window.AshFallArcade = {
        ready: Promise.resolve(),
        user: { id: "browser-smoke-test" },
        loadProgress: async gameId => gameId === save.gameId ? save.data : null,
        saveProgress: async () => ({ revision: 2 }),
        recordScore: async () => ({ saved: true })
      };
    }, { gameId: testCase.gameId, data: testCase.saved });
    const response = await page.goto(base + testCase.path, { waitUntil: "domcontentloaded", timeout: 30000 });
    try {
      if (!response || response.status() !== 200) throw new Error("page did not return HTTP 200");
      await page.waitForFunction(testCase.check, null, { timeout: 5000 });
      console.log("PASS cloud save restore: " + testCase.name + " restores saved game state");
    } catch (error) {
      console.error("FAIL cloud save restore: " + testCase.name + ": " + (error?.message || String(error)));
      failed = true;
    } finally {
      await page.close();
    }
  }

  // Audit every account-bridge manifest entry for a matching hosted page and bridge config.
  const manifestPage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const manifestResponse = await manifestPage.goto(base + "/arcade/hosted/account-bridge-manifest.json", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!manifestResponse || manifestResponse.status() !== 200) {
    console.error("FAIL account bridge manifest: could not fetch manifest");
    failed = true;
  } else {
    const manifest = await manifestResponse.json();
    const bridgeEntries = Array.isArray(manifest.games) ? manifest.games : [];
    const manifestProblems = [];
    for (const game of bridgeEntries) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      try {
        const response = await page.goto(base + game.path, { waitUntil: "domcontentloaded", timeout: 20000 });
        if (!response || response.status() !== 200) manifestProblems.push(game.gameId + ": page not reachable");
        const script = page.locator('script[src*="arcade-account-bridge.js"]').first();
        if (await script.count() !== 1) manifestProblems.push(game.gameId + ": expected exactly one account bridge script");
        else {
          const config = await script.evaluate(el => ({ gameId: el.dataset.gameId, scoreMode: el.dataset.scoreMode || "score" }));
          if (config.gameId !== game.gameId) manifestProblems.push(game.gameId + ": script game ID does not match manifest");
          if (!["score", "completion", "moves", "wave"].includes(config.scoreMode)) manifestProblems.push(game.gameId + ": unsupported score mode " + config.scoreMode);
        }
        const reports = page.locator(".af-report");
        await reports.waitFor({ state: "attached", timeout: 4000 }).catch(() => {});
        if (await reports.count() !== 1) manifestProblems.push(game.gameId + ": expected exactly one issue-report link");
      } catch (error) {
        manifestProblems.push(game.gameId + ": " + (error?.message || String(error)));
      } finally {
        await page.close();
      }
    }
    if (manifestProblems.length) {
      console.error("FAIL account bridge manifest audit: " + manifestProblems.slice(0, 15).join(" | "));
      failed = true;
    } else {
      console.log("PASS account bridge manifest: " + bridgeEntries.length + " games have matching page config and one issue-report link");
    }
  }

  await manifestPage.close();

  // Crawl every playable cabinet linked by the catalog. This catches dead routes and
  // page-start exceptions before the owner has to manually test the entire collection.
  const catalogPage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const catalogResponse = await catalogPage.goto(base + "/arcade-30-games.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!catalogResponse || catalogResponse.status() !== 200) {
    console.error("FAIL catalog crawl: catalog page did not return HTTP 200");
    failed = true;
  } else {
    const catalogCardCount = await catalogPage.locator("#grid article.game").count();
    if (catalogCardCount !== 76) {
      console.error("FAIL catalog count: expected 76 playable cards, found " + catalogCardCount);
      failed = true;
    } else {
      console.log("PASS catalog count: all 76 playable game cards are present");
    }
    const catalogRoutes = await catalogPage.locator('#grid article.game a[href^="/arcade/hosted/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))] );
    const mainResponse = await catalogPage.goto(base + "/chaos-cartridge.html", { waitUntil: "domcontentloaded", timeout: 30000 });
    let mainRoutes = [];
    if (!mainResponse || mainResponse.status() !== 200) {
      console.error("FAIL main arcade crawl: main shelf did not return HTTP 200");
      failed = true;
    } else {
      mainRoutes = await catalogPage.locator('.cartridge-shelf a[href^="/arcade/hosted/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))] );
      const featuredCount = await catalogPage.locator("#game-shelf .cartridge-shelf > .cartridge-cabinet:visible").count();
      const viewAll = catalogPage.locator("#game-shelf .arcade-view-all a[href='/arcade-30-games.html']");
      if (featuredCount !== 30) {
        console.error("FAIL featured shelf: expected 30 visible cards, found " + featuredCount);
        failed = true;
      } else if (!(await viewAll.count())) {
        console.error("FAIL featured shelf: missing View all 76 games link");
        failed = true;
      } else {
        console.log("PASS featured shelf: 30 cards and a direct link to the full catalog");
      }
    }
    const localHostedRoutes = await listHostedHtml();
    const routes = [...new Set([...catalogRoutes, ...mainRoutes, ...localHostedRoutes])];
    console.log(`INFO arcade crawl: checking ${routes.length} locally hosted game routes`);
    const routeFailures = [];
    for (const route of routes) {
      const errors = [];
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on("pageerror", error => errors.push(error.stack || error.message));
      if (route.includes("/hextris/")) {
        await page.addInitScript(() => {
          window.__routeErrorDetails = [];
          window.addEventListener("error", event => window.__routeErrorDetails.push({
            message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno,
            stack: event.error && event.error.stack
          }));
        });
      }
      try {
        const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 20000 });
        if (!response || response.status() !== 200) routeFailures.push(`${route}: HTTP ${response?.status() ?? "no response"}`);
        else if (!(await page.title()).trim()) routeFailures.push(`${route}: missing document title`);
        await page.waitForTimeout(100);
        const bridgeScriptCount = await page.locator('script[src*="arcade-account-bridge.js"]').count();
        if (bridgeScriptCount) {
          const nav = page.locator(".af-arcade-nav");
          if (!(await nav.count()) || !(await nav.isVisible())) {
            routeFailures.push(`${route}: account-bridged game is missing the Ash-Fall navigation shell`);
          } else {
            const links = await nav.locator("a").evaluateAll(nodes => nodes.map(node => node.getAttribute("href")));
            if (!links.includes("/chaos-cartridge.html") || !links.includes("/arcade-30-games.html") || !links.includes("/arcade/arcade-license-guide.html")) {
              routeFailures.push(`${route}: Ash-Fall navigation shell is missing arcade or license navigation links`);
            }
          }
        }
        if (route.includes("/hextris/")) {
          const details = await page.evaluate(() => window.__routeErrorDetails || []);
          if (details.length) routeFailures.push(`${route}: error details ${JSON.stringify(details)}`);
        }
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
