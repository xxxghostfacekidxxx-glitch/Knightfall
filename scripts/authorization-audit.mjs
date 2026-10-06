const API = process.env.KNIGHTFALL_API || "https://api.ash-fall.com";
const roles = {
  member: { username: process.env.KNIGHTFALL_MEMBER_USERNAME, password: process.env.KNIGHTFALL_MEMBER_PASSWORD },
  moderator: { username: process.env.KNIGHTFALL_MODERATOR_USERNAME, password: process.env.KNIGHTFALL_MODERATOR_PASSWORD },
  admin: { username: process.env.KNIGHTFALL_ADMIN_USERNAME, password: process.env.KNIGHTFALL_ADMIN_PASSWORD },
};

const adminRoutes = [
  "/api/admin/overview",
  "/api/admin/health",
  "/api/admin/users",
  "/api/admin/deleted",
  "/api/admin/content?type=threads&include_deleted=0&q=",
  "/api/admin/categories",
  "/api/admin/settings",
  "/api/admin/audit?limit=5",
  "/api/admin/reports?status=open",
  "/api/admin/messages?q=",
];
const moderatorRoutes = ["/api/moderation/reports?status=open"];

async function request(path, cookie) {
  const res = await fetch(API + path, { headers: cookie ? { Cookie: cookie } : {} });
  return { status: res.status, body: await res.text() };
}

async function login(creds) {
  if (!creds?.username || !creds?.password) throw new Error("Missing role credentials in GitHub Actions secrets.");
  const res = await fetch(API + "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: creds.username, password: creds.password }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Login failed for ${creds.username}: HTTP ${res.status} ${body.slice(0,160)}`);
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error(`Login for ${creds.username} returned no session cookie.`);
  return cookie.split(";")[0];
}

function assertStatus(actual, expected, label) {
  if (!expected.includes(actual)) throw new Error(`${label}: expected ${expected.join("/")}, got ${actual}`);
  console.log(`PASS ${label} -> ${actual}`);
}

const cookies = {};
for (const role of Object.keys(roles)) cookies[role] = await login(roles[role]);

for (const route of adminRoutes) {
  const unauth = await request(route);
  assertStatus(unauth.status, [401,403], `unauthenticated admin ${route}`);
  const member = await request(route, cookies.member);
  assertStatus(member.status, [401,403], `member denied admin ${route}`);
  const moderator = await request(route, cookies.moderator);
  assertStatus(moderator.status, [401,403], `moderator denied admin ${route}`);
  const admin = await request(route, cookies.admin);
  if (admin.status >= 400) throw new Error(`admin ${route}: expected success, got ${admin.status} ${admin.body.slice(0,160)}`);
  console.log(`PASS admin allowed ${route} -> ${admin.status}`);
}

for (const route of moderatorRoutes) {
  const unauth = await request(route);
  assertStatus(unauth.status, [401,403], `unauthenticated moderator ${route}`);
  const member = await request(route, cookies.member);
  assertStatus(member.status, [401,403], `member denied moderator ${route}`);
  const moderator = await request(route, cookies.moderator);
  if (moderator.status >= 400) throw new Error(`moderator ${route}: expected success, got ${moderator.status} ${moderator.body.slice(0,160)}`);
  const admin = await request(route, cookies.admin);
  if (admin.status >= 400) throw new Error(`admin moderator route ${route}: expected success, got ${admin.status} ${admin.body.slice(0,160)}`);
  console.log(`PASS moderator/admin allowed ${route}`);
}

console.log("Authorization audit completed successfully.");
