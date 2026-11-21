// Read-only, optional Cloudflare GraphQL telemetry.
// Configure CLOUDFLARE_ANALYTICS_TOKEN (Worker secret) and CLOUDFLARE_ACCOUNT_ID
// (Worker variable). No browser credentials, D1 writes or KV polling.
const QUERY = `query KnightfallWorkerTraffic($accountTag: string, $start: string, $end: string, $script: string) {
 viewer { accounts(filter: { accountTag: $accountTag }) {
  workersInvocationsAdaptive(limit: 1, filter: { scriptName: $script, datetime_geq: $start, datetime_leq: $end }) {
   sum { requests errors subrequests }
  }
 } }
}`;
let snapshot = null;
let expires = 0;
export async function readWorkerTraffic(env, now = Date.now(), fetcher = fetch) {
 if (!env.CLOUDFLARE_ANALYTICS_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID)
  return { available: false, reason: "Cloudflare analytics credentials not configured." };
 if (snapshot && now < expires) return snapshot;
 const start = new Date(now); start.setUTCHours(0,0,0,0);
 try {
  const response = await fetcher("https://api.cloudflare.com/client/v4/graphql", {
   method: "POST",
   headers: { Authorization: "Bearer " + env.CLOUDFLARE_ANALYTICS_TOKEN, "content-type": "application/json" },
   body: JSON.stringify({ query: QUERY, variables: {
    accountTag: env.CLOUDFLARE_ACCOUNT_ID,
    start: start.toISOString(),
    end: new Date(now).toISOString(),
    script: "knightfall-api"
   } })
  });
  if (!response.ok) throw Error("Cloudflare analytics returned HTTP " + response.status);
  const payload = await response.json();
  if (payload.errors?.length) throw Error("Cloudflare analytics query rejected");
  const accounts = payload.data?.viewer?.accounts;
  if (!Array.isArray(accounts)) throw Error("Cloudflare analytics response missing account data");
  const sums = (accounts[0]?.workersInvocationsAdaptive || []).map(row => row.sum || {});
  const sum = field => sums.reduce((n,row) => n + Number(row[field] || 0),0);
  snapshot = { available: true, source: "Cloudflare GraphQL Analytics", scope: "knightfall-api only", period_start: start.toISOString(), observed_at: new Date(now).toISOString(), requests: sum("requests"), errors: sum("errors"), subrequests: sum("subrequests"), note: "Analytics estimates are not official billable account totals." };
  expires = now + 5 * 60 * 1000;
  return snapshot;
 } catch(error) {
  // Do not leak GraphQL responses, token, or account details.
  console.warn("quota_analytics_unavailable", error instanceof Error ? error.message : "unknown");
  return { available: false, reason: "Cloudflare analytics temporarily unavailable." };
 }
}
