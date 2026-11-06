// Original Knightfall Reversi rules. No DOM, storage, globals or network.
export const HUMAN=1, CPU=-1, SIZE=8;
const DIRS=[-1,0,1].flatMap(dy=>[-1,0,1].filter(dx=>dx||dy).map(dx=>[dx,dy]));
export const xy=(x,y)=>y*SIZE+x;
export const onBoard=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<SIZE&&y>=0&&y<SIZE;
export const tally=board=>({human:board.filter(v=>v===HUMAN).length,cpu:board.filter(v=>v===CPU).length});
export function flipsFor(board,x,y,player){
 if(!onBoard(x,y)||!Array.isArray(board)||board.length!==64||board[xy(x,y)]!==0||![HUMAN,CPU].includes(player))return [];
 const flips=[];
 for(const [dx,dy] of DIRS){
  const line=[];let cx=x+dx,cy=y+dy;
  while(onBoard(cx,cy)&&board[xy(cx,cy)]===-player){line.push(xy(cx,cy));cx+=dx;cy+=dy}
  if(line.length&&onBoard(cx,cy)&&board[xy(cx,cy)]===player)flips.push(...line);
 }
 return flips;
}
export function legalMoves(board,player){
 const out=[];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  if(board[xy(x,y)]!==0)continue;
  const flipped=flipsFor(board,x,y,player);
  if(flipped.length)out.push({x,y,flipped});
 }
 return out;
}
const legalDifficulty=new Set(["casual","classic","expert"]);
const validBoard=a=>Array.isArray(a)&&a.length===64&&a.every(v=>v===0||v===HUMAN||v===CPU);
const validLast=a=>a===null||(a&&onBoard(a.x,a.y));
const validSnapshot=s=>s&&validBoard(s.board)&&[HUMAN,CPU].includes(s.turn)&&typeof s.ended==="boolean"&&
 [null,HUMAN,CPU,0].includes(s.winner)&&Number.isInteger(s.moves)&&s.moves>=0&&s.moves<=60&&validLast(s.lastMove);
export class CinderReversi {
 constructor({random=Math.random,difficulty="classic"}={}){
  this.random=random;
  this.difficulty=legalDifficulty.has(difficulty)?difficulty:"classic";
  this.reset();
 }
 reset(){
  this.board=Array(64).fill(0);
  this.board[xy(3,3)]=CPU;this.board[xy(4,4)]=CPU;
  this.board[xy(4,3)]=HUMAN;this.board[xy(3,4)]=HUMAN;
  this.turn=HUMAN;this.ended=false;this.winner=null;this.moves=0;this.lastMove=null;this.history=[];
 }
 get counts(){return tally(this.board)}
 get humanMoves(){return legalMoves(this.board,HUMAN)}
 snapshot(){return {board:[...this.board],turn:this.turn,ended:this.ended,winner:this.winner,moves:this.moves,lastMove:this.lastMove?{...this.lastMove}:null}}
 setDifficulty(level){if(!legalDifficulty.has(level))return false;this.difficulty=level;return true}
 play(x,y,player=this.turn){
  if(this.ended||this.turn!==player)return {ok:false,reason:"Not this player's turn"};
  const flipped=flipsFor(this.board,x,y,player);
  if(!flipped.length)return {ok:false,reason:"That square is not legal"};
  this.history.push(this.snapshot());
  if(this.history.length>60)this.history.shift();
  this.board[xy(x,y)]=player;
  for(const index of flipped)this.board[index]=player;
  this.lastMove={x,y};
  this.moves++;
  this.turn=-player;
  let passed=false;
  if(!legalMoves(this.board,this.turn).length){
   this.turn=player;passed=true;
   if(!legalMoves(this.board,player).length){
    this.ended=true;
    const score=this.counts;
    this.winner=score.human===score.cpu?0:score.human>score.cpu?HUMAN:CPU;
   }
  }
  return {ok:true,x,y,flipped:flipped.length,passed,ended:this.ended,winner:this.winner,turn:this.turn};
 }
 chooseCpuMove(difficulty=this.difficulty){
  if(this.turn!==CPU||this.ended)return null;
  const opts=legalMoves(this.board,CPU);
  if(!opts.length)return null;
  const sample=Math.min(0.99999999,Math.max(0,Number(this.random())||0));
  if(difficulty==="casual")return opts[Math.floor(sample*opts.length)];
  const scored=opts.map(m=>{
   const {x,y,flipped}=m;
   const corner=(x===0||x===7)&&(y===0||y===7);
   const edge=x===0||x===7||y===0||y===7;
   const xSquare=(x===1||x===6)&&(y===1||y===6);
   const position=(corner?90:edge?15:0)-(xSquare?34:0);
   let value=position+flipped.length*(difficulty==="expert"?1.5:3);
   if(difficulty==="expert"){
    const next=[...this.board];next[xy(x,y)]=CPU;for(const n of flipped)next[n]=CPU;
    const opposing=legalMoves(next,HUMAN);
    value-=opposing.length*2.3;
    value-=opposing.filter(o=>(o.x===0||o.x===7)&&(o.y===0||o.y===7)).length*65;
    const future=legalMoves(next,CPU);
    value+=future.length*.7;
   }
   return {m,value};
  }).sort((a,b)=>b.value-a.value||a.m.y-b.m.y||a.m.x-b.m.x);
  return scored[0].m;
 }
 cpuMove(){
  const chosen=this.chooseCpuMove();
  return chosen?this.play(chosen.x,chosen.y,CPU):{ok:false,reason:"CPU has no legal move"};
 }
 undoHumanTurn(){
  if(!this.history.length)return false;
  let state;
  do{state=this.history.pop()}while(this.history.length&&state.turn!==HUMAN);
  if(!validSnapshot(state))return false;
  Object.assign(this,{board:[...state.board],turn:state.turn,ended:state.ended,winner:state.winner,moves:state.moves,lastMove:state.lastMove});
  return true;
 }
 serialize(){
  return {schema:2,difficulty:this.difficulty,...this.snapshot(),history:this.history.slice(-60).map(x=>({...x,board:[...x.board]}))};
 }
 static restore(raw,options={}){
  const fresh=new CinderReversi(options);
  if(!raw||raw.schema!==2||!validSnapshot(raw)||!legalDifficulty.has(raw.difficulty)||
   !Array.isArray(raw.history)||raw.history.length>60||!raw.history.every(validSnapshot))return fresh;
  const count=tally(raw.board),occupied=count.human+count.cpu;
  if(occupied<4||occupied>64||raw.moves>60||raw.moves>occupied-4)return fresh;
  fresh.board=[...raw.board];fresh.turn=raw.turn;fresh.ended=raw.ended;fresh.winner=raw.winner;
  fresh.moves=raw.moves;fresh.lastMove=raw.lastMove;fresh.difficulty=raw.difficulty;
  fresh.history=raw.history.map(s=>({...s,board:[...s.board]}));
  return fresh;
 }
}