(()=>{"use strict";
const id=location.pathname.split("/").at(-2),c=document.querySelector("canvas"),g=c.getContext("2d"),$=x=>document.getElementById(x);
const N=7,S=62,X=103,Y=38,colors=["#e78951","#8eced0","#cf78aa","#e2cb75","#a99ae4"];
let board=[],score=0,best=0,moves=0,selected=null,active=false;
try{best=Number(localStorage.getItem("ash-match-"+id))||0}catch{}
function pick(){return Math.floor(Math.random()*colors.length)}
function note(t){$("status").textContent=t}
function points(n){score+=n;best=Math.max(score,best);$("score").textContent=score;$("best").textContent=best;try{localStorage.setItem("ash-match-"+id,String(best))}catch{}}
function create(){
 board=Array.from({length:N},()=>Array(N).fill(-1));
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const options=[0,1,2,3,4].filter(v=>!(x>=2&&board[y][x-1]===v&&board[y][x-2]===v)&&!(y>=2&&board[y-1][x]===v&&board[y-2][x]===v));
  board[y][x]=options[Math.floor(Math.random()*options.length)];
 }
}
function hasMove(){
 if(id==="bubble-pop"){for(let y=0;y<N;y++)for(let x=0;x<N;x++)if((x+1<N&&board[y][x]===board[y][x+1])||(y+1<N&&board[y][x]===board[y+1][x]))return true;return false}
 for(let y=0;y<N;y++)for(let x=0;x<N;x++)for(const [dx,dy] of [[1,0],[0,1]]){
  const xx=x+dx,yy=y+dy;if(xx>=N||yy>=N)continue;
  [board[y][x],board[yy][xx]]=[board[yy][xx],board[y][x]];
  const valid=findMatches().size>0;
  [board[y][x],board[yy][xx]]=[board[yy][xx],board[y][x]];
  if(valid)return true;
 }
 return false;
}
function ensureMove(){
 if(hasMove())return false;
 for(let attempt=0;attempt<30;attempt++){create();if(hasMove())return true}
 // Deterministic solvable fallback without any initial matches.
 board=Array.from({length:N},(_,y)=>Array.from({length:N},(_,x)=>(x+y)%5));
 if(id==="bubble-pop")board[0][1]=0;
 else{board[0][0]=0;board[0][1]=1;board[0][2]=0;board[1][1]=0;}
 return true;
}
function findMatches(){const found=new Set();for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=board[y][x];if(x+2<N&&board[y][x+1]===v&&board[y][x+2]===v){let j=x;while(j<N&&board[y][j]===v){found.add(y+","+j);j++}}if(y+2<N&&board[y+1][x]===v&&board[y+2][x]===v){let j=y;while(j<N&&board[j][x]===v){found.add(j+","+x);j++}}}return found}
function collapse(matches){for(const key of matches){const [y,x]=key.split(",").map(Number);board[y][x]=-1}for(let x=0;x<N;x++){const col=[];for(let y=N-1;y>=0;y--)if(board[y][x]>=0)col.push(board[y][x]);for(let y=N-1;y>=0;y--)board[y][x]=col[N-1-y]??pick()}}
function settle(){let chain=0;while(chain<15){const m=findMatches();if(!m.size)break;points(m.size*10*(chain+1));collapse(m);chain++}return chain}
function finish(){active=false;selected=null;note("ROUND COMPLETE · "+score+" points");document.dispatchEvent(new CustomEvent("ashfall:arcade-finished",{detail:{gameId:"cabinet-"+id,score}}))}
function start(){score=0;moves=25;selected=null;active=true;$("score").textContent="0";create();ensureMove();document.dispatchEvent(new CustomEvent("ashfall:arcade-started",{detail:{gameId:"cabinet-"+id}}));note("25 moves · match three or more");draw()}
function tap(x,y){if(!active)return;const cx=Math.floor((x-X)/S),cy=Math.floor((y-Y)/S);if(cx<0||cy<0||cx>=N||cy>=N)return;
 if(id==="bubble-pop"){const color=board[cy][cx],queue=[[cy,cx]],seen=new Set([cy+","+cx]);for(let i=0;i<queue.length;i++){const [r,col]=queue[i];for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const nr=r+dr,nc=col+dc,key=nr+","+nc;if(nr>=0&&nr<N&&nc>=0&&nc<N&&!seen.has(key)&&board[nr][nc]===color){seen.add(key);queue.push([nr,nc])}}}if(seen.size<2){note("Choose a connected pair or larger");return}moves--;collapse(seen);points(seen.size*12);settle();if(ensureMove())note("Board reshuffled · no available groups");else note("Burst "+seen.size+" embers")}
 else {if(!selected){selected={x:cx,y:cy};note("Choose an adjacent tile");draw();return}const a=selected;selected=null;if(Math.abs(a.x-cx)+Math.abs(a.y-cy)!==1){note("Swap adjacent tiles only");draw();return}
 [board[a.y][a.x],board[cy][cx]]=[board[cy][cx],board[a.y][a.x]];if(!findMatches().size){[board[a.y][a.x],board[cy][cx]]=[board[cy][cx],board[a.y][a.x]];note("No match · swap reverted");draw();return}moves--;settle();if(ensureMove())note("Board reshuffled · no available swaps");else note("Match cleared")}
 if(moves<=0)finish();draw()}
