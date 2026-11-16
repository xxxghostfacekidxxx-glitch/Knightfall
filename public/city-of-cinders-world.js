/* City of Cinders: original climbable, breakable city and cached 2.5D facade renderer.
   Self-contained, deterministic gameplay model. No outside assets or libraries required. */
(function(root) {
'use strict';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const hash=(a,b=0,c=0)=>{let v=(a*374761393+b*668265263+c*1442695041)|0;v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296;};
const PALETTES=[
  {wall:'#283647',edge:'#617187',glass:'#67e7ed',roof:'#121b2a'},
  {wall:'#352e45',edge:'#9d7899',glass:'#f6a8d7',roof:'#21162b'},
  {wall:'#293d43',edge:'#5e8a82',glass:'#d9e6aa',roof:'#132b33'},
  {wall:'#453139',edge:'#9d6868',glass:'#ffb47b',roof:'#2a171d'},
  {wall:'#293042',edge:'#677c9b',glass:'#b59cff',roof:'#171c2c'}
];
function createBuilding(x,w,h,seed=0) {
  const floors=Math.max(3,Math.ceil(h/33)),cols=4;
  const full=5.8+floors*.61;
  return {x,w,h,seed,floors,cols,full,hp:full,dead:false,collapse:0,
    cells:Array.from({length:floors*cols},(_,i)=>({hp:2,lit:hash(seed,i,7)>.34})),
    facade:null};
}
function buildingTop(b,ground){return ground-b.h;}
function findGrip(buildings,m,ground,margin=19) {
  const feet=m.y+m.h;
  let best=null,bestD=Infinity;
  for(const b of buildings){
    if(b.dead||m.y>ground-14||feet<buildingTop(b,ground)-14)continue;
    const leftD=Math.abs(m.x+m.w-b.x),rightD=Math.abs(m.x-(b.x+b.w));
    const d=Math.min(leftD,rightD);
    if(d<=margin&&d<bestD){bestD=d;best={building:b,side:leftD<=rightD?'left':'right'};}
  }
  return best;
}
function resolveWall(buildings,m,oldX,ground) {
  for(const b of buildings){
    if(b.dead)continue;
    const top=buildingTop(b,ground);
    if(m.y+m.h<=top+8||m.y>=ground-3)continue;
    if(m.x+m.w<=b.x||m.x>=b.x+b.w)continue;
    if(oldX+m.w<=b.x+8) m.x=b.x-m.w;
    else if(oldX>=b.x+b.w-8)m.x=b.x+b.w;
    else if(m.x>oldX)m.x=b.x-m.w;
    else if(m.x<oldX)m.x=b.x+b.w;
  }
  return m.x;
}
function landing(buildings,m,oldFoot,newFoot) {
  let top=Infinity,building=null;
  for(const b of buildings){
    if(b.dead||m.x+m.w<=b.x+6||m.x>=b.x+b.w-6)continue;
    const roof=b._top;
    if(oldFoot<=roof+9&&newFoot>=roof&&roof<top){top=roof;building=b;}
  }
  return building?{building,y:top-m.h}:null;
}
function findTarget(buildings,m,ground,reach=110){
  let closest=null,best=Infinity;
  const bodyX=m.x+m.w/2,atRoof=m.y+m.h;
  for(const b of buildings){
    if(b.dead)continue;
    const top=buildingTop(b,ground);
    const overRoof=bodyX>=b.x-5&&bodyX<=b.x+b.w+5&&Math.abs(atRoof-top)<22;
    const front=m.face>0 ? b.x>=m.x+m.w-24&&b.x<=m.x+m.w+reach :
      b.x+b.w<=m.x+24&&b.x+b.w>=m.x-reach;
    if(!front&&!overRoof)continue;
    const y=overRoof?top+4:m.y+m.h*.48;
    if(y<top-16||y>ground+10)continue;
    const d=overRoof?0:Math.abs(m.face>0?b.x-(m.x+m.w):m.x-(b.x+b.w));
    if(d<best){best=d;closest={building:b,x:overRoof?clamp(bodyX,b.x+5,b.x+b.w-5):(m.face>0?b.x+6:b.x+b.w-6),y:clamp(y,top+4,ground-5),roof:overRoof};}
  }
  return closest;
}
function damageBuilding(b,amount,wx,wy,ground) {
  if(!b||b.dead||!Number.isFinite(amount)||amount<=0)return {hit:false,collapsed:false};
  const top=buildingTop(b,ground),col=clamp(Math.floor(((wx-b.x)/b.w)*b.cols),0,b.cols-1);
  const floor=clamp(Math.floor(((wy-top)/b.h)*b.floors),0,b.floors-1);
  const index=floor*b.cols+col,cell=b.cells[index];
  const brokenBefore=cell.hp<=0;
  cell.hp=Math.max(0,cell.hp-amount*1.9);
  for(const dc of [-1,1]){
    const c=col+dc;if(c<0||c>=b.cols)continue;
    const other=b.cells[floor*b.cols+c];other.hp=Math.max(0,other.hp-amount*.17);
  }
  b.hp=Math.max(0,b.hp-amount);
  const collapsed=b.hp<=0;
  if(collapsed){b.dead=true;b.collapse=0;}
  return {hit:true,broken:!brokenBefore&&cell.hp<=0,collapsed,floor,col,remaining:b.hp};
}
function stepCollapse(b,dt=1){if(b.dead)b.collapse=Math.min(1,b.collapse+Math.min(2,Math.max(0,dt))*.025);return b.collapse;}
function facade(b) {
  if(b.facade)return b.facade;
  if(typeof document==='undefined'||!document.createElement)return null;
  const surface=document.createElement('canvas');
  surface.width=Math.ceil(b.w);surface.height=Math.ceil(b.h);
  const c=surface.getContext('2d');
  if(!c)return null;
  const p=PALETTES[b.seed%PALETTES.length],w=surface.width,h=surface.height;
  let grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,p.edge);grad.addColorStop(.22,p.wall);grad.addColorStop(.72,p.wall);grad.addColorStop(1,'#10131c');
  c.fillStyle=grad;c.fillRect(0,0,w,h);
  // Layered bevels, brickwork and a recessed corner give the wall depth.
  c.fillStyle='#050a11b0';c.fillRect(w-13,0,13,h);c.fillStyle='#ffffff23';c.fillRect(4,0,3,h);
  c.fillStyle='#14182460';for(let yy=12;yy<h;yy+=13){c.fillRect(9,yy,w-23,1);for(let xx=12+(yy%26?8:0);xx<w-14;xx+=27)c.fillRect(xx,yy,1,13);}
  const cw=w/b.cols,ch=h/b.floors;
  for(let row=0;row<b.floors;row++)for(let col=0;col<b.cols;col++){
    const i=row*b.cols+col,cell=b.cells[i],x=col*cw,y=row*ch;
    const pad=Math.max(4,cw*.18),wx=x+pad,wy=y+6,ww=cw-pad*2,wh=Math.max(8,ch-13);
    c.fillStyle='#07111a';c.fillRect(wx-2,wy-2,ww+4,wh+4);
    c.fillStyle=cell.lit?p.glass:'#182433';c.globalAlpha=cell.lit?.85:.75;c.fillRect(wx,wy,ww,wh);c.globalAlpha=1;
    c.fillStyle='#cdeafc2e';c.fillRect(wx+2,wy+2,2,wh-4);
    c.fillStyle='#070e18a9';c.fillRect(wx+ww*.47,wy,2,wh);c.fillRect(wx,wy+wh*.57,ww,2);
    c.fillStyle='#e4ddff10';c.fillRect(wx+4,wy+2,ww-7,2);
  }
  c.fillStyle=p.edge;c.fillRect(0,0,w,6);c.fillStyle=p.roof;c.fillRect(0,0,w,3);
  c.fillStyle='#060c15';for(let i=0;i<3;i++)c.fillRect(12+i*(w-24)/3,0,5,h);
  // Every block has distinctive roof machinery and a neon crown.
  c.fillStyle='#090e19';c.fillRect(w*.35,-2,w*.3,8);
  c.fillStyle=p.glass;c.fillRect(w*.35+2,2,w*.3-4,2);
  b.facade=surface;return surface;
}
function paintDamage(c,b,x,top,frame) {
  const cw=b.w/b.cols,ch=b.h/b.floors;
  for(let i=0;i<b.cells.length;i++){
    const cell=b.cells[i];if(cell.hp>=2)continue;
    const row=Math.floor(i/b.cols),col=i%b.cols;
    const cx=x+(col+.5)*cw,cy=top+(row+.5)*ch;
    const ratio=clamp((2-cell.hp)/2,0,1),r=Math.min(cw,ch)*(.13+ratio*.38);
    c.save();
    c.fillStyle='#060910';c.strokeStyle='#d8a6b0';c.lineWidth=1.3;
    c.beginPath();
    for(let p=0;p<=10;p++){
      const theta=p*Math.PI*2/10,radius=r*(.72+hash(b.seed,i,p)*.48);
      const px=cx+Math.cos(theta)*radius,py=cy+Math.sin(theta)*radius;
      if(!p)c.moveTo(px,py);else c.lineTo(px,py);
    }
    c.closePath();c.fill();c.stroke();
    // Exposed interior steel and cracks radiate outward from each hole.
    c.strokeStyle='#748b9b';c.lineWidth=2;
    c.beginPath();c.moveTo(cx-r*.6,cy+r*.2);c.lineTo(cx+r*.8,cy-r*.15);c.stroke();
    c.strokeStyle='#15101d';c.lineWidth=1.4;
    for(let p=0;p<4;p++){
      const theta=(p*.51+hash(i,p,b.seed))*Math.PI*2;
      const dx=Math.cos(theta)*r,dy=Math.sin(theta)*r;
      c.beginPath();c.moveTo(cx+dx*.5,cy+dy*.5);c.lineTo(cx+dx*1.45,cy+dy*1.55);c.lineTo(cx+dx*1.7-4,cy+dy*1.7+5);c.stroke();
    }
    if(ratio>.65){c.fillStyle='#e6a56c';c.globalAlpha=.15+.09*Math.sin(frame*.12+i);c.fillRect(cx-r*.65,cy+r*.4,r*1.3,3);}
    c.restore();
  }
}
function drawBuilding(c,b,cam,ground,frame=0,mode='cinematic'){
  const x=b.x-cam,top=buildingTop(b,ground),t=b.collapse||0;
  if(x>1000||x+b.w<-40)return;
  const skin=facade(b);
  if(b.dead){
    // Layers descend and rotate into a heap rather than disappearing on the killing blow.
    if(t<.97&&skin){
      c.save();c.globalAlpha=1-t*.85;c.translate(x+b.w/2,top+b.h);
      c.rotate((b.seed%2?1:-1)*t*.12);
      c.drawImage(skin,-b.w/2,-b.h+t*b.h*.82,b.w,b.h);
      c.restore();
    }
    c.fillStyle='#252432';c.fillRect(x-8,ground-12,b.w+16,12);
    for(let i=0;i<12;i++){const q=hash(b.seed,i,4),px=x+q*b.w,size=5+hash(i,b.seed,3)*12; c.fillStyle=i%3===0?'#986a69':'#4c4555';c.fillRect(px,ground-6-size*.56,size,5+size*.56);}
    if(t<.96){c.fillStyle='#bb9eae';c.globalAlpha=(1-t)*.20;c.fillRect(x-16,ground-23-t*25,b.w+32,22);c.globalAlpha=1;}
    return;
  }
  if(skin)c.drawImage(skin,x,top,b.w,b.h);
  else{c.fillStyle='#293343';c.fillRect(x,top,b.w,b.h);}
  paintDamage(c,b,x,top,frame);
  c.fillStyle='#090b14';c.fillRect(x+b.w*.43,top-12,b.w*.14,12);
  c.fillStyle='#e879b4';c.fillRect(x+b.w*.45,top-10,b.w*.10,3);
  c.strokeStyle='#8e94a8';c.lineWidth=3;c.strokeRect(x,top,b.w,b.h);
  if(b.hp<b.full){
    c.fillStyle='#090d18';c.fillRect(x+5,top-9,b.w-10,5);
    c.fillStyle='#ef7998';c.fillRect(x+6,top-8,(b.w-12)*(b.hp/b.full),3);
  }
}
const api={createBuilding,buildingTop,findGrip,resolveWall,landing,findTarget,damageBuilding,stepCollapse,drawBuilding,hash};
root.CityCindersWorld=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
