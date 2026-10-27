const base = process.env.STAGING_API;
if (!base) throw Error("STAGING_API required");
const url = new URL(base);
if (url.protocol !== "https:" || !(url.hostname === "staging.api.ash-fall.com" || (url.hostname.startsWith("staging-") && url.hostname.endsWith(".workers.dev")))) throw Error("Dedicated staging host required");
const cases = [
  ["/api/admin/overview", 403],
  ["/api/admin/settings", 403],
  ["/api/admin/audit", 403],
  ["/api/personal-bots", 401],
  ["/api/vault/items", 401],
  ["/api/vault/summary", 401],
  ["/api/notifications", 401],
  ["/api/messages/conversations", 401]
];
let failures = 0;
for (const [route, expected] of cases) {
  const response = await fetch(new URL(route, url), {redirect:"manual"});
  if (response.status !== expected) {
    console.error(route, "expected", expected, "got", response.status);
    failures++;
  } else console.log("PASS", route);
}
if (failures) process.exitCode = 1;
