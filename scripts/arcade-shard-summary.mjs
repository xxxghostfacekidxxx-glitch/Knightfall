import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const root=path.resolve(process.argv[2]||"artifacts/shards");
const out=path.resolve(process.argv[3]||"artifacts/arcade-fleet-summary.json");
const expected=Number(process.env.ARCADE_SHARD_COUNT||10);
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
 try {const report=JSON.parse(await readFile(file,"utf8"));if(Number.isInteger(report.shardIndex)&&Array.isArray(report.assignedRoutes))reports.push({...report,file});}
 catch(error){console.error("Invalid shard report:",file,error.message);process.exitCode=1;}
}
const targets=[...new Set(reports.map(r=>r.target))];
const summaries={};
for(const target of targets) {
 const group=reports.filter(r=>r.target===target), counts=new Map(), indexes=new Map(), failures=[];
 for(const r of group) {
  indexes.set(r.shardIndex,(indexes.get(r.shardIndex)||0)+1);
  for(const route of r.assignedRoutes)counts.set(route,(counts.get(route)||0)+1);
  for(const result of r.results||[])if(result.status==="failed")failures.push({shard:r.shardIndex,profile:r.profile,...result});
 }
 const missingShards=Array.from({length:expected},(_,i)=>i).filter(i=>!indexes.has(i));
 const malformedReports=group.filter(r=>r.shardCount!==expected||r.assigned!==r.assignedRoutes.length||r.passed+r.failed!==r.assigned||!Array.isArray(r.results)||r.results.length!==r.assigned||r.results.some(result=>!r.assignedRoutes.includes(result.route))).map(r=>({file:r.file,shard:r.shardIndex}));
 const duplicatedShards=[...indexes].filter(([,count])=>count!==1).map(([index,count])=>({index,count}));
 const duplicatedRoutes=[...counts].filter(([,count])=>count!==1).map(([route,count])=>({route,count}));
 const catalogSizes=[...new Set(group.map(r=>r.totalCatalog))];
 const expectedRoutes=catalogSizes.length===1?catalogSizes[0]:null;
 const coverageOk=missingShards.length===0&&duplicatedShards.length===0&&duplicatedRoutes.length===0&&malformedReports.length===0&&expectedRoutes===counts.size&&failures.length===0;
 summaries[target]={reports:group.length,expectedShards:expected,expectedRoutes,coveredRoutes:counts.size,missingShards,duplicatedShards,duplicatedRoutes,malformedReports,failures,coverageOk};
 if(!coverageOk)process.exitCode=1;
}
if(!targets.includes("local")||process.env.ARCADE_REQUIRE_LIVE==="1"&&!targets.includes("live"))process.exitCode=1;
const summary={generatedAt:new Date().toISOString(),reportsFound:files.length,targets:summaries,passed:!process.exitCode};
await mkdir(path.dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(summary,null,2));
console.log(JSON.stringify({passed:summary.passed,targets:Object.fromEntries(Object.entries(summaries).map(([key,value])=>[key,{reports:value.reports,coveredRoutes:value.coveredRoutes,missingShards:value.missingShards,duplicatedRoutes:value.duplicatedRoutes.length,failures:value.failures.length,coverageOk:value.coverageOk}]))},null,2));
