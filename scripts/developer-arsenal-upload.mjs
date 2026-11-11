import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";

const secret = process.env.KNIGHTFALL_DIAGNOSTICS_INGEST_KEY;
const endpoint = process.env.KNIGHTFALL_DIAGNOSTICS_INGEST_URL || "https://api.ash-fall.com/api/internal/developer-audit";
const branch = process.env.GITHUB_REF;
const runId = Number(process.env.GITHUB_RUN_ID);
const sha = process.env.GITHUB_SHA;

if (!secret) {
  console.log("Diagnostics ingest secret is not configured; private synchronization skipped.");
  process.exit(0);
}
if (secret.length < 32) throw new Error("Diagnostics ingest key must contain at least 32 characters.");
if (branch !== "refs/heads/main") {
  console.log("Only main branch reports may be uploaded.");
  process.exit(0);
}
if (!Number.isSafeInteger(runId) || runId < 1 || !/^[a-f0-9]{40}$/.test(sha || "")) {
  throw new Error("Invalid CI provenance.");
}
if (new URL(endpoint).protocol !== "https:" || new URL(endpoint).pathname !== "/api/internal/developer-audit") {
  throw new Error("Diagnostic endpoint must be HTTPS and use the authorized path.");
}
const summary = JSON.parse(await readFile("developer-arsenal-summary.json", "utf8"));
const body = JSON.stringify({runId,sha,summary});
if (Buffer.byteLength(body) > 16384) throw new Error("Audit report exceeds upload limit.");
const timestamp = String(Date.now());
const signature = createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 15000);
try {
  const result = await fetch(endpoint, {
    method: "POST",
    headers: {"content-type":"application/json","x-kf-audit-time":timestamp,"x-kf-audit-signature":signature},
    body,
    signal:controller.signal,
    redirect:"error"
  });
  if (result.status !== 204) throw new Error("Audit upload rejected: HTTP " + result.status);
  console.log("Verified audit counts uploaded for run " + runId + ".");
} finally {
  clearTimeout(timer);
}
