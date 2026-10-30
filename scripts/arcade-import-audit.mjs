#!/usr/bin/env node
// Chaos Cartridge import audit. Run: node scripts/arcade-import-audit.mjs
// This checks static packaging, not whether a game is fun or playable in a browser.
import { readFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = await readFile(resolve(root, "public/arcade-30-games.html"), "utf8");
const entries = [...catalog.matchAll(/<article\b[^>]*class="game"[^>]*>([\s\S]*?)<\/article>/g)];
const errors = [];
const warnings = [];
const seen = new Set();
for (const [index, match] of entries.entries()) {
  const block = match[1];
  const title = block.match(/<h2>(.*?)<\/h2>/)?.[1] ?? `Cabinet ${index + 1}`;
  const play = block.match(/<a\b[^>]*class="play"[^>]*href="([^"]+)"/)?.[1];
  if (!play) { errors.push(`${title}: missing play link`); continue; }
  if(play.startsWith("https://")){if(!/data-collection="external"/.test(match[0]))errors.push(`${title}: external launch must be labeled external`);continue;}
  const launchPath = play.split("?")[0].split("#")[0];
  if (!launchPath.startsWith("/") || launchPath.startsWith("//") || !launchPath.endsWith(".html")) {
    errors.push(`${title}: launch must point to a locally hosted HTML file (${play})`);
    continue;
  }
  if (seen.has(play)) warnings.push(`${title}: shares launch URL ${play}`);
  seen.add(play);
  const path = resolve(root, "public", launchPath.slice(1));
  try { await access(path); } catch { errors.push(`${title}: missing ${play}`); }
  const isOriginal = !/OPEN SOURCE|Complete modified source|Original source/i.test(block);
  if (!isOriginal) {
    const directory = dirname(path);
    const candidates = ["LICENSE", "LICENSE.txt", "LICENSE.md", "SOURCE.md", "NOTICE", "NOTICE.md"];
    let found = false;
    for (const filename of candidates) {
      try { await access(resolve(directory, filename)); found = true; break; } catch {}
    }
    if (!found) warnings.push(`${title}: no local license/source record beside game; review manually`);
  }
}
if (!entries.length) errors.push("No arcade catalog entries found");
console.log(`Chaos Cartridge import audit: ${entries.length} entries, ${seen.size} unique local launch URLs`);
for (const warning of warnings) console.warn("WARN:", warning);
for (const error of errors) console.error("FAIL:", error);
console.log("Reminder: an import may require upstream copyright/license retention even when the site removes outbound source links.");
console.log("This audit does not validate runtime controls, originality, assets, or license compatibility.");
if (errors.length) process.exitCode = 1;
