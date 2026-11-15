import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const runtime=read('public/knightfall-art-runtime.js');
const studio=read('public/creator-motion-preview.js');
const foundry=read('public/devil-tools.html');
const city=read('public/city-of-cinders.html');
const shooter=read('public/not-dead-yet.html');
const crossing=read('public/arcade/hosted/cinder-crossing/index.html');
const marsh=read('public/arcade/hosted/marshland-marksman/index.html');
const manifest=JSON.parse(read('public/assets/knightfall/manifest.json'));

function canvas(){
 const ops=[];
 return {ops,save(){ops.push(['save'])},restore(){ops.push(['restore'])},translate(...args){ops.push(['translate',...args])},scale(...args){ops.push(['scale',...args])},rotate(...args){ops.push(['rotate',...args])},drawImage(...args){ops.push(['drawImage',...args])}};
}
async function buildRuntime(){
 class FakeImage{
   constructor(){this.naturalWidth=1448;this.naturalHeight=1086;}
   set src(value){this._src=value;queueMicrotask(()=>this.onload?.())}
 }
 const sandbox={Image:FakeImage,fetch:async()=>({ok:true,json:async()=>manifest})};
 const transformed=runtime.replace('export async function loadKnightfallArt','async function loadKnightfallArt')+'\nthis.testLoad=loadKnightfallArt;';
 vm.runInNewContext(transformed,sandbox,{timeout:1000});
 return await sandbox.testLoad();
}
test('pose renderer draws known original characters while restoring canvas state',async()=>{
 const art=await buildRuntime(),ctx=canvas();
 assert.equal(art.list().length,16);
 assert.ok(art.has('bone-raccoon'));
 assert.equal(art.drawMotion(ctx,'bone-raccoon',10,20,100,70,{state:'run',time:1.5,flipX:true}),true);
 assert.equal(ctx.ops.filter(x=>x[0]==='drawImage').length,1);
 assert.equal(ctx.ops.filter(x=>x[0]==='save').length,ctx.ops.filter(x=>x[0]==='restore').length);
 assert.ok(ctx.ops.some(x=>x[0]==='scale'&&x[1]===-1));
 assert.equal(art.drawMotion(ctx,'not-a-real-character',10,20,100,70),false);
 assert.equal(art.drawMotion(ctx,'bone-raccoon',10,20,-1,70),false);
});
test('reduced-motion pose avoids animated bobs while still drawing image',async()=>{
 const art=await buildRuntime();
 const ctx=canvas();
 assert.equal(art.drawMotion(ctx,'spectral-wolf',8,14,110,70,{state:'walk',time:2,reducedMotion:true}),true);
 const moves=ctx.ops.filter(x=>x[0]==='translate');
 assert.equal(moves.length,1,'reduced-motion rendering uses one stable foot-anchor translation');
 assert.deepEqual(moves[0].slice(1),[63,84]);
 assert.equal(ctx.ops.filter(x=>x[0]==='drawImage').length,1);
});
test('City and zombie shooter accept motion artwork without replacing gameplay mechanics',()=>{
 const inline=html=>[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
 for(const html of [city,shooter,crossing,marsh])for(const code of inline(html))assert.doesNotThrow(()=>new vm.Script(code));
 assert.match(city,/id="kf-city-skin"/);
 assert.match(city,/cityArt\.drawMotion/);
 assert.match(city,/if\(drawn\)return/);
 assert.match(city,/function punch\(\)/);
 assert.match(shooter,/id="kf-ndy-art"/);
 assert.match(shooter,/ndyArt\.drawMotion/);
 assert.match(shooter,/else if\(sprite\?\.complete&&sprite\.naturalWidth\)ctx\.drawImage/);
 assert.match(crossing,/premiumArt\.drawMotion/);
 assert.match(marsh,/premiumArt\.drawMotion/);
});
test('Creator studio loads original motion renderer with functional PNG export and accessible controls',()=>{
 assert.doesNotThrow(()=>new vm.Script(studio.replace(/^import[^\n]*\n/m,'')));
 assert.match(foundry,/id="kf-pose-canvas"/);
 assert.match(foundry,/id="kf-pose-sprite"/);
 assert.match(foundry,/id="kf-pose-state"/);
 assert.match(foundry,/creator-motion-preview\.js/);
 assert.match(foundry,/creator-motion-preview\.css/);
 assert.match(studio,/canvas\.toBlob\(/);
 assert.match(studio,/IntersectionObserver/);
 assert.match(studio,/prefers-reduced-motion/);
 assert.match(foundry,/id="kf-pose-sheet"/);
 assert.match(foundry,/id="kf-pose-json"/);
 assert.match(studio,/cfg\.frameW\*cfg\.count/);
 assert.match(studio,/8frames\.png/);
 assert.match(studio,/8frames\.json/);
});
