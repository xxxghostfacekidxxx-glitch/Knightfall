#!/usr/bin/env node
import { mkdir, access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const vendor = path.join(root, "vendor");
const all = process.argv.includes("--all");
const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
await mkdir(vendor, { recursive: true });

const selected = catalog.projects.filter(project =>
  project.mode === "clone" || (all && project.mode === "reference-only" && project.license !== "VERIFY-UPSTREAM")
);
const blocked = catalog.projects.filter(project =>
  all && project.mode === "reference-only" && project.license === "VERIFY-UPSTREAM"
);
if (blocked.length) {
  console.log("Skipped entries with unverified upstream identity/license: " + blocked.map(p => p.id).join(", "));
}
let failures = 0;
for (const project of selected) {
  const target = path.join(vendor, project.id);
  try {
    await access(path.join(target, ".git"));
    console.log("SKIP already cloned: " + project.id);
    continue;
  } catch {}
  console.log("CLONE " + project.name + " -> " + path.relative(root, target));
  const result = spawnSync("git", ["clone", "--depth", "1", project.repository, target], { stdio: "inherit" });
  if (result.status !== 0) {
    failures++;
    console.error("FAILED: " + project.id + " (check network, Git, and upstream availability)");
  }
}
console.log("Toolkit sync complete. Cloned " + selected.length + " candidate(s); failures: " + failures + ".");
console.log("Nothing was built, executed, deployed, or copied into the production frontend.");
if (failures) process.exitCode = 1;