function draw(){g.fillStyle="#0c0c13";g.fillRect(0,0,640,500);g.font="bold 20px system-ui";g.fillStyle="#ffe2bb";g.textAlign="center";g.fillText("MOVES "+moves+" · SCORE "+score,320,24);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const px=X+x*S,py=Y+y*S;g.fillStyle="#26202b";g.fillRect(px+2,py+2,S-4,S-4);g.fillStyle=colors[board[y]?.[x]]||"#6e554a";g.beginPath();g.roundRect(px+7,py+7,S-14,S-14,12);g.fill();if(selected?.x===x&&selected?.y===y){g.strokeStyle="#fff2b6";g.lineWidth=4;g.strokeRect(px+4,py+4,S-8,S-8)}}}
c.addEventListener("pointerdown",e=>{const r=c.getBoundingClientRect();tap((e.clientX-r.left)*640/r.width,(e.clientY-r.top)*500/r.height)});
$("restart").addEventListener("click",start);document.addEventListener("keydown",e=>{if(e.key==="Enter"&&!active)start()});
$("best").textContent=best;create();draw();note("Ready · press Start");

function saveNumbers(o,names){return o&&typeof o==="object"&&names.every(k=>Number.isFinite(o[k])&&Math.abs(o[k])<=1000000000)}
function saveList(a,names,max=100){return Array.isArray(a)&&a.length<=max&&a.every(o=>saveNumbers(o,names))}
function validSave(d){try{return d&&d.schema===1&&d.game===id&&d.engine==="matching-v1"&&Number.isInteger(d.score)&&d.score>=0&&d.score<=1000000&&Number.isFinite(d.best)&&d.best>=0&&d.best<=1000000&&JSON.stringify(d).length<=30000&&Number.isInteger(d.moves)&&d.moves>0&&d.moves<=25&&Array.isArray(d.board)&&d.board.length===N&&d.board.every(row=>Array.isArray(row)&&row.length===N&&row.every(v=>Number.isInteger(v)&&v>=0&&v<colors.length))}catch{return false}}
globalThis.exportSaveState=()=>active?JSON.parse(JSON.stringify({schema:1,game:id,engine:"matching-v1",score,best,board,moves})):null;
globalThis.importSaveState=input=>{let d;try{d=JSON.parse(JSON.stringify(input))}catch{return false}if(!validSave(d))return false;active=true;selected=null;board=d.board;moves=d.moves;score=d.score;best=Math.max(best,d.best,score);$("score").textContent=score;$("best").textContent=best;$("status").textContent="Cloud save restored.";document.dispatchEvent(new CustomEvent("ashfall:arcade-started",{detail:{gameId:"cabinet-"+id}}));draw();;return true};
globalThis.isGameActive=()=>active;
})();