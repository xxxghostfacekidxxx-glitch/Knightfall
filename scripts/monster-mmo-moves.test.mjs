import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../public/monster-mmo-moves.js",import.meta.url),"utf8");
const {MOVES,learnset,ensureLoadout,equipMove,useMove}=await import("data:text/javascript,"+encodeURIComponent(source));
const creature=(id="minieddie",level=1,type="fire")=>({id,level,type,attack:10,hp:30,maxHp:30});
test("four starter slots, stable migration and no duplicate slots",()=>{
 const c=ensureLoadout(creature());
 assert.equal(c.equippedMoveIds.length,4);
 assert.equal(new Set(c.equippedMoveIds).size,4);
 c.movePp.swipe=2;ensureLoadout(c);assert.equal(c.movePp.swipe,2);
});
test("Mini Eddie unlocks progressively and keeps learned moves",()=>{
 const c=ensureLoadout(creature());assert.ok(!c.unlockedMoveIds.includes("tantrum"));
 c.level=40;ensureLoadout(c);assert.ok(c.unlockedMoveIds.includes("tantrum"));
 assert.ok(c.unlockedMoveIds.includes("eddieFrenzy"));
 assert.equal(c.equippedMoveIds.length,4);
 assert.equal(equipMove(c,2,"tantrum"),true);
 assert.equal(equipMove(c,1,"tantrum"),false);
});
test("PP and accuracy govern combat",()=>{
 const c=ensureLoadout(creature());const target={hp:100,type:"grass"};
 assert.equal(useMove(c,target,"tantrum").error,"Move is not equipped");
 const before=c.movePp.swipe;const result=useMove(c,target,"swipe",()=>1,()=>0);
 assert.ok(result.damage>0);assert.equal(c.movePp.swipe,before-1);
 c.movePp.swipe=0;assert.equal(useMove(c,target,"swipe").error,"No PP remaining");
});
test("every elemental type has an unlock",()=>{
 for(const type of ["fire","grass","water","electric","cosmic","ghost","air","thorn","stone"]){
 const c=creature("ordinary",30,type);assert.ok(learnset(c).length>=5,type);
 }
});
