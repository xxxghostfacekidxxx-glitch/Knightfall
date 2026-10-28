// Guard known gameplay regressions. Exact, reviewable repairs only.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const apply=process.argv.includes("--fix");
const root=path.resolve("public/arcade/hosted");
const rules=[
 {file:"arcade-cabinet-engine.js",id:"kaiju-hitbox",bad:'let i=items.findIndex(o=>Math.hypot(o.x-q.x,o.y-q.y)<o.r+14);',good:'let i=items.findIndex(o=>mode==="kaiju"?(Math.abs(o.x-q.x)<(o.w||42)/2+12&&q.y>=520-(o.h||90)-12&&q.y<=532):Math.hypot(o.x-q.x,o.y-q.y)<(o.r||20)+14);'}
];
const invariants=[
 {file:"ashfall-mini-games.js",id:"mini-cloud-save-identity",pattern:/s\.schema===1&&s\.game===id&&s\.state/},
 {file:"ashfall-mini-games.js",id:"mini-device-save-shape",pattern:/typeof s\.state==="object"&&!Array\.isArray\(s\.state\)/},
 {file:"arcade-cabinet-engine.js",id:"blocks-fall-and-lock",pattern:/if\(mode==="blocks"&&frame%16===0\)/},
 {file:"arcade-cabinet-engine.js",id:"blocks-row-clearing",pattern:/grid=grid\.filter\(row=>/},
 {file:"arcade-cabinet-engine.js",id:"storage-safe-boot",pattern:/best=\(\(\)=>\{try\{return Math\.max/},
 {file:"arcade-cabinet-engine.js",id:"adjacent-digging",pattern:/Math\.abs\(xx-p\.x\)\+Math\.abs\(yy-p\.y\)===1/},
 {file:"ashfall-mini-games.js",id:"async-resume-syntax",pattern:/async function resume\(\)\{try\{await/},
 {file:"ashfall-mini-games.js",id:"tap-start-all-mini-games",pattern:/if\(!running\)\{start\(\);return\}/},
 {file:"ashfall-mini-games.js",id:"validate-local-mini-saves",pattern:/if\(x&&validSavedState\(x\.state\)\)/},
 {file:"arcade-cabinet-engine.js",id:"score-button-finally",pattern:/finally\{saveScoreButton\.disabled=false\}/},
 {file:"arcade-cabinet-engine.js",id:"tap-to-jump",pattern:/if\(mode==="flap"\|\|mode==="runner"\)\{p\.vy=-9;draw\(\);return\}/},
 {file:"arcade-cabinet-engine.js",id:"tap-to-steer",pattern:/if\(mode==="race"\|\|mode==="breakout"\)\{p\.x=mode==="race"/},
 {file:"arcade-cabinet-engine.js",id:"mobile-drag-steering",pattern:/c\.addEventListener\("pointermove",e=>\{/},
 {file:"arcade-cabinet-engine.js",id:"race-touch-bounds",pattern:/mode==="race"\?clamp\(q\.x,250,710\)/}
];
const findings=[];
for(const rule of rules){
 const file=path.join(root,rule.file);
 const source=await readFile(file,"utf8");
 if(source.includes(rule.good) && rule.good!==rule.bad)continue;
 if(rule.bad===rule.good)continue;
 const matches=source.split(rule.bad).length-1;
 if(matches!==1){findings.push({rule:rule.id,status:"manual-review",matches});continue}
 if(apply)await writeFile(file,source.replace(rule.bad,rule.good));
 findings.push({rule:rule.id,status:apply?"repaired":"repair-available"});
}
for(const check of invariants){const source=await readFile(path.join(root,check.file),"utf8");if(!check.pattern.test(source))findings.push({rule:check.id,status:"manual-review",reason:"Gameplay invariant missing"});}
if(findings.some(item=>item.status==="manual-review"))process.exitCode=1;
console.log(JSON.stringify({mode:apply?"fix":"audit",findings},null,2));
