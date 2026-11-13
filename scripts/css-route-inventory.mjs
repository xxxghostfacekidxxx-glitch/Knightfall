// Audit site-wide CSS and legacy arcade paths before removing public assets.
// Source files that import a CSS file dynamically still count as active users.
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, dirname, extname, basename } from "node:path";

const publicDir = new URL("../public/", import.meta.url).pathname;
const sources = [];
const publicPaths = new Set();
const css = [];
const pageLinks = [];
const textExtensions = new Set([".html", ".js", ".mjs", ".css", ".json", ".jsonc", ".webmanifest", ".svg", ".xml"]);
const walk = async dir => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else if (entry.isFile()) {
      const path = relative(publicDir, absolute).replaceAll("\\", "/");
      publicPaths.add(path);
      const ext = extname(entry.name).toLowerCase();
      if (!textExtensions.has(ext)) continue;
      const info = await stat(absolute);
      if (info.size > 4 * 1024 * 1024) continue;
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


const topLevelDuplicates = [], invalidTopLevelLinks = [];
const redirectFile = await readFile(join(publicDir, "_redirects"), "utf8");
const redirectAliases = new Set(redirectFile.split(/\r?\n/).map(x=>x.split(/\s+/)[0].replace(/^\//,"")));
for (const {path,body} of sources.filter(x=>/^[^/]+\.html$/.test(x.path))) {
  const links = [...body.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
  const counts = new Map();
  for (const link of links) {
    if (!link.startsWith("/") || link.startsWith("//")) continue;
    counts.set(link,(counts.get(link)||0)+1);
    const destination = link.split(/[?#]/)[0].replace(/^\//,"");
    if(!destination || destination.includes("$") || destination.startsWith("api/"))continue;
    if(!publicPaths.has(destination) && !publicPaths.has(destination+".html") &&
       !publicPaths.has(destination.replace(/\/$/,"")+"/index.html") && !redirectAliases.has(destination))
      invalidTopLevelLinks.push({page:path,href:link});
  }
  for(const [href,count] of counts)if(count>1)topLevelDuplicates.push({page:path,href,count});
}
console.log("TOP-LEVEL REPEATED LOCAL LINKS (REVIEW): " + JSON.stringify(topLevelDuplicates));
console.log("TOP-LEVEL MISSING LOCAL TARGETS (REVIEW): " + JSON.stringify(invalidTopLevelLinks));

if (orphanCandidates.length || pageLinks.length) {
  console.error("Navigation/CSS release guard failed: unused stylesheets or retired arcade links remain.");
  process.exitCode = 1;
}
