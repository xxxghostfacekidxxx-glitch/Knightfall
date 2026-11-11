/** Minimal, counts-only security report contract for a trusted Worker-side handler.
 * Never return raw scanner results, file paths, lines, secrets or code snippets.
 * No GitHub tokens or external fetches are performed here.
 */
const MAX_COUNT = 1000000;
function count(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_COUNT) {
    throw new Error("Invalid audit summary count.");
  }
  return value;
}
export function normalizeChaosAuditSummary(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.schemaVersion !== 1 ||
      raw.tool !== "knightfall-developer-arsenal") {
    throw new Error("Invalid audit summary format.");
  }
  const semgrep = raw.semgrep;
  const biome = raw.biome;
  if (!semgrep || !biome || typeof biome.hasOutput !== "boolean") {
    throw new Error("Invalid audit summary fields.");
  }
  const severity = {};
  for (const level of ["ERROR", "WARNING", "INFO", "UNKNOWN"]) {
    severity[level] = count(semgrep.severity?.[level]);
  }
  const findings = count(semgrep.findings);
  if (Object.values(severity).reduce((a,b)=>a+b,0) !== findings) {
    throw new Error("Inconsistent audit summary totals.");
  }
  return {
    schemaVersion: 1,
    tool: "knightfall-developer-arsenal",
    semgrep: { findings, severity, scannerErrors: count(semgrep.scannerErrors) },
    biome: {
      hasOutput: biome.hasOutput,
      reportedErrors: count(biome.reportedErrors),
      reportedWarnings: count(biome.reportedWarnings)
    },
    note: "Aggregate counts only; findings are not verified repairs."
  };
}

export function createChaosAuditSummaryHandler({loadReport}) {
  if (typeof loadReport !== "function") throw new Error("Trusted audit report loader required.");
  return async ({principal}) => {
    if (!principal?.id || principal.role !== "god") throw new Error("Not authorized.");
    const raw = await loadReport();
    return normalizeChaosAuditSummary(raw);
  };
}
