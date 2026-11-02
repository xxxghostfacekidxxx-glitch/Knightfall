import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";

const read=path=>readFileSync(path,"utf8");
const root="public/arcade/hosted/";
const fxSource=read("public/arcade/canvas-fx.js");

test("CanvasFX parses and runs standalone without dependencies",()=>{
 assert.doesNotThrow(()=>new Script(fxSource));
 const window={matchMedia:()=>({matches:false})},document={hidden:false};
 runInNewContext(fxSource,{window,document,Math});
 assert.equal(typeof window.AshFallCanvasFX.create,"function");
 const calls=[];
 const gradient=()=>({addColorStop(){}});
 const ctx={
  save(){calls.push("save")},restore(){calls.push("restore")},fillRect(){calls.push("fillRect")},
  beginPath(){calls.push("beginPath")},arc(){calls.push("arc")},stroke(){calls.push("stroke")},
  fill(){calls.push("fill")},moveTo(){},lineTo(){},
  createLinearGradient:gradient,createRadialGradient:gradient
 };
 const fx=window.AshFallCanvasFX.create();
 fx.sky(ctx,1200,720,520,"lander");
 fx.sky(ctx,1200,900,560,"space");
 fx.sky(ctx,1200,600,420,"lab");
 fx.impact(200,180,"#ff38ce",2);
 fx.trail(220,190,20,10,"#4cf4ff",1);
 assert.ok(fx.particles.length>0,"effects queue should have particles");
 fx.step(.016);fx.draw(ctx);
 assert.ok(calls.includes("stroke")&&calls.includes("fill"),"should paint neon impacts");
 assert.ok(fx.particles.length<=140,"must respect mobile particle budget");
 fx.reset();assert.equal(fx.particles.length,0);assert.equal(fx.rings.length,0);
 fx.impact(40,40);document.hidden=true;fx.step(.016);
 assert.equal(fx.particles.length,0,"hidden games must stop drawing particles");
 document.hidden=false;window.matchMedia=()=>({matches:true});
 fx.impact(10,10);assert.equal(fx.particles.length,0,"reduced motion must suppress effects");
});

test("five original canvas games load CanvasFX before their game scripts",()=>{
 const routes=["cinder-drift","cinder-lander","particle-panic","cinder-crossing","space-fighter"];
 for(const slug of routes){
  const html=read(root+slug+"/index.html");
  const fx=html.indexOf('src="/arcade/canvas-fx.js?v=20261102-2"');
  assert.ok(fx>=0,slug+" missing CanvasFX");
  const inline=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
   .map(match=>match[1]).filter(text=>text.trim());
  for(const js of inline)assert.doesNotThrow(()=>new Script(js),slug+" inline script");
  const engine=slug==="cinder-lander"?'src="/arcade/hosted/cinder-lander/game.js"':"<script>";
  assert.ok(html.indexOf(engine,fx)>fx,slug+" engine must come after visual helper");
 }
 assert.doesNotThrow(()=>new Script(read(root+"cinder-lander/game.js")));
});
