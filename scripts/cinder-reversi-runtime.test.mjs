import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CinderReversi,HUMAN,CPU,xy,legalMoves,flipsFor,tally} from "../public/arcade/hosted/cinder-reversi/engine.mjs";
const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const original=()=>new CinderReversi({random:seeded(4)});
test("Reversi initializes exactly four pieces and four legal pink openings",()=>{
 const g=original();
 assert.deepEqual(g.counts,{human:2,cpu:2});
 assert.equal(g.board.length,64);
 assert.equal(g.turn,HUMAN);
 assert.equal(g.ended,false);
 assert.equal(g.moves,0);
 assert.deepEqual(g.humanMoves.map(({x,y})=>[x,y]),[[3,2],[2,3],[5,4],[4,5]]);
 assert.equal(flipsFor(g.board,0,0,HUMAN).length,0);
 assert.equal(flipsFor(g.board,2,3,HUMAN).length,1);
 assert.equal(flipsFor(g.board,-1,0,HUMAN).length,0);
 assert.equal(flipsFor(g.board,3.5,2,HUMAN).length,0);
 assert.equal(g.play(0,0).ok,false);
});
test("a human turn flips pieces, CPU chooses legal replies, undo resets the complete turn",()=>{
 const g=original(),start=[...g.board];
 const play=g.play(2,3);
 assert.equal(play.ok,true);assert.equal(play.flipped,1);
 assert.deepEqual(g.counts,{human:4,cpu:1});
 assert.equal(g.turn,CPU);
 assert.equal(g.play(1,1,HUMAN).ok,false);
 const cpu=g.chooseCpuMove();
 assert.ok(cpu);
 assert.ok(legalMoves(g.board,CPU).some(m=>m.x===cpu.x&&m.y===cpu.y));
 assert.equal(g.cpuMove().ok,true);
 assert.equal(g.turn,HUMAN);
 assert.equal(g.moves,2);
 assert.equal(g.undoHumanTurn(),true);
 assert.deepEqual(g.board,start);
 assert.equal(g.turn,HUMAN);
 assert.equal(g.moves,0);
 assert.equal(g.undoHumanTurn(),false);
});
test("CPU difficulty gates, deterministic choice, strongest corner preference",()=>{
 const g=original();
 assert.equal(g.setDifficulty("unclear"),false);
 assert.equal(g.setDifficulty("casual"),true);
 g.play(2,3);
 assert.ok(g.chooseCpuMove("casual"));
 assert.equal(g.setDifficulty("expert"),true);
 assert.ok(g.chooseCpuMove("expert"));
 const synthetic=new CinderReversi({difficulty:"expert"});
 synthetic.board=Array(64).fill(0);
 synthetic.board[xy(0,1)]=HUMAN;synthetic.board[xy(0,2)]=CPU;
 synthetic.board[xy(4,4)]=HUMAN;synthetic.board[xy(4,5)]=CPU;
 synthetic.turn=CPU;
 assert.ok(legalMoves(synthetic.board,CPU).some(m=>m.x===0&&m.y===0));
 assert.deepEqual({x:synthetic.chooseCpuMove().x,y:synthetic.chooseCpuMove().y},{x:0,y:0});
});
test("80 seeded complete matches terminate with valid board counts and legal moves",()=>{
 for(let seed=1;seed<=80;seed++){
  const g=new CinderReversi({random:seeded(seed),difficulty:["casual","classic","expert"][seed%3]});
  for(let n=0;n<70&&!g.ended;n++){
   const options=legalMoves(g.board,g.turn);
   assert.ok(options.length>0,"A current turn must have a legal move");
   const move=g.turn===CPU?g.cpuMove():g.play(options[0].x,options[0].y);
   assert.equal(move.ok,true);
   assert.equal(g.counts.human+g.counts.cpu,4+g.moves);
  }
  assert.equal(g.ended,true,"Match "+seed+" did not finish");
  assert.ok([HUMAN,CPU,0].includes(g.winner));
  assert.ok(g.moves<=60);
  assert.equal(legalMoves(g.board,HUMAN).length,0);
  assert.equal(legalMoves(g.board,CPU).length,0);
 }
});
test("restore validated saved matches, recover corrupt storage and preserve undo",()=>{
 const g=original();g.play(2,3);g.cpuMove();
 const state=g.serialize();assert.equal(state.schema,2);
 const restored=CinderReversi.restore(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored.serialize(),state);
 assert.equal(restored.undoHumanTurn(),true);
 assert.equal(restored.moves,0);
 assert.equal(CinderReversi.restore({...state,board:[2,...state.board.slice(1)]}).moves,0);
 assert.equal(CinderReversi.restore({...state,difficulty:"paid"}).moves,0);
 assert.equal(CinderReversi.restore({...state,history:[{}]}).moves,0);
 assert.equal(CinderReversi.restore({}).moves,0);
});
test("modern Reversi cabinet exposes full-screen, responsive touch board, undo and safe local persistence",()=>{
 const page=readFileSync("public/arcade/hosted/cinder-reversi/index.html","utf8");
 const ui=readFileSync("public/arcade/hosted/cinder-reversi/game.js","utf8");
 const css=readFileSync("public/arcade/hosted/cinder-reversi/game.css","utf8");
 for(const id of ["reversi-root","board","turn","human-score","cpu-score","status","full","reset","undo","hint","difficulty","win-human","win-cpu","win-draws"]){
  assert.ok(page.includes('id="'+id+'"'),"Missing "+id);
 }
 assert.match(page,/type="module" src="\.\/game\.js/);
 assert.match(page,/script src="\/nav\.js"/);
 assert.match(ui,/from "\.\/engine\.mjs"/);
 assert.match(ui,/requestFullscreen/);
 assert.match(ui,/undoHumanTurn/);
 assert.match(ui,/record\[field\]=Math\.max\(0,record\[field\]-1\)/);
 assert.match(ui,/document\.hidden/);
 assert.match(css,/@media\(max-width:550px\)/);
 assert.match(css,/aspect-ratio:1/);
 assert.match(css,/#reversi-root:fullscreen/);
 assert.match(css,/prefers-reduced-motion/);
});