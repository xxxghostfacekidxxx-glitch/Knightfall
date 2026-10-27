import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const targets = ["public", "backend/src"];
const rows = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!/\.(js|html|mjs)$/.test(entry.name)) continue;
    const lines = (await readFile(file, "utf8")).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const flags = [];
      if (/\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML\s*\(/.test(line)) flags.push("html-sink");
      if (/\beval\s*\(|new\s+Function\s*\(/.test(line)) flags.push("dynamic-code");
      if (/\/api\/(?:admin|messages|vault|creator|adult|social)/.test(line)) flags.push("sensitive-route-reference");
      if (/requireUser\(|isAdmin\(|isModerator\(|chaosOwner\(/.test(line)) flags.push("auth-check-reference");
      if (flags.length) rows.push({ file: path.relative(root, file), line: i + 1, flags });
    }
  }
}
for (const dir of targets) await walk(path.join(root, dir));
const counts = {};
for (const row of rows) for (const flag of row.flags) counts[flag] = (counts[flag] || 0) + 1;
console.log("Security surface inventory (review leads, not vulnerability findings):");
console.log(JSON.stringify({ counts, totalLocations: rows.length }, null, 2));
for (const row of rows.filter(r => r.flags.includes("dynamic-code")).slice(0, 100)) {
  console.log("REVIEW " + row.file + ":" + row.line + " " + row.flags.join(","));
}
if (!rows.length) { console.error("No source locations scanned"); process.exitCode = 1; }
