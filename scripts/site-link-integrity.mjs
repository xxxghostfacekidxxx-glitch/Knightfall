// Check links that the site publishes directly, not links in vendored games.
// Resolve every static first-party HTML href against files or documented redirects.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public/", import.meta.url));
const redirects = new Map(
  (await readFile(join(root, "_redirects"), "utf8")).split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .map(line => { const [src, dst] = line.split(/\s+/); return [src, dst]; })
);
const deprecatedDiscoveryPaths = new Set([
  "/arcade-30-games", "/arcade-30-games.html",
  "/arcade-card-board", "/arcade-card-board.html",
  "/arcade-vault", "/arcade-vault.html",
  "/homepage", "/homepage.html", "/landing", "/landing.html",
  "/arcade", "/arcade.html", "/games", "/games.html"
]);
const validPath = path => {
  if (path === "/") return existsSync(join(root, "index.html"));
  const resolved = resolve(root, "." + path);
  if (!resolved.startsWith(root + sep)) return false;
  return [resolved, resolved + ".html", join(resolved, "index.html")].some(existsSync);
};
const failures = [];
const files = (await readdir(root, { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.endsWith(".html"))
  .map(entry => entry.name);
let checked = 0;
for (const file of files) {
  const body = (await readFile(join(root, file), "utf8"))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const links = [...body.matchAll(/<a\b([^>]*)>/gi)].map(match =>
    match[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]).filter(Boolean);
  const counts = new Map();
  for (const href of links) {
    if (!href.startsWith("/") || href.startsWith("//") || href.includes("${")) continue;
    const path = href.split(/[?#]/)[0];
    if (!path) continue;
    checked++;
    if (deprecatedDiscoveryPaths.has(path) && file !== "arcade-vault.html")
      failures.push(`${file}: retired directory link ${href}`);
    if (!validPath(path) && !redirects.has(path))
      failures.push(`${file}: missing target ${href}`);
    counts.set(href, (counts.get(href) || 0) + 1);
  }
  // All static same-URL anchors on one page are a duplicate route to the same place.
  for (const [href, count] of counts) {
    if (count > 1) failures.push(`${file}: ${count} repeated static links to ${href}`);
  }
}
console.log(`First-party link audit: ${files.length} HTML pages, ${checked} local anchors.`);
if (failures.length) {
  console.error(failures.slice(0, 100).join("\n"));
  if (failures.length > 100) console.error(`...and ${failures.length - 100} more`);
  process.exitCode = 1;
} else {
  console.log("PASS: no broken or duplicate static links, no links to retired discovery pages.");
}
