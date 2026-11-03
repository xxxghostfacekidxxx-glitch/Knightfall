import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.PWA_TEST_BASE || "http://127.0.0.1:8765";
const browser = await chromium.launch({ headless: true });
const pages = ["/homepage.html", "/privacy.html", "/account-deletion.html", "/offline.html"];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  for (const path of pages) {
    const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200, path + " should return HTTP 200");
    assert.ok(await page.locator("h1").count(), path + " should have a main heading");
    const width = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    if (width.content > width.viewport + 1) {
      const offenders = await page.evaluate(() => [...document.querySelectorAll("*")].map(el => {
        const rect = el.getBoundingClientRect();
        return { tag: el.tagName, id: el.id, className: typeof el.className === "string" ? el.className : "", text: (el.innerText || "").slice(0, 90), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
      }).filter(el => el.right > document.documentElement.clientWidth + 1 || el.left < -1).slice(0, 15));
      assert.ok(width.content <= width.viewport + 1, path + " should not overflow horizontally on a 390px viewport. Offenders: " + JSON.stringify(offenders));
    }
  }
  await page.goto(base + "/homepage.html", { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator('link[rel="manifest"]').getAttribute("href"), "/manifest.webmanifest");
  const manifestResponse = await page.request.get(base + "/manifest.webmanifest");
  assert.equal(manifestResponse.status(), 200);
  const manifest = await manifestResponse.json();
  assert.ok(manifest.name && manifest.start_url === "/homepage.html?source=pwa" && manifest.scope === "/");
  assert.ok(manifest.icons.some(icon => icon.src === "/icons/chaos-cartridge-maskable.svg" && icon.purpose === "maskable"));
  for (const icon of manifest.icons) assert.equal((await page.request.get(base + icon.src)).status(), 200, icon.src);
  for (const shortcut of manifest.shortcuts || []) assert.equal((await page.request.get(base + new URL(shortcut.url, base).pathname)).status(), 200, shortcut.url);
  await page.goto(base + "/privacy.html", { waitUntil: "domcontentloaded" });
  assert.ok(await page.locator('a[href="/account-deletion.html"]').count(), "privacy page should link to the deletion URL");
  // Messages are authenticated, but their CSS must remain correct before signing in.
  // Inject visual-only fixtures so no real conversations or private messages are read.
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport);
    const response = await page.goto(base + "/messages.html", { waitUntil: "load" });
    assert.equal(response?.status(), 200, "Messages page must load");
    const report = await page.evaluate(() => {
      document.querySelector("#conversations").innerHTML =
        '<button class="conversation active"><span class="avatar">A</span><span>Test chat</span></button>';
      document.querySelector("#messages").innerHTML =
        '<article class="message mine"><div class="message-meta"><strong>Member</strong></div><p>Test</p><div class="message-reactions"><button class="reaction-add">React</button></div></article>' +
        '<article class="message theirs"><p>Reply</p></article>';
      document.querySelector("#composer").hidden = false;
      document.querySelector(".message-layout").classList.add("show-chat");
      const selectors = [
        ".message-layout", ".conversation-panel", ".conversation.active",
        ".chat-panel", ".chat-head", ".message.mine", ".message.theirs",
        ".composer", ".composer textarea", ".compose-dialog", ".reaction-add",
        ".mobile-inbox-back", ".chat-head button", ".avatar", ".admin-archive",
        ".messages-list", ".inbox-filter.active", ".compose-tab.active",
        ".search", ".message-actions button"
      ];
      const legacy = [];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (!element) continue;
        const style = getComputedStyle(element);
        for (const property of ["backgroundColor", "backgroundImage", "borderColor", "color"]) {
          const value = style[property] || "";
          for (const match of value.matchAll(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/gi)) {
            const [, red, green, blue] = match.map(Number);
            // Old rust/brown surfaces have red > green > blue. Neon pink has blue > green.
            if (red >= green + 6 && green >= blue + 4) {
              legacy.push({ selector, property, color: match[0] });
            }
          }
        }
      }
      return {
        legacy,
        stylesheet: document.querySelector('link[href*="/messages.css"]')?.getAttribute("href") || ""
      };
    });
    assert.match(report.stylesheet, /20261103-gravewave-inbox3/, "Messages must load fresh CSS");
    assert.deepEqual(report.legacy, [], "Warm messaging palette leaked into computed browser styles");
  }
  console.log("PWA mobile smoke passed: start page, manifest, icons, shortcuts, privacy/deletion/offline pages, and narrow viewport.");
} finally {
  await browser.close();
}
