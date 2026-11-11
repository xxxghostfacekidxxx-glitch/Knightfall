import { readFile, writeFile, appendFile } from "node:fs/promises";

// Intentionally strips snippets, file paths, rule messages and matched secrets.
// It is safe to surface as an administrative diagnostic summary.
export function summarizeAudit({semgrep, biomeText = ""}) {
  const findings = Array.isArray(semgrep?.results) ? semgrep.results : [];
  const severity = { ERROR: 0, WARNING: 0, INFO: 0, UNKNOWN: 0 };
  for (const item of findings) {
    const level = String(item?.extra?.severity || "").toUpperCase();
    severity[Object.hasOwn(severity, level) ? level : "UNKNOWN"]++;
  }
  const errors = Array.isArray(semgrep?.errors) ? semgrep.errors.length : 0;
  const text = String(biomeText);
  const biome = {
    // Do not include diagnostic text or file names in the exported summary.
    hasOutput: text.trim().length > 0,
    reportedErrors: Number(text.match(/Found (\d+) errors?/i)?.[1] || 0),
    reportedWarnings: Number(text.match(/Found \d+ errors? and (\d+) warnings?/i)?.[1] || text.match(/Found (\d+) warnings?/i)?.[1] || 0)
  };
  return {
    schemaVersion: 1,
    tool: "knightfall-developer-arsenal",
    semgrep: { findings: findings.length, severity, scannerErrors: errors },
    biome,
    note: "Counts only. No matched source, paths, secrets, identities or private data."
  };
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  const [semgrepPath = "semgrep-report.json", biomePath = "biome-report.txt"] = process.argv.slice(2);
  const semgrep = JSON.parse(await readFile(semgrepPath, "utf8"));
  const biomeText = await readFile(biomePath, "utf8").catch(() => "");
  const report = summarizeAudit({ semgrep, biomeText });
  await writeFile("developer-arsenal-summary.json", JSON.stringify(report, null, 2) + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      "\n### Sanitized scanner totals\n" +
      "- Semgrep findings: " + report.semgrep.findings + "\n" +
      "- Semgrep scanner errors: " + report.semgrep.scannerErrors + "\n" +
      "- Severity counts: ERROR " + report.semgrep.severity.ERROR +
      ", WARNING " + report.semgrep.severity.WARNING +
      ", INFO " + report.semgrep.severity.INFO +
      ", UNKNOWN " + report.semgrep.severity.UNKNOWN + "\n" +
      "- Biome output present: " + report.biome.hasOutput + "\n" +
      "\nDetailed findings are intentionally excluded from this summary.\n");
  }
  console.log(JSON.stringify(report));
}
