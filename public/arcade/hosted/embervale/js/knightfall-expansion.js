// EMBERVALE: CINDER KEEP EXPANSION
// Original Embervale by Nicholas Aryel Ferreira, MIT.
// Knightfall's original optional eastern adventure.
'use strict';

// Extend the overworld eastward without changing existing room coordinates or saves.
MAPS.overworld.w = 7;
const lakeside = OVERWORLD['4,1'];
// The old eastern shoreline now has a three-tile stone causeway.
lakeside.tiles = lakeside.tiles.map((row, y) =>
  y >= 4 && y <= 6 ? row.slice(0, 8) + '========' : row
);

const EAST_REALMS = [
  {x:5,y:0,name:'CINDERWOOD RIDGE',style:'ridge',enemies:[['emberwisp',5,4],['stoneguard',11,7]]},
  {x:6,y:0,name:'THE WATCHER STONES',style:'ruins',enemies:[['stoneguard',4,4],['emberwisp',11,7]],
   chests:[{tx:8,ty:3,item:'gems',n:25,flag:'east_watcher_gems',requiresClear:true}]},
  {x:5,y:1,name:'ASHEN CAUSEWAY',style:'road',enemies:[['emberwisp',12,3],['slimeR',4,7]]},
  {x:6,y:1,name:'THE SHATTERED GROVE',style:'woods',enemies:[['stoneguard',5,7],['emberwisp',12,3]]},
  {x:5,y:2,name:'CINDER KEEP APPROACH',style:'ruins',enemies:[['stoneguard',4,6],['emberwisp',12,7]],
   warps:[{tx:8,ty:2,map:'emberkeep',sx:1,sy:1,px:7,py:8}],
   signs:[{tx:3,ty:4,text:'CINDER KEEP. A FIRE-EATEN FORTRESS. A WARDEN WAITS BELOW.'}]},
  {x:6,y:2,name:'PRISM GLEN',style:'woods',enemies:[['emberwisp',4,6],['stoneguard',12,7]],
   warps:[{tx:8,ty:2,map:'glasscrypt',sx:0,sy:1,px:7,py:8}],
   signs:[{tx:3,ty:4,text:'PRISM CATACOMBS. A SHARD BEAST CLAIMED THE STORM BOW.'}],
   chests:[{tx:8,ty:8,item:'bombs',n:4,flag:'east_ashen_bombs'}]}
];
function easternTiles(def) {
  const tiles = Array.from({length:11},(_,y)=>{
    const chars = Array.from({length:16},(_,x)=>{
      // Neighbouring rooms share a three-tile crossing at each edge.
      if ((y===0 || y===10) && x>=7 && x<=9) return '.';
      if ((x===0 || x===15) && y>=4 && y<=6) return '=';
      if (x===0 || x===15 || y===0 || y===10) return def.style==='ridge'?'R':'T';
      if (def.style==='road' && (x===7 || x===8 || x===9 || y===5)) return 'P';
      if (def.style==='ruins' && (x===3 || x===12) && (y===3 || y===8)) return 'A';
      if (def.style==='woods' && ((x===3&&y===3)||(x===12&&y===8)||(x===3&&y===8))) return 'B';
      if (def.style==='ridge' && ((x===3&&y===3)||(x===12&&y===3)||(x===4&&y===8))) return 'R';
      return (x*13+y*7+def.x*11+def.y*5)%17===0?',':'.';
    });
    return chars.join('');
  });
  // A real cave warp, plus an ordinary sign reachable from its entrance.
  if(def.warps) {
    tiles[2] = tiles[2].slice(0,8) + 'O' + tiles[2].slice(9);
    tiles[4] = tiles[4].slice(0,3) + 's' + tiles[4].slice(4);
  }
  return tiles;
}
for (const def of EAST_REALMS) {
  OW(def.x,def.y,{name:def.name,tiles:easternTiles(def),
    enemies:def.enemies,warps:def.warps||[],signs:def.signs||[],chests:def.chests||[]});
}

