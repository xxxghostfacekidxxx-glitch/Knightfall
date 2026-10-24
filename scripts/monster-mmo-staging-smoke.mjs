#!/usr/bin/env node
// Safe, disposable two-account smoke test for the isolated Monster MMO Worker.
// Uses only the staging URL and deterministic per-run test accounts.
const base = (process.env.KNIGHTFALL_STAGING_API_BASE_URL || "").replace(/\/$/, "");
const runId = String(process.env.GITHUB_RUN_ID || Date.now()).replace(/[^0-9]/g, "").slice(-8);
const attempt = String(process.env.GITHUB_RUN_ATTEMPT || "1").replace(/[^0-9]/g, "").slice(-2) || "1";
if (!/^https:\/\//.test(base) || /api\.ash-fall\.com|ash-fall\.com/.test(new URL(base).hostname)) {
  throw new Error("KNIGHTFALL_STAGING_API_BASE_URL must point to the isolated staging Worker, never production.");
}
const suffix = runId + attempt;
const users = [
  { username: "mmo" + suffix + "a", email: "mmo" + suffix + "a@example.invalid", display_name: "MMO Staging A", password: "Stage-A-" + suffix + "-StrongPass!9" },
  { username: "mmo" + suffix + "b", email: "mmo" + suffix + "b@example.invalid", display_name: "MMO Staging B", password: "Stage-B-" + suffix + "-StrongPass!9" }
];
const cookies = new Map();
async function request(path, {method="GET", user=null, body=null, allow=[200]}={}) {
  const headers = { origin: "https://ash-fall.com" };
  if (body !== null) headers["content-type"] = "application/json";
  if (user && cookies.has(user.username)) headers.cookie = cookies.get(user.username);
  const response = await fetch(base + path, {method, headers, body: body === null ? undefined : JSON.stringify(body), redirect:"manual"});
  const cookie = response.headers.get("set-cookie");
  if (user && cookie) cookies.set(user.username, cookie.split(";")[0]);
  const data = await response.json().catch(()=>({}));
  if (!allow.includes(response.status)) throw new Error(method + " " + path + " returned " + response.status + ": " + JSON.stringify(data));
  return {status:response.status,data};
}
async function authenticate(user) {
  let result = await request("/api/auth/register", {method:"POST",body:user,allow:[201,409]});
  if (result.status === 409) result = await request("/api/auth/login", {method:"POST",body:{identifier:user.username,password:user.password},user,allow:[200]});
  if (result.status !== 201 && result.status !== 200) throw new Error("Could not authenticate staging account " + user.username);
  if (result.data.user?.username !== user.username) throw new Error("Authenticated account identity mismatch.");
  // Registration sets the cookie on the response too.
  const cookie = result.status === 201 ? null : cookies.get(user.username);
  if (cookie) cookies.set(user.username,cookie);
  if (!cookies.has(user.username)) throw new Error("No session cookie returned for " + user.username);
  return result.data.user;
}
function saveFor(id, level, hp, x=4, y=4) {
  return {x,y,steps:0,encounters:0,caught:0,badges:0,party:[{id,level,xp:0,hp}],bag:8};
}
async function main() {
  const [a,b] = await Promise.all(users.map(authenticate));
  const [aBefore,bBefore] = await Promise.all(users.map((u)=>request("/api/game/save",{user:u})));
  if (aBefore.data.save !== null || bBefore.data.save !== null) throw new Error("Fresh staging test account unexpectedly has an existing save.");
  let ar = await request("/api/game/save",{method:"PUT",user:users[0],body:{save:saveFor("embercub",5,18),expected_version:0},allow:[200]});
  let br = await request("/api/game/save",{method:"PUT",user:users[1],body:{save:saveFor("mossbit",3,18),expected_version:0},allow:[200]});
  let av = Number(ar.data.version), bv = Number(br.data.version);
  if (av !== 1 || bv !== 1) throw new Error("Initial save version was not 1.");
  // Move one legal tile into tall grass. Movement is server-validated and versioned.
  ar = await request("/api/game/save",{method:"PUT",user:users[0],body:{save:{...saveFor("embercub",5,18,3,4),steps:1},expected_version:av},allow:[200]});
  av = Number(ar.data.version);
  // Starting a wild encounter must be server-authoritative.
  let battle = await request("/api/game/action",{method:"POST",user:users[0],body:{action:"start",expected_version:av},allow:[200]});
  av = Number(battle.data.version);
  if (!battle.data.battle?.id) throw new Error("Staging battle did not start.");
  // Stale writes must conflict rather than overwrite the latest version.
  const stale = await request("/api/game/save",{method:"PUT",user:users[0],body:{save:{...saveFor("embercub",5,18,3,4),steps:1},expected_version:av-1},allow:[409]});
  if (!stale.data.conflict) throw new Error("Stale save was not rejected as a conflict.");
  // Weaken the encounter, then test the capture path with the current expected version.
  for (let i=0; i<16 && battle.data.battle && battle.data.battle.hp > battle.data.battle.maxHp*0.3; i++) {
    battle = await request("/api/game/action",{method:"POST",user:users[0],body:{action:"attack",expected_version:av},allow:[200]});
    av = Number(battle.data.version);
  }
  for (let i=0; i<8 && battle.data.battle; i++) {
    battle = await request("/api/game/action",{method:"POST",user:users[0],body:{action:"capture",expected_version:av},allow:[200,409]});
    if (battle.status === 409) throw new Error("Capture failed validation: " + JSON.stringify(battle.data));
    av = Number(battle.data.version);
  }
  if (battle.data.battle) throw new Error("Capture loop did not resolve the encounter.");
  const aAfter = await request("/api/game/save",{user:users[0]});
  const bAfter = await request("/api/game/save",{user:users[1]});
  if (aAfter.data.save?.caught !== 1) throw new Error("Capture progress did not persist to account A.");
  if (bAfter.data.save?.party?.[0]?.id !== "mossbit" || Number(bAfter.data.version) !== bv) throw new Error("Account B's save was affected by account A's actions.");
  // A member cannot submit progression changes to their own save outside validated actions.
  const tamper = await request("/api/game/save",{method:"PUT",user:users[1],body:{save:{...bAfter.data.save,party:[{id:"embercub",level:99,xp:0,hp:500}]},expected_version:bv},allow:[403]});
  if (tamper.status !== 403) throw new Error("Unvalidated progression mutation was not denied.");
  console.log(JSON.stringify({ok:true,checks:["two-account auth","independent initial saves","validated movement","server-authoritative encounter","stale revision conflict","capture persistence","account save isolation","progression tamper rejection"],test_usernames:users.map(u=>u.username)}));
}
try {
  await main();
} finally {
  await Promise.all(users.map(async user => {
    try { if (cookies.has(user.username)) await request("/api/auth/logout",{method:"POST",user,body:{},allow:[200,401,404]}); } catch (_) {}
  }));
}
