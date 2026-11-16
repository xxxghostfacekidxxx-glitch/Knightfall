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
    facade:null,shards:[],impactCount:0,shake:0};
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
  b.impactCount=(b.impactCount||0)+1;
  b.shake=Math.min(6,(b.shake||0)+Math.min(3,amount*1.6));
  const originX=b.x+(col+.5)*b.w/b.cols;
  const originY=top+(floor+.5)*b.h/b.floors;
  for(let piece=0;piece<Math.min(12,Math.ceil(amount*5));piece++){
    if(b.shards.length>=160)b.shards.shift();
    const a=hash(b.seed,b.impactCount,piece)*Math.PI*2;
    const speed=1.3+hash(piece,b.impactCount,b.seed)*4.5;
    b.shards.push({
      x:originX+(hash(piece,b.seed,b.impactCount)-.5)*b.w/b.cols,
      y:originY+(hash(b.impactCount,piece,8)-.5)*b.h/b.floors,
      vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-2.5,
      size:3+hash(b.seed,piece,b.impactCount)*9,life:85+hash(piece,4,b.seed)*50,
      tint:piece%3
    });
  }
  for(const dc of [-1,1]){
    const c=col+dc;if(c<0||c>=b.cols)continue;
    const other=b.cells[floor*b.cols+c];other.hp=Math.max(0,other.hp-amount*.17);
  }
  b.hp=Math.max(0,b.hp-amount);
  const collapsed=b.hp<=0;
  if(collapsed){b.dead=true;b.collapse=0;}
  return {hit:true,broken:!brokenBefore&&cell.hp<=0,collapsed,floor,col,remaining:b.hp};
}
function stepCollapse(b,dt=1){
  const step=Math.max(0,Math.min(3,Number(dt)||0));
  if(b.dead)b.collapse=Math.min(1,b.collapse+step*.020);
  b.shake=Math.max(0,(b.shake||0)-step*.32);
  for(const bit of b.shards||[]){
    bit.x+=bit.vx*step;bit.y+=bit.vy*step;
    bit.vy+=.25*step;bit.vx*=Math.pow(.982,step);bit.life-=step;
  }
  if(b.shards)b.shards=b.shards.filter(bit=>bit.life>0&&bit.y<550);
  return b.collapse;
}
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
    const cell=b.cells[i],ratio=clamp((2-cell.hp)/2,0,1);
    if(ratio<=0)continue;
    const row=Math.floor(i/b.cols),col=i%b.cols;
    const left=x+col*cw,yt=top+row*ch,cx=left+cw*.5,cy=yt+ch*.5;
    c.save();
    if(cell.hp<=0){
      // A punched-out floor is an actual recessed cavity, not a black painted spot.
      c.fillStyle='#05060d';c.fillRect(left+2,yt+3,cw-4,ch-5);
      c.fillStyle='#1c1b28';c.fillRect(left+6,yt+7,cw-11,ch-12);
      c.fillStyle='#05060a';c.fillRect(left+9,yt+9,cw-17,ch-17);
      c.fillStyle='#af9ea8';c.fillRect(left+2,yt+2,cw-4,3);
      c.fillStyle='#6e5c61';c.fillRect(left+3,yt+ch-7,cw-6,5);
      // Horizontal slab and vertical pillars give the destruction readable depth.
      c.fillStyle='#4b424b';c.fillRect(left+4,yt+7,4,ch-12);
      c.fillStyle='#2a333d';c.fillRect(left+cw-9,yt+7,5,ch-12);
      c.fillStyle='#a97b73';c.fillRect(left+3,yt+ch*.54,cw-6,2);
      if((row+col+b.seed)%3===0){c.fillStyle='#efad6b';c.globalAlpha=.33+.12*Math.sin(frame*.07+i);c.fillRect(left+cw*.3,yt+ch*.33,cw*.38,3);c.globalAlpha=1;}
      // Ragged broken masonry hangs over the edges of the newly-open hole.
      c.fillStyle='#73636d';
      for(let p=0;p<5;p++){
        const k=hash(b.seed,i,p),edge=p%2?left+cw-5:left+1;
        c.fillRect(edge,yt+5+k*(ch-14),4+2*k,3+4*hash(p,i,b.seed));
      }
    }else{
      const r=Math.min(cw,ch)*(.17+ratio*.37);
      c.fillStyle='#05080f';c.strokeStyle='#d3a2a7';c.lineWidth=1.5;
      c.beginPath();
      for(let p=0;p<=11;p++){
        const angle=p*Math.PI*2/11,radius=r*(.66+hash(b.seed,i,p)*.45);
        const px=cx+Math.cos(angle)*radius,py=cy+Math.sin(angle)*radius;
        if(!p)c.moveTo(px,py);else c.lineTo(px,py);
      }
      c.closePath();c.fill();c.stroke();
    }
    c.strokeStyle=cell.hp<=0?'#92828c':'#e19c8b';c.lineWidth=1.3;
    for(let p=0;p<5;p++){
      const angle=(p/5+hash(i,p,b.seed)*.14)*Math.PI*2;
      const reach=Math.min(cw,ch)*(.22+ratio*.52);
      c.beginPath();c.moveTo(cx+Math.cos(angle)*reach*.42,cy+Math.sin(angle)*reach*.42);
      c.lineTo(cx+Math.cos(angle)*reach,cy+Math.sin(angle)*reach);
      c.lineTo(cx+Math.cos(angle+.16)*reach*1.28,cy+Math.sin(angle+.16)*reach*1.28);c.stroke();
    }
    c.restore();
  }
}
function paintFragments(c,b,cam,ground,frame) {
  for(const bit of b.shards||[]){
    const alpha=clamp(bit.life/50,0,1),sx=bit.x-cam;
    if(sx<-25||sx>1000||bit.y>ground+95)continue;
    c.globalAlpha=alpha;
    c.fillStyle=bit.tint===0?'#ddaa89':bit.tint===1?'#6b6477':'#9c8390';
    c.fillRect(sx,Math.min(ground+40,bit.y),bit.size,Math.max(2,bit.size*.64));
    c.fillStyle='#080c16';c.fillRect(sx+bit.size*.4,Math.min(ground+40,bit.y)+1,bit.size*.4,2);
  }
  c.globalAlpha=1;
}
function drawBuilding(c,b,cam,ground,frame=0,mode='cinematic'){
  const top=buildingTop(b,ground),t=b.collapse||0;
  const quake=(b.shake||0)*Math.sin(frame*2.2),x=b.x-cam+quake;
  if(x>1000||x+b.w<-40)return;
  const skin=facade(b);
  // Architectural extrusion: a visible side plane + cast shadow, even at rest.
  const depth=mode==='performance'?9:16;
  c.fillStyle='#080a14';c.fillRect(x+depth,top+9,b.w,ground-top+9);
  if(!b.dead){
    c.fillStyle='#10111c';c.fillRect(x+b.w,top+depth,depth,b.h-depth);
    c.fillStyle='#50526b';c.fillRect(x+b.w,top+depth,2,b.h-depth);
    c.fillStyle='#212237';c.beginPath();c.moveTo(x,top);c.lineTo(x+depth,top-depth*.42);c.lineTo(x+b.w+depth,top-depth*.42);c.lineTo(x+b.w,top);c.closePath();c.fill();
    if(skin)c.drawImage(skin,x,top,b.w,b.h);
    else{c.fillStyle='#293343';c.fillRect(x,top,b.w,b.h);}
    paintDamage(c,b,x,top,frame);
    // Exposed corner steel is now separate from facade damage.
    c.fillStyle='#141824';c.fillRect(x+2,top+1,4,b.h-3);
    c.fillStyle='#8893a2';c.fillRect(x+4,top+4,1,b.h-8);
    c.fillStyle='#10131b';c.fillRect(x+b.w-7,top+3,5,b.h-3);
    c.fillStyle='#e77db6';c.fillRect(x+b.w*.39,top-12,b.w*.22,3);
    c.fillStyle='#080c14';c.fillRect(x+b.w*.37,top-9,b.w*.26,9);
    if(b.hp<b.full){
      c.fillStyle='#080d17';c.fillRect(x+5,top-17,b.w-10,5);
      c.fillStyle='#ff849f';c.fillRect(x+6,top-16,(b.w-12)*(b.hp/b.full),3);
    }
  }else{
    // Every floor folds down independently as the structure loses support.
    const cw=b.w/b.cols,ch=b.h/b.floors;
    if(t<.99&&skin){
      for(let floor=b.floors-1;floor>=0;floor--){
        const phase=clamp(t*(1.42+floor/b.floors*.6)-floor/b.floors*.12,0,1);
        if(phase>=1)continue;
        const srcY=floor*ch,offsetY=Math.min(b.h-srcY,phase*(ground-(top+srcY))*.96);
        const sag=phase*phase*18;
        c.save();c.globalAlpha=1-phase*.78;
        c.translate(x+(floor%2?1:-1)*phase*11,top+srcY+offsetY+sag);
        c.transform(1,(floor%2?1:-1)*phase*.11,0,Math.max(.1,1-phase*.82),0,0);
        c.drawImage(skin,0,srcY,b.w,ch,0,0,b.w,ch);
        c.restore();
      }
    }
    // Persistent smashed slabs, exposed iron, dust.
    c.fillStyle='#1e1d29';c.fillRect(x-8,ground-14,b.w+18,14);
    for(let i=0;i<20;i++){
      const k=hash(b.seed,i,4),px=x+Math.min(b.w,k*b.w),size=4+hash(i,b.seed,3)*17;
      c.fillStyle=i%4===0?'#b68e83':i%3===0?'#494658':'#787280';
      c.fillRect(px,ground-3-size*.58,size,Math.max(3,size*.58));
    }
    if(t<.99){
      c.globalAlpha=(1-t)*.4;c.fillStyle='#aaa0b2';
      for(let p=0;p<5;p++){
        const q=hash(b.seed,p,11),xx=x+q*b.w-20;
        c.fillRect(xx,ground-25-t*(24+p*13),34+p*11,15+p*4);
      }
      c.globalAlpha=1;
    }
  }
  paintFragments(c,b,cam,ground,frame);
}
const api={createBuilding,buildingTop,findGrip,resolveWall,landing,findTarget,damageBuilding,stepCollapse,drawBuilding,hash};
root.CityCindersWorld=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
