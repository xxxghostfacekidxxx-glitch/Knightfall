import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..','public');
const catalog=JSON.parse(readFileSync(resolve(root,'arcade/catalog.json'),'utf8'));
const games=catalog.games.filter(g=>g.genre==='Card'||g.genre==='Board');
const errors=[],warnings=[],ids=new Set();
for(const game of games){
 if(ids.has(game.id))errors.push(game.id+': duplicate ID');ids.add(game.id);
 if(!game.title||!game.description)errors.push(game.id+': missing title or description');
 if(!game.route) {errors.push(game.id+': missing launch route');continue}
 if(/^https:\/\//.test(game.route)){if(game.collection!=='external')warnings.push(game.id+': external route not marked external');continue}
 if(!game.route.startsWith('/')||game.route.includes('..')){errors.push(game.id+': invalid route');continue}
 const pathname=game.route.split(/[?#]/)[0];
 if(!existsSync(resolve(root,'.'+pathname)))errors.push(game.id+': missing '+pathname);
}
for(const page of ['arcade-card-board.html','arcade-card-room.html','arcade-card-expansion.html'])if(!existsSync(resolve(root,page)))errors.push('Missing '+page);
console.log(JSON.stringify({cardAndBoardEntries:games.length,errors,warnings},null,2));
if(errors.length)process.exitCode=1;