// A separate interconnected 3x2 dungeon. Unlike interior maps, rooms support
// screen scrolling, persistent doors and revisiting via the normal game engine.
const KEEP = {};
const K=(x,y,def)=>{KEEP[x+','+y]=def;};
function keepTiles({n=false,s=false,w=false,e=false,blocks=[],torches=true}={}) {
  const cells = Array.from({length:11},(_,y)=>
    Array.from({length:16},(_,x)=>
      x===0||x===15||y===0||y===10?'#':'_'));
  const door=(side,tile)=>{
    if(!tile)return;
    if(side==='n'||side==='s') for(let x=7;x<=9;x++)cells[side==='n'?0:10][x]=tile;
    else for(let y=4;y<=6;y++)cells[y][side==='w'?0:15]=tile;
  };
  door('n',n);door('s',s);door('w',w);door('e',e);
  if(torches){cells[1][1]='t';cells[1][14]='t';cells[9][1]='t';cells[9][14]='t';}
  for (const [x,y,ch] of blocks) cells[y][x]=ch;
  return cells.map(r=>r.join(''));
}
K(1,1,{name:'CINDER KEEP ENTRANCE',tiles:keepTiles({n:'o',w:'o',e:'o',s:'>',blocks:[[5,3,'A'],[11,7,'A']]}),
  enemies:[['emberwisp',5,5]],
  warps:[{tx:7,ty:10,map:'overworld',sx:5,sy:2,px:7,py:4},
         {tx:8,ty:10,map:'overworld',sx:5,sy:2,px:8,py:4}],
  signs:[{tx:2,ty:3,text:'THE OLD GUARD FELL TO ASH. FIND THE KEY. CLAIM THE BLADE. END THE WARDEN.'}]});
KEEP['1,1'].tiles[3]=KEEP['1,1'].tiles[3].slice(0,2)+'s'+KEEP['1,1'].tiles[3].slice(3);
K(0,1,{name:'KEEP KEY CHAMBER',tiles:keepTiles({n:'o',e:'o',blocks:[[4,3,'#'],[11,3,'#'],[4,7,'#'],[11,7,'#']]}),
  enemies:[['stoneguard',7,5],['emberwisp',11,7]],
  chests:[{tx:7,ty:3,item:'key',flag:'keep_small_key',requiresClear:true}]});
K(2,1,{name:'EMBER ARMORY GATE',tiles:keepTiles({n:'L',w:'o',blocks:[[6,4,'A'],[10,7,'A']]}),
  enemies:[['emberwisp',4,6],['stoneguard',11,5]],
  chests:[{tx:12,ty:3,item:'bombs',n:5,flag:'keep_bombs',requiresClear:true}]});
K(0,0,{name:'WHISPERING VAULT',tiles:keepTiles({s:'o',e:'o',blocks:[[5,3,'#'],[10,3,'#'],[5,7,'#'],[10,7,'#']]}),
  enemies:[['emberwisp',4,5],['stoneguard',10,5]],
  chests:[{tx:7,ty:3,item:'gems',n:40,flag:'keep_vault_gems',requiresClear:true}]});
K(2,0,{name:'THE EMBER FORGE',tiles:keepTiles({s:'o',blocks:[[4,3,'A'],[11,3,'A']]}),
  enemies:[['stoneguard',5,6],['stoneguard',11,6]],
  chests:[{tx:8,ty:3,item:'emberblade',flag:'keep_emberblade',requiresClear:true}]});
K(1,0,{name:'THE CINDER WARDEN',music:'boss',dark:true,
  tiles:keepTiles({s:'G',w:'o',blocks:[[4,3,'A'],[11,3,'A'],[4,7,'A'],[11,7,'A']]}),
  enemies:[['cinderwarden',7,5]],
  chests:[{tx:8,ty:3,item:'heartcont',flag:'keep_warden_heart',requiresClear:true}]});
MAPS.emberkeep={grid:KEEP,w:3,h:2,music:'dungeon'};
DIALOG.get_emberblade='THE EMBER BLADE! YOUR SWORD NOW DEALS DOUBLE DAMAGE. THE FLAME HAS CHOSEN YOU.';

// The second dungeon branches out of Prism Glen. Its key is found in the
// mirror vault, and its storm bow can only be claimed after defeating its boss.
const PRISM = {};
const P=(x,y,def)=>{PRISM[x+','+y]=def;};
P(0,1,{name:'PRISM CATACOMBS',tiles:keepTiles({n:'o',e:'o',s:'>',blocks:[[4,6,'A'],[11,6,'A']]}),
  enemies:[['emberwisp',5,5],['stoneguard',10,7]],
  warps:[{tx:7,ty:10,map:'overworld',sx:6,sy:2,px:7,py:4},
         {tx:8,ty:10,map:'overworld',sx:6,sy:2,px:8,py:4}]});
P(1,1,{name:'SHARD GALLERY',tiles:keepTiles({n:'L',w:'o',blocks:[[3,3,'A'],[12,3,'A']]}),
  enemies:[['emberwisp',5,4],['emberwisp',11,6]],
  chests:[{tx:8,ty:3,item:'gems',n:30,flag:'prism_gallery_gems',requiresClear:true}]});
