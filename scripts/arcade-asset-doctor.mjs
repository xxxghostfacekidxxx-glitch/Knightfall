#!/usr/bin/env node
// Arcade asset doctor. Only deterministic HTML URL repairs; never alters game logic.
import { readdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("public");
const apply = process.argv.includes("--fix");
const findings = [];
let changedFiles = 0, missingAssets = 0, repairs = 0;
const allowed = /\.(?:js|css|png|jpe?g|webp|gif|svg|ico|woff2?|mp3|ogg|wav)$/i;
async function exists(file) { try { await access(file); return true; } catch { return false; } }
function inside(file) { return file.startsWith(root + path.sep); }
function candidate(file, url) {
  if (!url || /^(?:https?:|data:|blob:|\/\/|#)/i.test(url)) return null;
  let pathname;
  try { pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]); } catch { return null; }
  if (!allowed.test(pathname)) return null;
  const target = path.resolve(pathname.startsWith("/") ? root : path.dirname(file), pathname.startsWith("/") ? "." + pathname : pathname);
  return inside(target) ? target : null;
}
async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await visit(file); continue; }
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const source = await readFile(file, "utf8");
    let next = source;
    // HTML src/href values only; avoid touching inline JavaScript or CSS.
    const refs = /\b(src|href)=(["'])([^"']+)\2/g;
    for (const match of source.matchAll(refs)) {
      const url = match[3], target = candidate(file, url);
      if (!target) continue;
      if (await exists(target)) continue;
      let fixed = null;
      // Case 1: accidentally published root-relative URL with a /public/ prefix.
      if (url.startsWith("/public/")) fixed = url.slice("/public".length);
      // Case 2: a relative asset URL accidentally includes a public/ prefix.
      else if (url.startsWith("public/")) fixed = url.slice("public/".length);
      else if (url.startsWith("./public/")) fixed = "./" + url.slice("./public/".length);
      const fixedTarget = fixed ? candidate(file, fixed) : null;
      if (fixedTarget && await exists(fixedTarget)) {
        const before = match[0], after = match[1] + "=" + match[2] + fixed + match[2];
        next = next.replace(before, after);
        repairs++;
        findings.push({kind:"safe-fix",file:path.relative(root,file),from:url,to:fixed});
      } else {
        missingAssets++;
        findings.push({kind:"missing-asset",file:path.relative(root,file),url});
      }
    }
    if (next !== source) { changedFiles++; if (apply) await writeFile(file, next); }
  }
}
await visit(path.join(root, "arcade"));
console.log(JSON.stringify({mode:apply?"fix":"audit",changedFiles,repairs,missingAssets,findings},null,2));
if (missingAssets) process.exitCode = 2;
