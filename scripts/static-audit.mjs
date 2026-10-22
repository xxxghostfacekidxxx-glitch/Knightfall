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
  const result = spawnSync(process.execPath, ["--check"], { input: await readFile(file, "utf8"), encoding: "utf8" });
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
  ["arcade saves are rate-limited per network and account", /rateLimit\(env,request,"arcade-save",60,60\)[\s\S]{0,220}rateLimit\(env,request,"arcade-save-account",120,60,user\.id\)/],
  ["score save success is reported independently from progress sync", /let progressSaved=true[\s\S]{0,650}progressSaved\?"Score saved to your account/],
];
for (const [label, pattern] of saveInvariants) {
  if (!pattern.test(worker + "\n" + saveScript)) fail("Arcade save invariant missing: " + label);
  else ok("Arcade save invariant: " + label);
}

const monsterMmoChecks = [
  ["monster MMO save reads require an authenticated account", worker.includes('if(url.pathname==="/api/game/save"&&request.method==="GET"){') && worker.includes("const user=await requireUser(request,env);")],
  ["monster MMO save writes require an authenticated account", worker.includes('if(url.pathname==="/api/game/save"&&request.method==="PUT"){') && worker.includes("const user=await requireUser(request,env);")],
  ["monster MMO saves use optimistic version checks", worker.includes("UPDATE monster_game_saves SET save_json=?,version=version+1,updated_at=? WHERE user_id=? AND version=?")],
  ["monster MMO saves reject teleports and blocked terrain", worker.includes("Trainer movement must be one adjacent tile at a time.") && worker.includes("Trainer position must be on a walkable map tile.")],
  ["monster MMO saves canonicalize creatures against an allowlist", ["mossbit:{name:\"Mossbit\"","embercub:{name:\"Embercub\"","driftfin:{name:\"Driftfin\"","gloamlet:{name:\"Gloamlet\""].every(value=>worker.includes(value))],
  ["monster MMO saves are rate limited", worker.includes('rateLimit(env,request,"monster-save",60,60,user.id)')],
  ["monster MMO actions resolve battles server-side", worker.includes('url.pathname==="/api/game/action"&&request.method==="POST"') && worker.includes("monster_game_battles") && worker.includes('action==="capture"') && worker.includes('action==="attack"')],
  ["monster MMO party lead selection is server-validated", worker.includes('action==="party-lead"') && worker.includes("The active creature cannot change during battle.")],
  ["online encounter chance and grass validation are server-side", worker.includes('action==="encounter-check"' ) && worker.includes("Wild encounters can only begin in tall grass.") && worker.includes("Math.random()<0.22")],
];
for (const [label, passed] of monsterMmoChecks) {
  if (!passed) fail("Monster MMO invariant missing: " + label);
  else ok("Monster MMO invariant: " + label);
}
if (!worker.includes('url.pathname==="/api/game/world"') || !worker.includes("env.MONSTER_WORLD.get(id).fetch")) fail("Monster MMO WebSocket route is missing authenticated Durable Object routing.");
else ok("Monster MMO shared-world route is wired to Durable Objects");
if (!worker.includes("export class MonsterWorldRoom") || !worker.includes("webSocketMessage(socket, message)") || !worker.includes("player-moved")) fail("Monster MMO world room is missing server-side movement handling.");
else ok("Monster MMO world room exposes server-side movement handling");
const backendWrangler = JSON.parse(await readFile(path.join(root, "backend/wrangler.jsonc"), "utf8"));
if (!backendWrangler.durable_objects?.bindings?.some(binding => binding.name === "MONSTER_WORLD" && binding.class_name === "MonsterWorldRoom")) fail("Backend Wrangler config is missing the MONSTER_WORLD Durable Object binding.");
else ok("Monster MMO Durable Object binding is configured");
const monsterMmoClient = await readFile(path.join(publicDir, "monster-mmo.js"), "utf8");
if (!monsterMmoClient.includes('fetch(API_BASE+"/api/game/save"') || !monsterMmoClient.includes('credentials:"include"')) fail("Monster MMO client is missing authenticated cloud-save requests.");
else ok("Monster MMO client uses credentialed cloud-save requests");
if (!monsterMmoClient.includes("cloudVersion") || !monsterMmoClient.includes("conflict detected")) fail("Monster MMO client is missing cloud-save conflict handling.");
if (!monsterMmoClient.includes('fetch(API_BASE+"/api/game/action"') || !['cloudAction("start")','cloudAction("encounter-check")','cloudAction("attack")','cloudAction("capture")','cloudAction("flee")'].every(action=>monsterMmoClient.includes(action)) || !monsterMmoClient.includes('cloudAction("party-lead"')) fail("Monster MMO online actions are not routed through the server.");
if (!monsterMmoClient.includes('new WebSocket("wss://api.ash-fall.com/api/game/world")') || !monsterMmoClient.includes('type:"move",direction:dir')) fail("Monster MMO client is missing shared-world WebSocket movement.");
else ok("Monster MMO client connects to the shared world and sends movement intents");
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
