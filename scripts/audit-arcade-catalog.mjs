import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..','public');
const catalog=JSON.parse(readFileSync(resolve(root,'arcade/catalog.json'),'utf8'));
const errors=[],warnings=[],ids=new Set(),routes=new Map();
for(const game of catalog.games){
 if(ids.has(game.id))errors.push(game.id+': duplicate game id');
 ids.add(game.id);
 if(!['games','mini','experiments','external','unavailable'].includes(game.collection))errors.push(game.id+': invalid collection');
 if(!['touch','desktop'].includes(game.device))errors.push(game.id+': invalid device');
 const paths=[game.route,...(game.links||[]).map(x=>x.route)];
 for(const route of paths){
  if(/^https:\/\//.test(route)){if(game.collection!=='external')warnings.push(game.id+': external link outside external collection');continue}
  if(!route.startsWith('/')||route.includes('..')||route.includes('?')){errors.push(game.id+': unsafe route '+route);continue}
  const disk=resolve(root,'.'+route);
  if(!disk.startsWith(root+'/')){errors.push(game.id+': route escapes public');continue}
  if(!existsSync(disk)||!statSync(disk).isFile())errors.push(game.id+': missing '+route);
  if(routes.has(route)&&routes.get(route)!==game.id)warnings.push(game.id+': shares route with '+routes.get(route));
  routes.set(route,game.id);
 }
}
console.log(JSON.stringify({total:catalog.games.length,checkedRoutes:routes.size,errors,warnings},null,2));
if(errors.length)process.exitCode=1;