P(0,0,{name:'THE MIRROR VAULT',tiles:keepTiles({s:'o',blocks:[[5,3,'#'],[10,3,'#'],[5,7,'#'],[10,7,'#']]}),
  enemies:[['stoneguard',7,6],['emberwisp',11,5]],
  chests:[{tx:8,ty:3,item:'key',flag:'prism_boss_key',requiresClear:true}]});
P(1,0,{name:'THRONE OF SHARDS',music:'boss',
  tiles:keepTiles({s:'G',blocks:[[4,3,'A'],[11,3,'A'],[4,7,'A'],[11,7,'A']]}),
  enemies:[['prismbeast',7,5]],
  chests:[{tx:8,ty:3,item:'stormbow',flag:'prism_stormbow',requiresClear:true}]});
MAPS.glasscrypt={grid:PRISM,w:2,h:2,music:'dungeon'};
DIALOG.get_stormbow='THE STORM BOW! ONE ARROW BECOMES THREE LIGHTNING SHOTS. AIM WITH X.';


// Extra enemies are hand-drawn so the DLC brings its own visual identity
// without borrowing any third-party sprites.
class EmberWisp extends Enemy {
  constructor(tx,ty){
    super(tx,ty);this.hp=2;this.noCollide=true;this.touchDmg=0.5;
    this.orbit=Math.random()*6.28;this.cooldown=90;
  }
  update(){
    if(this.baseUpdate())return;
    const dx=G.player.cx-this.cx,dy=G.player.cy-this.cy,d=Math.hypot(dx,dy)||1;
    this.orbit+=0.034;
    if(d<125)this.move(dx/d*0.35+Math.cos(this.orbit)*0.24,dy/d*0.35+Math.sin(this.orbit)*0.24);
    if(--this.cooldown<=0&&d<125){
      G.projectiles.push(new RockProj(this.cx-4,this.cy-4,dx/d*1.6,dy/d*1.6));
      this.cooldown=105;AudioSys.sfx('arrow');
    }
    this.touchPlayer();
  }
  draw(c){
    const x=Math.round(this.cx),y=Math.round(this.cy),f=Math.sin(this.t/8)*2;
    c.save();c.globalAlpha=.84;c.fillStyle='#de3154';c.fillRect(x-6,y-5+f,12,10);
    c.fillStyle='#ff9844';c.fillRect(x-4,y-7+f,8,12);
    c.fillStyle='#fff0a2';c.fillRect(x-2,y-3+f,4,5);
    c.fillStyle='#fff';c.fillRect(x-1,y+f,2,2);
    c.restore();
  }
}
class StoneGuard extends Enemy {
  constructor(tx,ty){super(tx,ty);this.hp=4;this.touchDmg=1;this.windup=0;this.charge=0;this.vx=0;this.vy=0;}
  update(){
    if(this.baseUpdate())return;
    const dx=G.player.cx-this.cx,dy=G.player.cy-this.cy,d=Math.hypot(dx,dy)||1;
    if(this.windup>0){
      this.windup--;
      if(this.windup===0){this.charge=24;this.vx=dx/d*2;this.vy=dy/d*2;AudioSys.sfx('sword');}
    }else if(this.charge>0){this.charge--;this.move(this.vx,this.vy);}
    else {
      this.move(dx/d*.28,dy/d*.28);
      if(d<86&&Math.floor(this.t)%112===0)this.windup=24;
    }
    this.touchPlayer();
  }
  draw(c){
    const x=Math.round(this.x),y=Math.round(this.y),flash=this.flash>0;
    c.fillStyle=flash?'#fff':'#55546d';c.fillRect(x+2,y+2,12,13);
    c.fillStyle=flash?'#ffcf8a':'#a599a4';c.fillRect(x+4,y+1,8,9);
    c.fillStyle=this.windup?'#ff405c':'#ffb845';c.fillRect(x+5,y+5,2,2);c.fillRect(x+9,y+5,2,2);
    c.fillStyle='#31283e';c.fillRect(x+2,y+12,4,4);c.fillRect(x+10,y+12,4,4);
    if(this.windup){c.strokeStyle='#ff405c';c.strokeRect(x,y,16,16);}
  }
}
class CinderWarden extends Enemy {
  constructor(tx,ty){
    super(tx,ty);this.hp=16;this.touchDmg=1;this.dropTable=false;this.phase=1;
    this.shotTimer=70;this.speed=.34;this.hx=1;this.hy=1;this.hw=14;this.hh=15;
  }
  update(){
    if(this.baseUpdate())return;
    const dx=G.player.cx-this.cx,dy=G.player.cy-this.cy,d=Math.hypot(dx,dy)||1;
    this.phase=this.hp<=8?2:1;
    this.move(dx/d*(this.phase===2?.65:.3),dy/d*(this.phase===2?.65:.3));
    if(--this.shotTimer<=0&&d<180){
      const aim=Math.atan2(dy,dx),spread=this.phase===2?.3:.18;
      for(const da of [-spread,0,spread]){
        const a=aim+da;
        G.projectiles.push(new RockProj(this.cx-4,this.cy-4,Math.cos(a)*1.7,Math.sin(a)*1.7));
      }
      this.shotTimer=this.phase===2?45:75;AudioSys.sfx('bossRoar');G.shake=3;
    }
    this.touchPlayer();
  }
  die(){
    if(this.dead)return;
    super.die();G.flags.add('cinderwarden_defeated');
    G.flags.add('clear:emberkeep:1,0');
    Particles.spawn(this.cx,this.cy,32,{color:['#ff4848','#ffb347','#fff','#bd4aff'],speed:3.2,life:44,size:3});
    G.shake=10;AudioSys.sfx('bossHit');G.save();
  }
  draw(c){
    const x=Math.round(this.x),y=Math.round(this.y);
    c.save();
    c.globalAlpha=.24;c.fillStyle='#fb713a';c.beginPath();c.arc(x+8,y+8,14+Math.sin(this.t/9)*2,0,Math.PI*2);c.fill();
    c.globalAlpha=1;c.fillStyle=this.flash>0?'#ffe5c5':this.phase===2?'#e33957':'#904c92';
    c.fillRect(x+1,y+3,14,13);
    c.fillStyle='#2c1b3b';c.fillRect(x+3,y+1,10,6);
    c.fillStyle='#ffcc61';c.fillRect(x+4,y+6,3,3);c.fillRect(x+10,y+6,3,3);
    c.fillStyle='#fa742e';c.fillRect(x,y+3,3,4);c.fillRect(x+13,y+3,3,4);
    c.fillStyle='#ffd88b';c.fillRect(x+5,y+12,6,2);
    c.restore();
  }
}

