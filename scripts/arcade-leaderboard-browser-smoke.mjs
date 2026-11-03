import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ARCADE_TEST_BASE || "http://127.0.0.1:8765";
const now = "2026-11-01T15:00:00.000Z";
const scores = [
  { game_key: "cursed-circuit", place: 1, player_count: 8, best_score: 95, username: "champ", display_name: "Arcade Queen", is_mine: 0, achieved_at: now },
  { game_key: "cursed-circuit", place: 2, player_count: 8, best_score: 70, username: "two", display_name: "Second Place", is_mine: 0, achieved_at: now },
  { game_key: "cursed-circuit", place: 3, player_count: 8, best_score: 65, username: "three", display_name: "Third Place", is_mine: 0, achieved_at: now },
  { game_key: "cursed-circuit", place: 7, player_count: 8, best_score: 22, username: "viewer", display_name: "You", is_mine: 1, achieved_at: now },
  { game_key: "cabinet-afterburn-breakout", place: 1, player_count: 6, best_score: 980, username: "win", display_name: "<img src=x onerror=alert(1)>", is_mine: 0, achieved_at: now },
  { game_key: "cabinet-afterburn-breakout", place: 2, player_count: 6, best_score: 850, username: "viewer", display_name: "You", is_mine: 1, achieved_at: now },
  { game_key: "cabinet-afterburn-breakout", place: 3, player_count: 6, best_score: 730, username: "third", display_name: "Third", is_mine: 0, achieved_at: now }
];
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://api.ash-fall.com/api/arcade/leaderboards", route =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ viewer_signed_in: true, entries: scores }) }));
    const res = await page.goto(base + "/chaos-cartridge.html", { waitUntil: "domcontentloaded" });
    assert.equal(res?.status(), 200);
    await page.locator("#arcade-leaderboards.arcade-lb-loaded").waitFor({ timeout: 15000 });
    assert.match(await page.locator("#arcade-lb-status").innerText(), /standings loaded/i);
    assert.match(await page.locator("#arcade-lb-records").innerText(), /14/);
    assert.match(await page.locator("#arcade-lb-yours").innerText(), /2 ranked/);
    assert.match(await page.locator("#arcade-lb-podium").innerText(), /Arcade Queen/);
    assert.match(await page.locator("#arcade-lb-duel").innerText(), /Rank #7 of 8/);
    assert.equal(await page.locator("#arcade-leaderboards img").count(), 0, "Names must never create HTML images");
    await page.locator("#arcade-lb-game").selectOption("cabinet-afterburn-breakout");
    assert.match(await page.locator("#arcade-lb-board-title").innerText(), /Shatterpocalypse/i);
    assert.match(await page.locator("#arcade-lb-duel").innerText(), /Rank #2 of 6/);
    assert.match(await page.locator("#arcade-lb-duel").innerText(), /130 points behind/i);
    const layout = await page.locator("#arcade-leaderboards").evaluate(el => ({
      width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right, viewport: document.documentElement.clientWidth
    }));
    assert.ok(layout.right <= layout.viewport + 2, "Leaderboard overflows viewport: " + JSON.stringify(layout));
    assert.deepEqual(errors, [], "Browser JavaScript errors: " + errors.join(", "));
    await page.close();
  }
  for (const [kind, payload, check] of [
    ["guest", { viewer_signed_in: false, entries: scores.map(row => ({ ...row, is_mine: 0 })) }, /Sign in to save your scores/i],
    ["no records", { viewer_signed_in: true, entries: [] }, /No community scores yet/i],
    ["error", null, /Leaderboards are unavailable right now/i]
  ]) {
    const page = await browser.newPage();
    await page.route("https://api.ash-fall.com/api/arcade/leaderboards", route =>
      route.fulfill(payload
        ? { status: 200, contentType: "application/json", body: JSON.stringify(payload) }
        : { status: 503, contentType: "application/json", body: '{"error":"Offline"}' }));
    await page.goto(base + "/chaos-cartridge.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const label = document.querySelector("#arcade-lb-status")?.textContent || "";
      return /standings loaded|No community scores yet|Leaderboards are unavailable/.test(label);
    }, { timeout: 15000 });
    const text = kind === "guest"
      ? await page.locator("#arcade-lb-duel").innerText()
      : await page.locator("#arcade-lb-status").innerText();
    assert.match(text, check, kind + " state");
    if (kind !== "guest") assert.equal(await page.locator("#arcade-lb-podium li").count(), 0);
    await page.close();
  }
  console.log("Chaos Cartridge leaderboard smoke passed: desktop/mobile, score ranking, XSS escaping, guest, empty and error states.");
} finally {
  await browser.close();
}
