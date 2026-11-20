import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.PWA_TEST_BASE || "http://127.0.0.1:8765";
const browser = await chromium.launch({ headless: true });
const pages = ["/", "/privacy.html", "/account-deletion.html", "/offline.html"];
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
  await page.goto(base + "/", { waitUntil: "load" });
  // Actual computed-browser verification of the approved Black Sun Temple site style.
  await page.waitForFunction(() =>
    document.body.dataset.kfTheme === "cathedral" &&
    document.body.dataset.kfRealm === "home" &&
    getComputedStyle(document.documentElement).getPropertyValue("--kf-bone").trim()==="#ece1d3",
    null, { timeout: 8000 }
  );
  const gothic = await page.evaluate(() => {
    const brand=document.querySelector(".kf-brand");
    return {
      ink:getComputedStyle(document.body).backgroundColor,
      bone:getComputedStyle(document.documentElement).getPropertyValue("--kf-bone").trim(),
      crimson:getComputedStyle(document.documentElement).getPropertyValue("--kf-oxblood").trim(),
      bronze:getComputedStyle(document.documentElement).getPropertyValue("--kf-antique-gold").trim(),
      crest:brand?getComputedStyle(brand,"::before").backgroundImage:"",
      backdrop:getComputedStyle(document.body).backgroundImage,
      hero:getComputedStyle(document.querySelector(".home-intro")).backgroundImage,
      poster:((image)=>({src:image?.currentSrc||"",width:image?.naturalWidth||0,alt:image?.alt||""}))(document.querySelector(".kf-black-sun-art img")),
      cartouche:getComputedStyle(document.querySelector(".home-intro"),"::after").backgroundImage,
      canonicalSheets:[...document.querySelectorAll('link[rel="stylesheet"]')]
        .filter(node=>new URL(node.href).pathname==="/theme.css").length,
      floatingMascots:document.querySelectorAll(".gw-character-crew,.gw-ambient,.kf-gravewave-ribbon").length
    };
  });
  // Requiem superseded the older deep-stone canvas. The separate theme browser
  // suite independently verifies this same midnight shade.
  assert.equal(gothic.ink,"rgb(9, 10, 11)","Black Sun homepage must use deep obsidian canvas");
  assert.match(gothic.backdrop,/royal-cartouche\.svg/,"Black Sun background decoration must be visible");
  assert.match(gothic.hero,/black-sun-mobile\.svg/,"Mobile fallback must retain Egyptian temple artwork");
  assert.match(gothic.poster.src,/black-sun-hero-illustration\.webp/,"Original Egyptian image must be served locally");
  assert.equal(gothic.poster.width,1200,"Optimized artwork must load before verification");
  assert.match(gothic.poster.alt,/Anubis guardians/,"Poster must have descriptive alt text");
  assert.match(gothic.cartouche,/royal-cartouche\.svg/,"Hero must mount the unobtrusive Egyptian cartouche");
  assert.equal(gothic.canonicalSheets,1,"Only one canonical theme stylesheet may load");
  assert.equal(gothic.bone,"#ece1d3");
  assert.equal(gothic.crimson,"#b25b68");
  assert.equal(gothic.bronze,"#c7a77c");
  assert.match(gothic.crest,/eye-of-chaos-crest\.svg/,"New Egyptian Eye of Chaos crest must be live");
  assert.equal(gothic.floatingMascots,0,"Older Gravewave decorations must not cover site controls");
  assert.equal(await page.locator('link[rel="manifest"]').getAttribute("href"), "/manifest.webmanifest");
  const manifestResponse = await page.request.get(base + "/manifest.webmanifest");
  assert.equal(manifestResponse.status(), 200);
  const manifest = await manifestResponse.json();
  assert.ok(manifest.name && manifest.start_url === "/?source=pwa" && manifest.scope === "/");
  assert.ok(manifest.icons.some(icon => icon.src === "/icons/knightfall-crest-maskable.png" && String(icon.purpose).includes("maskable")));
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
            // The approved Gothic theme deliberately uses warm bone and bronze.
            // Reject retired rust/orange UI tokens instead of any red > green > blue.
            const retiredRgb = new Set([
              "91,48,40","21,16,15","255,155,129","73,65,61",
              "86,48,107","85,59,43","75,56,43","21,17,14","87,67,58"
            ]);
            const colorKey = [red, green, blue].join(",");
            const harshOrange = red >= green + 55 && green >= blue + 15 &&
              green >= 45 && red >= 115 && blue <= 135;
            if (retiredRgb.has(colorKey) || harshOrange) {
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
    assert.match(report.stylesheet, /\/messages\.css\?v=\d{8}-[a-z0-9-]+/i, "Messages must load a versioned CSS asset");
    assert.deepEqual(report.legacy, [], "Legacy rust/orange messaging palette leaked into browser styles");
  }
  console.log("PWA mobile smoke passed: start page, manifest, icons, shortcuts, privacy/deletion/offline pages, and narrow viewport.");
} finally {
  await browser.close();
}
