import { readdir, readFile, mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
const root=path.resolve(process.argv[2]||"artifacts/shards");
const out=path.resolve(process.argv[3]||"artifacts/arcade-fleet-summary.json");
const expected=Number(process.env.ARCADE_SHARD_COUNT||10);
if (!Number.isInteger(expected) || expected < 1) throw Error("Invalid shard count");
const catalog=JSON.parse(await readFile(new URL("../public/arcade/catalog.json",import.meta.url),"utf8"));
const routes=[...new Set(catalog.games.filter(g=>typeof g.route==="string"&&g.route.startsWith("/arcade/hosted/")).map(g=>g.route))].sort((a,b)=>a.localeCompare(b));
async function find(dir) {
 const found=[];
 for(const entry of await readdir(dir,{withFileTypes:true}).catch(()=>[])) {
  const p=path.join(dir,entry.name);
  if(entry.isDirectory())found.push(...await find(p));
  else if(entry.name==="report.json")found.push(p);
 }
 return found;
}
const files=await find(root), reports=[];
for(const file of files) {
 try {const report=JSON.parse(await readFile(file,"utf8"));if(Number.isInteger(report.shardIndex)&&report.shardIndex>=0&&report.shardIndex<expected&&Array.isArray(report.assignedRoutes))reports.push({...report,file});else throw Error("Malformed shard report");}
 catch(error){console.error("Invalid shard report:",file,error.message);process.exitCode=1;}
}
for(const report of reports){for(const result of report.results||[]){if(result.status!=="failed")continue;const filename=result.screenshot;if(typeof filename!=="string"||!/^\d{3}\.png$/.test(filename)){result.screenshotMissing=true;continue}const evidence=await stat(path.join(path.dirname(report.file),filename)).catch(()=>null);if(!evidence?.isFile()||evidence.size===0)result.screenshotMissing=true;}}
const targets=[...new Set(reports.map(r=>r.target))];
if(targets.some(t=>t!=="local"&&t!=="live"))process.exitCode=1;
const summaries={};
for(const target of targets) {
 const group=reports.filter(r=>r.target===target), counts=new Map(), indexes=new Map(), failures=[];
 for(const r of group) {
  indexes.set(r.shardIndex,(indexes.get(r.shardIndex)||0)+1);
  for(const route of r.assignedRoutes)counts.set(route,(counts.get(route)||0)+1);
  for(const result of r.results||[])if(result.status==="failed")failures.push({shard:r.shardIndex,profile:r.profile,target,game:result.game,route:result.route,action:result.action,status:result.status,error:result.error,screenshot:result.screenshot,browserErrors:result.browserErrors,networkErrors:result.networkErrors});
 }
 const missingShards=Array.from({length:expected},(_,i)=>i).filter(i=>!indexes.has(i));
 const malformedReports=group.filter(r=>r.shardCount!==expected||r.shardIndex<0||r.shardIndex>=expected||r.totalCatalog!==routes.length||JSON.stringify(r.assignedRoutes)!==JSON.stringify(routes.filter((_,i)=>i%expected===r.shardIndex))||r.assigned!==r.assignedRoutes.length||r.passed!==r.results?.filter(x=>x.status==="passed").length||r.failed!==r.results?.filter(x=>x.status==="failed").length||r.passed+r.failed!==r.assigned||!Array.isArray(r.results)||r.results.length!==r.assigned||new Set(r.assignedRoutes).size!==r.assignedRoutes.length||r.results.some(result=>!r.assignedRoutes.includes(result.route))||new Set(r.results.map(result=>result.route)).size!==r.assignedRoutes.length||r.results.some(result=>result.status!=="passed"&&result.status!=="failed")||r.results.some(result=>result.status==="failed"&&!result.error&&!result.reason)||r.results.some(result=>result.status==="failed"&&(typeof result.screenshot!=="string"||result.screenshotMissing))).map(r=>({file:r.file,shard:r.shardIndex}));
 const duplicatedShards=[...indexes].filter(([,count])=>count!==1).map(([index,count])=>({index,count}));
 const duplicatedRoutes=[...counts].filter(([,count])=>count!==1).map(([route,count])=>({route,count}));
 const catalogSizes=[...new Set(group.map(r=>r.totalCatalog))];
 const expectedRoutes=routes.length;
 const coverageOk=catalogSizes.length===1&&catalogSizes[0]===routes.length&&missingShards.length===0&&duplicatedShards.length===0&&duplicatedRoutes.length===0&&malformedReports.length===0&&expectedRoutes===counts.size&&failures.length===0;
 summaries[target]={reports:group.length,expectedShards:expected,expectedRoutes,coveredRoutes:counts.size,missingShards,duplicatedShards,duplicatedRoutes,malformedReports,failures,coverageOk};
 if(!coverageOk)process.exitCode=1;
}
if(files.length!==reports.length)process.exitCode=1;
if(!targets.includes("local")||process.env.ARCADE_REQUIRE_LIVE==="1"&&!targets.includes("live"))process.exitCode=1;
const summary={generatedAt:new Date().toISOString(),reportsFound:files.length,catalogRoutes:routes.length,targets:summaries,passed:!process.exitCode};
await mkdir(path.dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(summary,null,2));
console.log(JSON.stringify({passed:summary.passed,targets:Object.fromEntries(Object.entries(summaries).map(([key,value])=>[key,{reports:value.reports,coveredRoutes:value.coveredRoutes,missingShards:value.missingShards,duplicatedRoutes:value.duplicatedRoutes.length,failures:value.failures.length,coverageOk:value.coverageOk}]))},null,2));
