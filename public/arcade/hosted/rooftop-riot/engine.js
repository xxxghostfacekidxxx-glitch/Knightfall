/* Rooftop Riot 2.0: pure, seeded, testable platform physics.
   No network dependencies and no gameplay authority delegated to the browser score bridge. */
(function(root){'use strict';
const W=960,H=540,GRAVITY=1650,BASE_SPEED=325,JUMP=665,PLAYER_W=30,PLAYER_H=46;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(seed){let state=(seed|0)||1;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;}}
function generate(seed=20261103){
 const rnd=random(seed),roofs=[],shards=[],drones=[],vents=[];let x=0,y=407;
 for(let i=0;i<46;i++){
  const width=i===0?310:165+Math.floor(rnd()*109);
  if(i){const gap=75+Math.floor(rnd()*76);x=roofs[i-1].x+roofs[i-1].w+gap;y=clamp(y+(rnd()-.51)*109,285,424);}
  const district=Math.min(3,Math.floor(i/12));
  const roof={i,x,y,w:width,district,checkpoint:i>0&&i%9===0,exit:i===45};
  roofs.push(roof);
  if(i>0&&!roof.exit){
   const count=1+(i%4===0?1:0);
   for(let j=0;j<count;j++)shards.push({x:x+width*(j+1)/(count+1),y:y-42-(j%2)*13,taken:false});
   if(i>2&&i%4===2)vents.push({x:x+width*.56,y,phase:rnd()*4});
   if(i>4&&i%5===0)drones.push({x:x+width*.4,baseX:x+width*.4,y:y-92,baseY:y-92,phase:rnd()*6.28,district});
  }
 }
 return {roofs,shards,drones,vents,end:roofs.at(-1).x+roofs.at(-1).w,districts:['NEON UNDERPASS','STATIC HEIGHTS','TOXIC SKYLINE','THE LAST ROOF']};
}
class Game {
 constructor({seed=20261103,randomFn}={}){
  this.seed=seed;this.randomFn=randomFn||Math.random;this.world=generate(seed);this.reset();
 }
 reset(){
  const first=this.world.roofs[0];
  this.player={x:45,y:first.y-PLAYER_H,vx:0,vy:0,w:PLAYER_W,h:PLAYER_H,grounded:true,coyote:.12,buffer:0,face:1,dash:0,dashReady:true,inv:0,trail:[]};
  this.camera=0;this.time=0;this.timer=240;this.state='ready';this.falls=0;this.hp=3;this.shards=0;this.combo=0;this.comboClock=0;this.distance=0;this.checkpoint=0;this.lastEvent='';this.effects=[];
  this.world.shards.forEach(s=>s.taken=false);
 }
 start(){this.reset();this.state='running';this.lastEvent='start';}
 input={left:false,right:false};
 pressJump(){if(this.state==='running')this.player.buffer=.14;}
 pressDash(){
  const p=this.player;if(this.state!=='running'||!p.dashReady)return false;
  p.dashReady=false;p.dash=.18;p.vy=Math.min(0,p.vy*.4);p.inv=Math.max(p.inv,.18);
  p.face=this.input.left&&!this.input.right?-1:this.input.right&&!this.input.left?1:p.face;
  this.emit('dash',p.x,p.y+22,'#c6ff45');return true;
 }
 emit(kind,x,y,color){this.effects.push({kind,x,y,color,life:.45});if(this.effects.length>45)this.effects.shift();this.lastEvent=kind;}
 hurt(kind='hazard'){
  const p=this.player;if(p.inv>0||this.state!=='running')return false;
  this.hp--;p.inv=1.2;this.combo=0;this.comboClock=0;p.vy=-270;p.vx=-p.face*220;
  this.emit('hit',p.x,p.y,'#ff55d8');this.lastEvent=kind;
  if(this.hp<=0)this.state='lost';
  return true;
 }
 recover(){
  this.falls++;this.combo=0;this.comboClock=0;this.lastEvent='fall';
  if(this.falls>=3){this.state='lost';this.emit('fall',this.player.x,this.player.y,'#ff55d8');return;}
  const roof=this.world.roofs[this.checkpoint],p=this.player;
  p.x=roof.x+36;p.y=roof.y-p.h;p.vx=0;p.vy=0;p.grounded=true;p.coyote=.12;p.buffer=0;p.inv=1.6;p.dashReady=true;
  this.camera=clamp(p.x-235,0,Math.max(0,this.world.end-W));this.emit('respawn',p.x,p.y,'#79ffe7');
 }
 tick(dt){
  if(this.state!=='running')return;
  // Bound wall-clock deltas and subdivide collisions so a slow phone cannot skip roofs.
  const delta=clamp(Number(dt)||0,0,.05);
  const steps=Math.max(1,Math.ceil(delta/.014));for(let i=0;i<steps&&this.state==='running';i++)this.step(delta/steps);
 }
 step(dt){
  this.time+=dt;this.timer=Math.max(0,240-this.time);if(this.timer<=0){this.state='lost';this.lastEvent='timeout';return}
  const p=this.player;p.inv=Math.max(0,p.inv-dt);p.buffer=Math.max(0,p.buffer-dt);
  p.dash=Math.max(0,p.dash-dt);p.coyote=p.grounded?.12:Math.max(0,p.coyote-dt);
  const axis=Number(this.input.right)-Number(this.input.left);
  if(axis)p.face=axis;
  const target=axis*BASE_SPEED;
  const accel=p.grounded?2350:1520;
  p.vx+=clamp(target-p.vx,-accel*dt,accel*dt);
  if(!axis)p.vx*=Math.pow(p.grounded?.74:.9,dt*60);
  if(p.dash>0)p.vx=p.face*795;
  if(p.buffer>0&&(p.grounded||p.coyote>0)){
   p.vy=-JUMP;p.buffer=0;p.grounded=false;p.coyote=0;
   this.emit('jump',p.x,p.y+p.h,'#79ffe7');
  }
  const oldBottom=p.y+p.h,oldX=p.x;
  p.x=clamp(p.x+p.vx*dt,0,this.world.end+40);
  p.vy=Math.min(920,p.vy+GRAVITY*dt);
  p.y+=p.vy*dt;p.grounded=false;
  if(p.vy>=0)for(const r of this.world.roofs){
   if(r.x>p.x+p.w+10||r.x+r.w<p.x-10)continue;
   if(oldBottom<=r.y+8&&p.y+p.h>=r.y&&
      Math.max(oldX,p.x)+p.w>r.x+5&&Math.min(oldX,p.x)<r.x+r.w-5){
    p.y=r.y-p.h;p.vy=0;p.grounded=true;p.coyote=.12;p.dashReady=true;
    if(r.checkpoint&&r.i>this.checkpoint){this.checkpoint=r.i;this.hp=Math.min(3,this.hp+1);p.inv=Math.max(p.inv,.7);this.emit('checkpoint',p.x,p.y,'#c6ff45');}
    break;
   }
  }
  // Reaching the beacon after an earlier landing also wins: merely walking
  // onto an exit roof must never trap a player in an unwinnable state.
  const exit=this.world.roofs.at(-1);
  if(this.state==='running'&&p.grounded&&p.x+p.w>exit.x+exit.w*.68&&p.x<exit.x+exit.w){
   this.state='won';this.emit('won',p.x,p.y,'#c6ff45');
  }
  if(p.y>H+165){this.recover();return}
  this.distance=Math.max(this.distance,Math.floor(p.x/10));
  this.camera+= (clamp(p.x-255,0,Math.max(0,this.world.end-W))-this.camera)*Math.min(1,dt*9);
  for(const s of this.world.shards){
   if(!s.taken&&Math.abs(p.x+p.w*.5-s.x)<24&&Math.abs(p.y+p.h*.5-s.y)<38){
    s.taken=true;this.shards+=1;this.combo=Math.min(8,this.combo+1);this.comboClock=4;
    this.emit('shard',s.x,s.y,'#c6ff45');
   }
  }
  this.comboClock=Math.max(0,this.comboClock-dt);if(this.comboClock===0)this.combo=0;
  for(const d of this.world.drones){
   const dx=d.baseX+Math.sin(this.time*1.9+d.phase)*44;
   const dy=d.baseY+Math.cos(this.time*2.1+d.phase)*14;
   if(p.x+p.w>dx-18&&p.x<dx+18&&p.y+p.h>dy-16&&p.y<dy+16)this.hurt('drone');
  }
  for(const v of this.world.vents){
   const active=(this.time+v.phase)%3.6>1.15;
   if(active&&p.x+p.w>v.x-16&&p.x<v.x+25&&p.y+p.h>v.y-70&&p.y<v.y+4)this.hurt('steam');
  }
  for(const fx of this.effects)fx.life-=dt;this.effects=this.effects.filter(fx=>fx.life>0);
 }
 get district(){const r=this.world.roofs.findLast(r=>r.x<=this.player.x)||this.world.roofs[0];return this.world.districts[r.district]}
 get progress(){return Math.min(100,Math.round(this.player.x/this.world.end*100))}
 get score(){return this.shards*100+Math.floor(this.distance/2)+this.checkpoint*25+(this.state==='won'?1500:0)}
 snapshot(){return {state:this.state,hp:this.hp,falls:this.falls,shards:this.shards,combo:this.combo,checkpoint:this.checkpoint,distance:this.distance,progress:this.progress,district:this.district,score:this.score,time:this.timer};}
}
root.RooftopRiotEngine={Game,generate,random,W,H,GRAVITY,BASE_SPEED,JUMP};
})(typeof window!=='undefined'?window:globalThis);
