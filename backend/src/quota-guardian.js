import { readWorkerTraffic } from "./quota-telemetry.js";
// Read-only resource guardian. Never exposes provider credentials or claims live usage
// without a Cloudflare analytics integration.
export const FREE_TIER_BUDGETS = Object.freeze({
  worker_requests_daily: 100000,
  kv_reads_daily: 100000,
  kv_writes_daily: 1000,
  d1_rows_read_daily: 5000000,
  d1_rows_written_daily: 100000,
  workers_ai_neurons_daily: 10000,
  queues_operations_daily: 10000
});

export function quotaStatus(usage, limit) {
  if (!Number.isFinite(usage) || usage < 0 || !Number.isFinite(limit) || limit <= 0) return "unknown";
  const fraction = usage / limit;
  return fraction >= 1 ? "exhausted" : fraction >= 0.9 ? "critical" : fraction >= 0.75 ? "elevated" : fraction >= 0.5 ? "warning" : "healthy";
}

export async function handleQuotaGuardian(request, env, url, { requireUser, json, origin }) {
  if (url.pathname !== "/api/admin/quota-guardian") return null;
  if (request.method !== "GET") return json({ error: "Method not allowed." }, 405, origin);
  const user = await requireUser(request, env);
  // GOD alone. ISIS/admin/staff cannot inspect the private infrastructure panel.
  if (!user || user.role !== "god") return json({ error: "Forbidden." }, 403, origin);
  const rows = await env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN reset_at <= ? THEN 1 ELSE 0 END) AS expired FROM request_rate_limits").bind(Date.now()).first();
  const workerTraffic = await readWorkerTraffic(env);
  const workerRequestBudget = workerTraffic.available
    ? {
        used: workerTraffic.requests,
        reference_limit: FREE_TIER_BUDGETS.worker_requests_daily,
        status: quotaStatus(workerTraffic.requests, FREE_TIER_BUDGETS.worker_requests_daily),
        thresholds_percent: [50, 75, 90]
      }
    : { status: "unknown", thresholds_percent: [50, 75, 90] };
  return json({
    ok: true,
    worker_traffic: workerTraffic,
    worker_request_budget: workerRequestBudget,
    collected_at: new Date().toISOString(),
    provider_usage_available: false,
    provider_usage_note: "Daily Cloudflare account usage is not connected. Limits are reference values, not consumption measurements.",
    free_tier_reference: FREE_TIER_BUDGETS,
    local_diagnostics: {
      rate_limit_counter_rows: Number(rows?.total || 0),
      expired_rate_limit_counter_rows: Number(rows?.expired || 0),
      rate_limit_storage: "D1",
      rate_limit_cleanup_batch_size: 500
    },
    configured_services: {
      d1: Boolean(env.DB),
      kv: Boolean(env.SESSIONS),
      ai: Boolean(env.AI),
      native_message_rate_limiter: Boolean(env.MESSAGE_RATE_LIMITER),
      message_live: Boolean(env.MESSAGE_LIVE),
      imp_inferno_rooms: Boolean(env.IMP_INFERNO_ROOMS),
      public_assets: Boolean(env.PUBLIC_ASSETS),
      profile_media: Boolean(env.PROFILE_MEDIA),
      message_attachments: Boolean(env.MESSAGE_ATTACHMENTS),
      creator_media: Boolean(env.CREATOR_MEDIA)
    }
  }, 200, origin);
}
