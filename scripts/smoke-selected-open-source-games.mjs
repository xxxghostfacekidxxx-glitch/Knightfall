import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = 18739;
const server = spawn('python3', ['-m', 'http.server', String(port), '--directory', 'public'], {
  stdio: 'ignore'
});
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/arcade-30-games.html`);
      if (res.ok) break;
    } catch {}
    await sleep(250);
    if (i === 39) throw new Error('Local static server did not start');
  }
  browser = await chromium.launch({ headless: true });
  for (const [slug, selector] of [
    ['a-dark-room', '#wrapper'],
    ['evolution-of-trust', '#preloader']
  ]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto(`http://127.0.0.1:${port}/arcade/hosted/${slug}/index.html`, {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    if (!response?.ok()) throw new Error(`${slug}: bad HTTP status ${response?.status()}`);
    await page.locator(selector).first().waitFor({ state: 'attached', timeout: 15000 });
    await page.waitForTimeout(1500);
    if (errors.length) throw new Error(`${slug}: browser errors: ${errors.join(' | ')}`);
    console.log(`${slug}: mobile viewport smoke passed`);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
