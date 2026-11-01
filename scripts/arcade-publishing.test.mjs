import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const workflow=readFileSync(".github/workflows/arcade-test-fleet.yml","utf8");
test("dashboard report publication only runs for main non-PR builds",()=>{
 const job=workflow.split("  publish-dashboard:")[1]?.split("\n  safe-auto-repair:")[0];
 assert.ok(job,"dashboard publishing job missing");
 assert.match(job,/github\.ref == 'refs\/heads\/main'/);
 assert.match(job,/github\.event_name != 'pull_request'/);
 assert.match(job,/contents: write/);
 assert.match(job,/arcade-dashboard-report/);
 assert.match(job,/Skipping stale fleet report/);
 assert.match(job,/git push origin HEAD:main/);
});
