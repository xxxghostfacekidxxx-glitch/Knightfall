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
const cssFiles = publicFiles.filter(file => file.endsWith(".css"));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: await readFile(file, "utf8"), encoding: "utf8" });
  if (result.status !== 0) fail("JavaScript syntax error in " + path.relative(root, file) + ": " + (result.stderr || result.stdout).trim());
  else ok("JavaScript syntax: " + path.relative(root, file));
}
const worker = await readFile(path.join(root, "backend/src/index.js"), "utf8");
const saveScript = await readFile(path.join(publicDir, "arcade-save.js"), "utf8");
const workerCheck = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: worker, encoding: "utf8" });
if (workerCheck.status !== 0) fail("Worker module syntax error: " + (workerCheck.stderr || workerCheck.stdout).trim());
else ok("Worker module syntax");

const arcadeInvariants = [
  ["arcade score submissions require a signed-in account", /\/api\/arcade\/scores[\s\S]{0,350}requireUser\(request,env\);if\(!user\)return json\(\{error:/],
  ["arcade scores are rate-limited per network and account", /rateLimit\(env,request,"arcade-score",60,60\)[\s\S]{0,220}rateLimit\(env,request,"arcade-score-account",20,60,user\.id\)/],
  ["arcade scores reject unsafe, negative, or excessive values", /score>scoreCap/],
  ["new fixed-rule arcade games have conservative score caps", /arcadeScoreCaps[\s\S]{0,500}"pong-no-return":7/],
];
for (const [label, pattern] of arcadeInvariants) {
  if (!pattern.test(worker)) fail("Arcade invariant missing: " + label);
  else ok("Arcade invariant: " + label);
}

const saveInvariants = [
  ["arcade save writes use revision-aware conditional updates", /expected_revision[\s\S]{0,1800}revision=arcade_saves\.revision\+1/],
  ["arcade save client sends an expected revision", /expected_revision:expectedRevision/],
  ["arcade saves are rate-limited per network and account", /rateLimit\(env,request,"arcade-save",60,60\)[\s\S]{0,220}rateLimit\(env,request,"arcade-save-account",120,60,user\.id\)/],
  ["score save success is reported independently from progress sync", /let progressSaved=true[\s\S]{0,650}progressSaved\?"Score saved to your account/],
];
for (const [label, pattern] of saveInvariants) {
  if (!pattern.test(worker + "\n" + saveScript)) fail("Arcade save invariant missing: " + label);
  else ok("Arcade save invariant: " + label);
}

const chaosInvariants = [
  ["explicit-only memory policy is enforced", /behaviorConfig\.memoryPolicy==="explicit_only"/],
  ["memory retrieval filters irrelevant memories", /rankedMemories\.filter\(m=>m\.score>0\)/],
  ["disabled default modes are rejected", /o\.defaultMode!=="automatic"&&!o\.modes\[o\.defaultMode\]/],
  ["Chaos Lab proposal application is owner-gated", /chaos-lab\/apply-proposal[\s\S]{0,220}chaosOwner\(user\)/],
  ["approved Chaos Lab changes use a D1 batch", /chaos-lab\/apply-proposal[\s\S]{0,5000}env\.DB\.batch\(statements\)/],
];
for (const [label, pattern] of chaosInvariants) {
  if (!pattern.test(worker)) fail("Chaos invariant missing: " + label);
  else ok("Chaos invariant: " + label);
}
const friendInvariants = [
  ["friend list requires an authenticated user", /\/api\/friends[\s\S]{0,180}requireUser\(request,env\);if\(!user\)return json\(\{error:/],
  ["friend requests reject self-adds", /\/api\/friends\/request[\s\S]{0,1400}target\.id===user\.id/],
  ["friend request mutations require ownership of the pending request", /SELECT id,requester_id FROM friend_requests WHERE id=\? AND addressee_id=\? AND status='pending'/],
  ["blocking a member removes existing friend relationships", /blockMatch[\s\S]{0,1500}DELETE FROM friend_requests WHERE \(requester_id=\? AND addressee_id=\?\) OR \(requester_id=\? AND addressee_id=\?\)/],
  ["friend routes honor blocked relationships", /\/api\/friends\/request[\s\S]{0,2200}user_blocks/],
];
for (const [label, pattern] of friendInvariants) {
  if (!pattern.test(worker)) fail("Friend invariant missing: " + label);
  else ok("Friend invariant: " + label);
}
const friendsMigration = await readFile(path.join(root, "backend/migrations/0020_friends.sql"), "utf8");
if (!friendsMigration.includes("CREATE TABLE IF NOT EXISTS friend_requests")) fail("Friend migration is missing friend_requests.");
if (!friendsMigration.includes("UNIQUE(requester_id, addressee_id)")) fail("Friend migration is missing directional request uniqueness.");
if (!friendsMigration.includes("CHECK(requester_id <> addressee_id)")) fail("Friend migration does not prevent self-friend rows.");
else ok("Friend migration constraints");

const chaosLabHtml = await readFile(path.join(publicDir, "chaos-lab.html"), "utf8");
if (!chaosLabHtml.includes("/api/admin/chaos-lab/apply-proposal")) fail("Chaos Lab UI does not use the atomic proposal endpoint.");
else ok("Chaos Lab proposal UI uses the atomic endpoint");

for (const configPath of ["wrangler.jsonc", "backend/wrangler.jsonc"]) {
  try {
    JSON.parse(await readFile(path.join(root, configPath), "utf8"));
    ok("Valid JSON Wrangler config: " + configPath);
  } catch (error) {
    fail("Invalid Wrangler config " + configPath + ": " + error.message);
  }
}

for (const file of cssFiles) {
  const rel = path.relative(root, file);
  const css = (await readFile(file, "utf8")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "");
  let depth = 0;
  for (const ch of css) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) fail("Unbalanced CSS braces in " + rel);
  else ok("CSS brace balance: " + rel);
}

for (const file of htmlFiles) {
  const rel = path.relative(root, file);
  const html = await readFile(file, "utf8");
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) fail(rel + " contains duplicate id(s): " + [...new Set(duplicates)].join(", "));
  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (let i = 0; i < inlineScripts.length; i++) {
    const attrs = inlineScripts[i][1];
    const code = inlineScripts[i][2];
    if (/\bsrc=["']/i.test(attrs) || !code.trim()) continue;
    const isModule = /\btype=["']module["']/i.test(attrs);
    const result = spawnSync(process.execPath, isModule ? ["--input-type=module", "--check"] : ["--check"], { input: code, encoding: "utf8" });
    if (result.status !== 0) fail("Inline JavaScript syntax error in " + rel + " script #" + (i + 1) + ": " + (result.stderr || result.stdout).trim());
  }
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


const manifest = JSON.parse(await readFile(path.join(publicDir, "arcade/import-manifest.json"), "utf8"));
if (!Array.isArray(manifest.imports) || !Array.isArray(manifest.ashFallOriginalBuilds)) fail("Arcade import manifest is missing import/original-build arrays.");
const manifestEntries = [...manifest.imports, ...manifest.ashFallOriginalBuilds];
const manifestIds = manifestEntries.map(entry => entry.gameId);
if (new Set(manifestIds).size !== manifestIds.length) fail("Arcade manifest contains duplicate gameId values.");
for (const entry of manifestEntries) {
  if (!entry.gameId || !/^[a-z0-9-]+$/.test(entry.gameId)) fail("Invalid arcade manifest gameId: " + String(entry.gameId));
  for (const item of entry.files || []) {
    const localPath = item.startsWith("/") ? item : "/" + item;
    if (!publicPaths.has(localPath)) fail("Manifest entry " + entry.gameId + " lists a missing local file: " + item);
  }
  if (entry.status === "imported-adapted" && (!entry.upstream || !entry.license || !(entry.files || []).some(f => /LICENSE|NOTICE|SOURCE-NOTICE/i.test(f)))) {
    fail("Imported adaptation lacks upstream, license, or a bundled notice reference: " + entry.gameId);
  }
}
const marksman = await readFile(path.join(publicDir, "arcade/hosted/marshland-marksman/index.html"), "utf8");
if (!marksman.includes("cabinet-marshland-marksman") || !marksman.includes("recordScore")) fail("Marshland Marksman is missing account leaderboard integration.");
if (!worker.includes('"cabinet-marshland-marksman"') || !worker.includes('"cabinet-marshland-marksman":1000')) fail("Marshland Marksman is not allowlisted with a bounded score cap.");
const openSourceCatalog = await readFile(path.join(publicDir, "arcade-30-games.html"), "utf8");
if (!openSourceCatalog.includes('href="/arcade/hosted/marshland-marksman/index.html"')) fail("Marshland Marksman is missing from the arcade catalog.");
ok("Arcade manifest paths, provenance records, and Marshland Marksman account integration checked.");
if (!openSourceCatalog.includes('href="/arcade/hosted/cinder-crossing/index.html"')) fail("Cinder Crossing is missing from the arcade catalog.");
const cinderGame = await readFile(path.join(publicDir, "arcade/hosted/cinder-crossing/index.html"), "utf8");
if (!cinderGame.includes("cabinet-cinder-crossing") || !cinderGame.includes("recordScore")) fail("Cinder Crossing is missing account leaderboard integration.");
if (!worker.includes('"cabinet-cinder-crossing"') || !worker.includes('"cabinet-cinder-crossing":1000')) fail("Cinder Crossing is not allowlisted with a bounded score cap.");
if (!manifest.ashFallOriginalBuilds.some(entry => entry.gameId === "cabinet-cinder-crossing")) fail("Cinder Crossing is missing from the arcade manifest.");
ok("Cinder Crossing catalog, account integration, score cap, and manifest registration checked.");
const afterburnGame = await readFile(path.join(publicDir, "arcade/hosted/afterburn-breakout/index.html"), "utf8");
if (!afterburnGame.includes("cabinet-afterburn-breakout") || !afterburnGame.includes("recordScore")) fail("Afterburn Breakout is missing account leaderboard integration.");
if (!worker.includes('"cabinet-afterburn-breakout"') || !worker.includes('"cabinet-afterburn-breakout":1000')) fail("Afterburn Breakout is not allowlisted with a bounded score cap.");
if (!manifest.ashFallOriginalBuilds.some(entry => entry.gameId === "cabinet-afterburn-breakout")) fail("Afterburn Breakout is missing from the arcade manifest.");
const afterburnCatalog = await readFile(path.join(publicDir, "arcade-30-games.html"), "utf8");
const afterburnCartridge = await readFile(path.join(publicDir, "chaos-cartridge.html"), "utf8");
const afterburnRecords = await readFile(path.join(publicDir, "arcade-progress.html"), "utf8");
if (!afterburnCatalog.includes('href="/arcade/hosted/afterburn-breakout/index.html"') || !afterburnCartridge.includes('href="/arcade/hosted/afterburn-breakout/index.html"') || !afterburnRecords.includes('"cabinet-afterburn-breakout":"Afterburn Breakout"')) fail("Afterburn Breakout is missing from a public arcade surface.");
ok("Afterburn Breakout catalog, account integration, score cap, and manifest registration checked.");
const colossusGame = await readFile(path.join(publicDir, "arcade/hosted/colossus-clash/index.html"), "utf8");
if (!colossusGame.includes("cabinet-colossus-clash") || !colossusGame.includes("recordScore")) fail("Colossus Clash is missing account leaderboard integration.");
if (!worker.includes('"cabinet-colossus-clash"') || !worker.includes('"cabinet-colossus-clash":100000')) fail("Colossus Clash is not allowlisted with a bounded score cap.");
if (!manifest.ashFallOriginalBuilds.some(entry => entry.gameId === "cabinet-colossus-clash")) fail("Colossus Clash is missing from the arcade manifest.");
if (!recordsPageAudit.includes('"cabinet-colossus-clash":"Colossus Clash"')) fail("Colossus Clash is missing from player records.");
ok("Colossus Clash controls, account integration, score cap, and provenance checked.");

const mainCartridgeAudit = await readFile(path.join(publicDir, "chaos-cartridge.html"), "utf8");
const recordsPageAudit = await readFile(path.join(publicDir, "arcade-progress.html"), "utf8");
if (!mainCartridgeAudit.includes('href="/arcade/hosted/marshland-marksman/index.html"') || !mainCartridgeAudit.includes('href="/arcade/hosted/cinder-crossing/index.html"')) fail("Chaos Cartridge is missing one or more newly integrated cabinets.");
if (!recordsPageAudit.includes('"cabinet-marshland-marksman":"Marshland Marksman"') || !recordsPageAudit.includes('"cabinet-cinder-crossing":"Cinder Crossing"')) fail("Arcade records page does not register the new cabinet leaderboards.");
ok("New cabinets are linked from the main arcade and registered in the player records page.");



const apiCandidates = new Set();
for (const file of [...htmlFiles, ...jsFiles]) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/\/api\/[A-Za-z0-9_/?=&.-]+/g)) {
    const endpoint = match[0].split(/[?#]/, 1)[0];
    if (!endpoint.endsWith("/")) apiCandidates.add(endpoint);
  }
}
for (const endpoint of apiCandidates) {
  if (!worker.includes(endpoint) && !worker.includes(endpoint.replaceAll("/", "\\/"))) {
    fail("Frontend references an API path not found in the Worker: " + endpoint);
  }
}
ok("Frontend API path contracts checked: " + apiCandidates.size);

const cityGame = await readFile(path.join(root, "public/city-of-cinders.html"), "utf8");
const cartridge = await readFile(path.join(root, "public/chaos-cartridge.html"), "utf8");
const arcadeProgress = await readFile(path.join(root, "public/arcade-progress.html"), "utf8");
if (!cityGame.includes("gameKey='city-of-cinders'")) fail("City of Cinders is missing its arcade game key.");
if (!["guttermaw","malpractice","dredge","ash-tyrant","widowbyte","wreckoning"].every(key => cityGame.includes(key))) fail("City of Cinders is missing one or more of its six playable monsters.");
if (!cityGame.includes("data-character") || !cityGame.includes("data-mutation")) fail("City of Cinders is missing character selection or mutation controls.");
if (!cityGame.includes("cinders-unlocked") || !cityGame.includes("unlockRules") || !cityGame.includes("unlockedCharacters")) fail("City of Cinders is missing mixed character unlock progression.");
if (!cityGame.includes("restoreAccountProgress") || !cityGame.includes("api.loadProgress(gameKey)")) fail("City of Cinders does not restore account-backed character progression.");
if (!cityGame.includes("selectedCharacter==='malpractice'") || !cityGame.includes("selectedCharacter==='wreckoning'")) fail("City of Cinders is missing character-specific visual identity details.");
if (!cityGame.includes("aerialSlash") || !cityGame.includes("nearby.hp-=.65") || !cityGame.includes("Math.min(combo-1,4)*.16")) fail("City of Cinders is missing signature attack behavior for its roster.");
const arcadeSave = await readFile(path.join(root, "public/arcade-save.js"), "utf8");
if (!arcadeSave.includes("async function loadProgress") || !arcadeSave.includes("loadProgress,saveProgress")) fail("Arcade save helper does not expose account-backed progress loading.");
if (!cityGame.includes("data-hold") || !cityGame.includes("data-tap")) fail("City of Cinders is missing touch controls.");
if (!cartridge.includes('href="/city-of-cinders.html"')) fail("Chaos Cartridge does not link to City of Cinders.");
if (!arcadeProgress.includes('"city-of-cinders":"City of Cinders"')) fail("Arcade records do not register City of Cinders.");
if (!worker.includes('"city-of-cinders"') || !worker.includes('"city-of-cinders":25000')) fail("Worker does not allow and sanity-bound City of Cinders scores.");
ok("City of Cinders game, controls, records, and score API registration checked.");

const feedbackPages = [
  "public/arcade-games.html",
  "public/arcade-vault.html",
  "public/arcade-after-dark.html",
  "public/arcade-originals.html",
  "public/arcade-fresh-meat.html",
  "public/city-of-cinders.html",
  "public/not-dead-yet.html",
  "public/last-drop-lemonade.html",
  "public/wagonbound.html",
];
for (const file of feedbackPages) {
  const page = await readFile(path.join(root, file), "utf8");
  const references = page.match(/\/arcade-feedback\.js(?:\?[^"' ]*)?/g) || [];
  if (references.length !== 1) fail("Arcade feedback controller must be included exactly once: " + file);
}
const feedbackScript = await readFile(path.join(root, "public/arcade-feedback.js"), "utf8");
if (!feedbackScript.includes("new MutationObserver") || !feedbackScript.includes("if (!seen.has(root))")) fail("Arcade feedback observer must detect changes without overwriting its previous text snapshot.");
const feedbackCss = await readFile(path.join(root, "public/arcade-polish.css"), "utf8");
if (!feedbackCss.includes(".af-feedback-pulse") || !feedbackCss.includes("prefers-reduced-motion:reduce")) fail("Arcade feedback styling or reduced-motion support is missing.");
ok("Arcade feedback is installed once on all nine games and preserves accessible, reduced-motion-safe change detection.");

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
