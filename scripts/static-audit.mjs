import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const publicDir = path.join(root, "public");
const errors = [];
const ok = (message) => console.log("PASS " + message);
const fail = (message) => errors.push(message);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

const publicFiles = await walk(publicDir);
const publicPaths = new Set(publicFiles.map(file => "/" + path.relative(publicDir, file).split(path.sep).join("/")));
const htmlFiles = publicFiles.filter(file => file.endsWith(".html"));
const jsFiles = publicFiles.filter(file => file.endsWith(".js"));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check"], { input: await readFile(file, "utf8"), encoding: "utf8" });
  if (result.status !== 0) fail("JavaScript syntax error in " + path.relative(root, file) + ": " + (result.stderr || result.stdout).trim());
  else ok("JavaScript syntax: " + path.relative(root, file));
}
const worker = await readFile(path.join(root, "backend/src/index.js"), "utf8");
const workerCheck = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: worker, encoding: "utf8" });
if (workerCheck.status !== 0) fail("Worker module syntax error: " + (workerCheck.stderr || workerCheck.stdout).trim());
else ok("Worker module syntax");

for (const configPath of ["wrangler.jsonc", "backend/wrangler.jsonc"]) {
  try {
    JSON.parse(await readFile(path.join(root, configPath), "utf8"));
    ok("Valid JSON Wrangler config: " + configPath);
  } catch (error) {
    fail("Invalid Wrangler config " + configPath + ": " + error.message);
  }
}

for (const file of htmlFiles) {
  const rel = path.relative(root, file);
  const html = await readFile(file, "utf8");
  if (!/<title>\s*[^<]+<\/title>/i.test(html)) fail(rel + " is missing a non-empty title.");
  if (!/name=["']viewport["']/i.test(html)) fail(rel + " is missing a viewport meta tag.");
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  const duplicateScripts = scripts.filter((src, i) => scripts.indexOf(src) !== i);
  if (duplicateScripts.length) fail(rel + " loads script(s) more than once: " + [...new Set(duplicateScripts)].join(", "));
  const refs = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map(m => m[1]);
  for (const raw of refs) {
    if (!raw.startsWith("/") || raw.startsWith("//")) continue;
    const pathname = raw.split(/[?#]/, 1)[0];
    if (!pathname || pathname === "/" || pathname.startsWith("/api/")) continue;
    if (!publicPaths.has(pathname)) fail(rel + " references missing local asset " + pathname);
  }
  ok("HTML structure and local assets: " + rel);
}

const migrationsDir = path.join(root, "backend/migrations");
const migrations = (await readdir(migrationsDir)).filter(name => name.endsWith(".sql")).sort();
for (const name of migrations) {
  const sql = await readFile(path.join(migrationsDir, name), "utf8");
  if (!sql.trim()) fail("Empty migration: " + name);
  if (/\bDROP\s+TABLE\b/i.test(sql) && !/--.*\bDROP\s+TABLE\b/i.test(sql)) console.warn("REVIEW destructive migration: " + name);
}
ok("Migration files present: " + migrations.length);

if (errors.length) {
  console.error("\nSTATIC AUDIT FAILED");
  for (const error of errors) console.error("FAIL " + error);
  process.exitCode = 1;
} else {
  console.log("\nSTATIC AUDIT PASSED");
}
