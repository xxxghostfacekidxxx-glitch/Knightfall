import {readFile,writeFile,mkdir} from "node:fs/promises";
const catalog=JSON.parse(await readFile(new URL("../public/arcade/catalog.json",import.meta.url),"utf8"));
const games=catalog.games.filter(g=>g.collection==="external"&&/dragon.?ball|saiyan|star.?wars|7balls/i.test([g.id,g.title,g.description].join(" ")));
const results=[];
for(const game of games){
 const url=game.route;
 if(!/^https:\/\//i.test(url)){results.push({id:game.id,url,status:"invalid-url"});continue;}
 let status="unavailable",httpStatus=null,finalUrl=null;
 try{
  const response=await fetch(url,{method:"GET",redirect:"follow",signal:AbortSignal.timeout(12000),headers:{"user-agent":"Knightfall-Arcade-Link-Audit/1.0"}});
  httpStatus=response.status;finalUrl=response.url;
  status=response.ok?"reachable":"http-error";
  await response.body?.cancel();
 }catch(error){status="network-error";results.push({id:game.id,url,status,detail:String(error.message).slice(0,160)});continue;}
 results.push({id:game.id,url,status,httpStatus,finalUrl});
}
const report={checkedAt:new Date().toISOString(),checked:results.length,reachable:results.filter(x=>x.status==="reachable").length,results};
await mkdir("artifacts",{recursive:true});
await writeFile("artifacts/franchise-link-audit.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(results.some(x=>x.status!=="reachable"))process.exitCode=1;
