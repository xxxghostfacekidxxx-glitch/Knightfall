const API = process.env.KNIGHTFALL_API || "https://api.ash-fall.com";
const roles = {
  member: { username: process.env.KNIGHTFALL_MEMBER_USERNAME, password: process.env.KNIGHTFALL_MEMBER_PASSWORD },
  moderator: { username: process.env.KNIGHTFALL_MODERATOR_USERNAME, password: process.env.KNIGHTFALL_MODERATOR_PASSWORD },
  admin: { username: process.env.KNIGHTFALL_ADMIN_USERNAME, password: process.env.KNIGHTFALL_ADMIN_PASSWORD },
};

const adminRoutes = [
  ["/api/admin/overview", "GET"],
  ["/api/admin/health", "GET"],
  ["/api/admin/users", "GET"],
  ["/api/admin/content?type=threads&include_deleted=0&q=", "GET"],
  ["/api/admin/categories", "GET"],
  ["/api/admin/settings", "GET"],
  ["/api/admin/audit?limit=5", "GET"],
  ["/api/admin/reports?status=open", "GET"],
  ["/api/admin/messages?q=", "GET"],
  ["/api/admin/conversations", "GET"],
  ["/api/admin/users/1/detail", "GET"],
];

const moderatorRoutes = [
  ["/api/moderation/reports?status=open", "GET"],
  ["/api/moderation/message-reports?status=open", "GET"],
];

const protectedMutations = [
  ["/api/profile", "PUT", "member"],
  ["/api/notifications/1", "PATCH", "member"],
  ["/api/notifications/read-all", "POST", "member"],
  ["/api/messages/conversations", "POST", "member"],
  ["/api/messages/conversations/1", "POST", "member"],
  ["/api/messages/1", "PATCH", "member"],
  ["/api/threads", "POST", "member"],
  ["/api/threads/1", "POST", "member"],
  ["/api/threads/1", "PATCH", "member"],
  ["/api/threads/1", "DELETE", "moderator"],
  ["/api/posts/1", "PATCH", "member"],
  ["/api/posts/1", "DELETE", "member"],
  ["/api/reports", "POST", "member"],
  ["/api/moderation/reports/1", "PATCH", "moderator"],
  ["/api/moderation/message-reports/1", "PATCH", "moderator"],
  ["/api/admin/users/1", "PATCH", "admin"],
  ["/api/admin/users/1", "POST", "admin"],
  ["/api/admin/settings", "PATCH", "admin"],
  ["/api/admin/categories", "POST", "admin"],
  ["/api/admin/categories/1", "PATCH", "admin"],
  ["/api/admin/categories/1", "DELETE", "admin"],
  ["/api/admin/content/threads/1", "PATCH", "admin"],
  ["/api/admin/content/posts/1", "PATCH", "admin"],
  ["/api/admin/messages/1", "PATCH", "admin"],
];

async function request(path, cookie, method = "GET") {
  const options = { method, headers: cookie ? { Cookie: cookie } : {} };
  if (method !== "GET") {
    options.headers["content-type"] = "application/json";
    options.body = "{}";
  }
  const res = await fetch(API + path, options);
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
  if (!expected.includes(actual)) throw new Error(`${label}: expected ${expected.join("/")} got ${actual}`);
  console.log(`PASS ${label} -> ${actual}`);
}

const cookies = {};
for (const role of Object.keys(roles)) cookies[role] = await login(roles[role]);

for (const [route, method] of adminRoutes) {
  const unauth = await request(route, null, method);
  assertStatus(unauth.status, [401,403], `unauthenticated admin ${method} ${route}`);
  const member = await request(route, cookies.member, method);
  assertStatus(member.status, [401,403], `member denied admin ${method} ${route}`);
  const moderator = await request(route, cookies.moderator, method);
  assertStatus(moderator.status, [401,403], `moderator denied admin ${method} ${route}`);
  const admin = await request(route, cookies.admin, method);
  if (admin.status >= 400) throw new Error(`admin ${method} ${route}: expected success, got ${admin.status} ${admin.body.slice(0,160)}`);
  console.log(`PASS admin allowed ${method} ${route} -> ${admin.status}`);
}

for (const [route, method] of moderatorRoutes) {
  const unauth = await request(route, null, method);
  assertStatus(unauth.status, [401,403], `unauthenticated moderator ${method} ${route}`);
  const member = await request(route, cookies.member, method);
  assertStatus(member.status, [401,403], `member denied moderator ${method} ${route}`);
  for (const role of ["moderator", "admin"]) {
    const result = await request(route, cookies[role], method);
    if (result.status >= 400) throw new Error(`${role} ${method} ${route}: expected success, got ${result.status} ${result.body.slice(0,160)}`);
    console.log(`PASS ${role} allowed ${method} ${route} -> ${result.status}`);
  }
}

for (const [route, method, requiredRole] of protectedMutations) {
  // Probe denial boundaries only. Some valid writes (read-all notifications, thread
  // deletion, session revocation, category deletion) are destructive in production.
  const unauth = await request(route, null, method);
  assertStatus(unauth.status, [401,403], `unauthenticated protected ${method} ${route}`);
  if (requiredRole === "moderator" || requiredRole === "admin") {
    const member = await request(route, cookies.member, method);
    assertStatus(member.status, [401,403], `member denied ${requiredRole} ${method} ${route}`);
  }
  if (requiredRole === "admin") {
    const moderator = await request(route, cookies.moderator, method);
    assertStatus(moderator.status, [401,403], `moderator denied admin ${method} ${route}`);
  }
}

for (const role of ["member", "moderator", "admin"]) {
  const shop = await request("/api/my-shop", cookies[role], "GET");
  if (shop.status !== 200) throw new Error(`${role} cannot access their own shop workspace: HTTP ${shop.status} ${shop.body.slice(0,160)}`);
  console.log(`PASS ${role} own shop workspace -> ${shop.status}`);
}
const anonymousBots = await request("/api/personal-bots", null, "GET");
assertStatus(anonymousBots.status, [401,403], "anonymous personal bot workspace");
const memberBots = await request("/api/personal-bots", cookies.member, "GET");
assertStatus(memberBots.status, [401,403], "member denied personal bot workspace");
for (const role of ["moderator", "admin"]) {
  const bots = await request("/api/personal-bots", cookies[role], "GET");
  if (bots.status !== 200) throw new Error(`${role} personal bot workspace failed: HTTP ${bots.status} ${bots.body.slice(0,160)}`);
  console.log(`PASS ${role} personal bot workspace -> ${bots.status}`);
}

console.log("Authorization audit completed successfully.");
