import { normalizeChaosAuditSummary, createChaosAuditSummaryHandler } from "../chaos-audit-summary.mjs";

const REPORT_KEY = "developer-arsenal:latest:v1";
const MAX_BYTES = 16384;
const MAX_AGE_MS = 5 * 60 * 1000;
const TTL_SECONDS = 60 * 60 * 24 * 30;
const enc = new TextEncoder();

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function expectedSignature(secret, timestamp, body) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  const raw = await crypto.subtle.sign("HMAC", key, enc.encode(timestamp + "." + body));
  return Array.from(new Uint8Array(raw), b=>b.toString(16).padStart(2,"0")).join("");
}
export async function verifyAuditUpload({secret, timestamp, signature, body, now = Date.now()}) {
  if (typeof secret !== "string" || secret.length < 32) return false;
  if (typeof timestamp !== "string" || !/^\d{13}$/.test(timestamp)) return false;
  const time = Number(timestamp);
  if (!Number.isSafeInteger(time) || Math.abs(now - time) > MAX_AGE_MS) return false;
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/.test(signature)) return false;
  if (typeof body !== "string" || enc.encode(body).length > MAX_BYTES) return false;
  return safeEqual(await expectedSignature(secret,timestamp,body), signature);
}
function sanitizeEnvelope(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid upload.");
  const runId = payload.runId;
  const sha = payload.sha;
  if (!Number.isSafeInteger(runId) || runId < 1) throw new Error("Invalid run ID.");
  if (typeof sha !== "string" || !/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid revision.");
  const summary = normalizeChaosAuditSummary(payload.summary);
  return {runId,sha,summary,createdAt:new Date().toISOString()};
}
export async function storeAuditUpload({env, body, timestamp, signature, now = Date.now()}) {
  if (!env?.SESSIONS?.put || !env?.SESSIONS?.get) throw new Error("Audit storage unavailable.");
  if (!(await verifyAuditUpload({secret:env.DIAGNOSTICS_INGEST_KEY,timestamp,signature,body,now}))) {
    return {ok:false,status:401};
  }
  const payload = sanitizeEnvelope(JSON.parse(body));
  // A replay cannot extend its life or overwrite the newest report.
  const replayKey = "developer-arsenal:run:" + payload.runId;
  if (await env.SESSIONS.get(replayKey)) return {ok:false,status:409};
  const prior = await env.SESSIONS.get(REPORT_KEY,"json");
  if (prior?.runId >= payload.runId) return {ok:false,status:409};
  await env.SESSIONS.put(replayKey,"1",{expirationTtl:TTL_SECONDS});
  await env.SESSIONS.put(REPORT_KEY,JSON.stringify(payload),{expirationTtl:TTL_SECONDS});
  return {ok:true,status:204};
}
export async function readGodAuditSummary({env,principal}) {
  const handler = createChaosAuditSummaryHandler({
    loadReport: async () => {
      const latest = await env?.SESSIONS?.get(REPORT_KEY,"json");
      if (!latest?.summary) throw new Error("No verified Developer Arsenal report is available.");
      return latest.summary;
    }
  });
  return handler({principal});
}
export const AUDIT_REPORT_KEY = REPORT_KEY;
