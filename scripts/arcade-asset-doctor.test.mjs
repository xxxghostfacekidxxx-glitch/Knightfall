import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const source = path.resolve("scripts/arcade-asset-doctor.mjs");
test("asset doctor fixes only existing safe targets and reports missing relative assets", async () => {
 const dir = await mkdtemp(path.join(tmpdir(),"arcade-doctor-"));
 try {
  await mkdir(path.join(dir,"public/arcade/demo"),{recursive:true});
  await mkdir(path.join(dir,"scripts"),{recursive:true});
  await cp(source,path.join(dir,"scripts/arcade-asset-doctor.mjs"));
  await writeFile(path.join(dir,"public/arcade/demo/game.js"),"console.log('ok')");
  const html='<script src="public/game.js"></script><script src="missing.js"></script><script src="/public/arcade/demo/game.js"></script><a href="https://example.org/a.js">external</a>';
  const target=path.join(dir,"public/arcade/demo/index.html");
  await writeFile(target,html);
  const run=spawnSync(process.execPath,["scripts/arcade-asset-doctor.mjs","--fix"],{cwd:dir,encoding:"utf8"});
  assert.equal(run.status,2,run.stderr);
  const report=JSON.parse(run.stdout);
  assert.equal(report.repairs,2);
  assert.equal(report.missingAssets,1);
  const output=await readFile(target,"utf8");
  assert.match(output,/src="game.js"/);
  assert.match(output,/src="\/arcade\/demo\/game.js"/);
  assert.match(output,/src="missing.js"/);
  assert.match(output,/https:\/\/example.org\/a.js/);
 } finally {await rm(dir,{recursive:true,force:true})}
});
