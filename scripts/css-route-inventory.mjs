// Audit site-wide CSS and legacy arcade paths before removing public assets.
// Source files that import a CSS file dynamically still count as active users.
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, dirname, extname, basename } from "node:path";

const publicDir = new URL("../public/", import.meta.url).pathname;
const sources = [];
const css = [];
const pageLinks = [];
const textExtensions = new Set([".html", ".js", ".mjs", ".css", ".json", ".jsonc", ".webmanifest", ".svg", ".xml"]);
const walk = async dir => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (!textExtensions.has(ext)) continue;
      const info = await stat(absolute);
      if (info.size > 4 * 1024 * 1024) continue;
      const path = relative(publicDir, absolute).replaceAll("\\", "/");
      const body = await readFile(absolute, "utf8");
      sources.push({ path, body });
      if (ext === ".css" && dirname(path) === ".") css.push(path);
      if (ext === ".html") {
        for (const [,href] of body.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
          if (/\/(?:arcade-vault|arcade-30-games)\.html(?:[?#]|$)/.test(href))
            pageLinks.push({path,href});
        }
      }
    }
  }
};
await walk(publicDir);

const cssReferences = css.sort().map(path => {
  const filename = basename(path);
  const dependents = sources.filter(source => source.path !== path &&
    (source.body.includes("/" + filename) ||
     source.body.includes('"' + filename) ||
     source.body.includes("'" + filename) ||
     source.body.includes("`" + filename)))
    .map(source => source.path);
  return { css: path, references: dependents.length, users: dependents.slice(0, 8) };
});
const orphanCandidates = cssReferences.filter(entry => entry.references === 0).map(entry => entry.css);
console.log("ROOT CSS FILES: " + css.length);
console.log("APP SOURCE FILES SCANNED: " + sources.length);
console.log("CSS FILES WITH ZERO APP REFERENCES (REVIEW BEFORE DELETE): " + JSON.stringify(orphanCandidates));
console.log("HTML LINKS TO RETIRED ARCADE DIRECTORIES: " + JSON.stringify(pageLinks));
for (const record of cssReferences.filter(entry => entry.references <= 1)) {
  console.log("LOW-REFERENCE CSS: " + JSON.stringify(record));
}

if (orphanCandidates.length || pageLinks.length) {
  console.error("Navigation/CSS release guard failed: unused stylesheets or retired arcade links remain.");
  process.exitCode = 1;
}