class PrismBeast extends CinderWarden {
  constructor(tx,ty){super(tx,ty);this.hp=20;this.shotTimer=66;}
  die(){
    if(this.dead)return;
    // Separate quest completion, no interaction with the Cinder Warden flag.
    Enemy.prototype.die.call(this);
    G.flags.add('prismbeast_defeated');G.flags.add('clear:glasscrypt:1,0');
    Particles.spawn(this.cx,this.cy,40,{color:['#42e2ff','#ba70ff','#fff','#f4cf4a'],speed:3,life:45,size:3});
    G.shake=10;AudioSys.sfx('bossHit');G.save();
  }
  draw(c){
    const x=Math.round(this.x),y=Math.round(this.y),pulse=Math.sin(this.t/9);
    c.save();c.globalAlpha=.22;c.fillStyle='#43efff';
    c.beginPath();c.arc(x+8,y+8,14+pulse*2,0,6.283);c.fill();
    c.globalAlpha=1;
    c.fillStyle=this.flash>0?'#fff':this.phase===2?'#d857ff':'#5f73d2';
    c.beginPath();c.moveTo(x+8,y-3);c.lineTo(x+18,y+8);c.lineTo(x+8,y+19);c.lineTo(x-2,y+8);c.closePath();c.fill();
    c.fillStyle='#b6faff';c.fillRect(x+3,y+5,4,3);c.fillRect(x+10,y+5,4,3);
    c.fillStyle='#f0e3ff';c.fillRect(x+7,y+11,3,3);
    c.restore();
  }
}

// Validate new maps at boot, including both sides of the locked gate.
(function verifyKnightfallExpansion(){
  const check=(k,map)=>{
    if(!map.tiles||map.tiles.length!==11)throw Error('Cinder Keep invalid room '+k);
    for(const row of map.tiles){
      if(row.length!==16)throw Error('Cinder Keep invalid tile width '+k);
      for(const ch of row)if(!(ch in CHAR_TILE))throw Error('Cinder Keep unknown tile '+ch);
    }
  };
  for(const [k,v] of Object.entries(KEEP))check(k,v);
  for(const [k,v] of Object.entries(PRISM))check(k,v);
  for(const def of EAST_REALMS)check(def.x+','+def.y,OVERWORLD[def.x+','+def.y]);
  if(OVERWORLD['4,1'].tiles[5][15]!=='='||
      KEEP['2,1'].tiles[0].slice(7,10)!=='LLL')throw Error('Cinder Keep disconnected');
  console.log('[Embervale expansion] six eastern screens, six keep rooms, four prism rooms ready');
})();
