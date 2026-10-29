import {build} from 'esbuild';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const [source,destination]=process.argv.slice(2).map(p=>path.resolve(p));
const helper=path.dirname(new URL(import.meta.url).pathname);
await copyFile(path.join(helper,'bq-worker.cjs'),path.join(source,'knightfall-worker.cjs'));
const map=await readFile(path.join(source,'server/maps/world_server.json'),'utf8');
await build({entryPoints:[path.join(source,'knightfall-worker.cjs')],outfile:path.join(destination,'knightfall-world.js'),bundle:true,format:'iife',platform:'browser',plugins:[{name:'legacy-node-adapters',setup(b){
 b.onResolve({filter:/^(fs|path|log|sanitizer|underscore)$/},a=>({path:a.path,namespace:'adapter'}));
 b.onLoad({filter:/.*/,namespace:'adapter'},async a=>({contents:a.path==='fs'?`module.exports={readFile(p,cb){setTimeout(()=>cb(null,${JSON.stringify(map)}),0)}}`:a.path==='path'?`module.exports={exists(p,cb){setTimeout(()=>cb(true),0)}}`:a.path==='log'?`module.exports=function(){}`:a.path==='sanitizer'?`module.exports={sanitize:s=>String(s).replace(/<[^>]*>/g,''),escape:s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}`:await readFile(path.join(source,'client/js/lib/underscore.min.js'),'utf8'),loader:'js'}));
 }}]});
