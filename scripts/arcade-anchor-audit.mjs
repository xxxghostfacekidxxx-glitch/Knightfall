import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../public");
const catalog=JSON.parse(await readFile(path.join(root,"arcade/catalog.json"),"utf8"));
const failures=[],checked=[];
const cache=new Map();
for(const game of catalog.games){
 const route=game.route||"";
 if(!route.startsWith("/")||!route.includes("#"))continue;
 const [pathname,fragment]=route.split("#",2);
 if(!fragment)continue;
 const file=path.resolve(root,"."+pathname.split("?")[0]);
 if(!file.startsWith(root+path.sep)){failures.push(game.id+": unsafe path");continue;}
 try{
  if(!cache.has(file))cache.set(file,await readFile(file,"utf8"));
  const html=cache.get(file);
  const id=decodeURIComponent(fragment);
  const escape=id.replace(/[.*+?^$()|[\]{}]/g,"\\$&");
  const target=new RegExp("(?:id|name)=[\\\"']"+escape+"[\\\"']");
  if(!target.test(html))failures.push(game.id+": anchor #"+id+" missing from "+pathname);
  checked.push(game.id);
 }catch(e){failures.push(game.id+": "+String(e.message).slice(0,120));}
}
console.log("Arcade anchor audit:",checked.length,"fragment routes checked;",failures.length,"failures");
for(const failure of failures)console.error("FAIL:",failure);
if(failures.length)process.exitCode=1;
