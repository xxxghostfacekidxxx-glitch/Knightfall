// Procedural boss artwork and theatrics, original to Imp Inferno.
// Attacks summon targets but never confiscate free-play credits.
const INK = '#230c21';
const CREAM = '#fff4c0';
const ATTACKS = {
  king: { label: 'CROWN NOVA', color: '#ffb34f' },
  hydra: { label: 'TRIPLE HELLFIRE', color: '#ff6680' },
  gargoyle: { label: 'STONEWING SLAM', color: '#cb98f7' },
};
const TAU = Math.PI * 2;

function shape(ctx, color, points, border = 3) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if(border){ctx.strokeStyle=INK;ctx.lineWidth=border;ctx.stroke();}
}
function oval(ctx, x, y, rx, ry, color, angle=0, border=0) {
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,angle,0,TAU);
  ctx.fillStyle=color;ctx.fill();
  if(border){ctx.lineWidth=border;ctx.strokeStyle=INK;ctx.stroke();}
}
function line(ctx, points, color, width=3) {
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
function text(ctx, label, x, y, color, size=13) {
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='900 '+size+'px system-ui';
  ctx.strokeStyle=INK;ctx.lineWidth=4;
  ctx.strokeText(label,x,y);
  ctx.fillStyle=color;ctx.fillText(label,x,y);
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

// A genuine king-sized sprite. The previous Furnace King reused the generic imp.
export function drawFurnaceKing(ctx, target, time, reducedMotion=false) {
  const scale=target.radius/76;
  const flap=reducedMotion?0:Math.sin(time*3.2+target.id)*12;
  const breathe=reducedMotion?0:Math.sin(time*5+target.id)*4;
  ctx.save();
  ctx.translate(target.x,target.y);
  ctx.scale(scale*(target.direction||1),scale);
  ctx.lineJoin='round';

  // Two sets of lava-veined wings and a long serrated demon tail.
  line(ctx,[[-20,24],[-65,51+breathe],[-89,32],[-108,43]],'#7d2548',15);
  line(ctx,[[-38,8],[-73,-29-flap],[-108,-50-flap]],'#fc743d',8);
  line(ctx,[[38,8],[73,-29+flap],[108,-50+flap]],'#fc743d',8);
  shape(ctx,'#822c4e',[[-21,5],[-49,-28-flap],[-78,-77-flap],
    [-110,-61-flap],[-94,-17],[-119,-5],[-82,6],[-73,34],[-41,19]]);
  shape(ctx,'#d63b40',[[21,5],[49,-28+flap],[78,-77+flap],
    [110,-61+flap],[94,-17],[119,-5],[82,6],[73,34],[41,19]]);
  shape(ctx,'#ff873d',[[-30,-2],[-49,-25-flap],[-78,-63-flap],
    [-87,-25],[-65,-7],[-58,18]]);
  shape(ctx,'#ff9d3c',[[30,-2],[49,-25+flap],[78,-63+flap],
    [87,-25],[65,-7],[58,18]]);
  for(const side of [-1,1]){
    line(ctx,[[side*34,-1],[side*81,-34+flap/3],[side*107,-54+flap/3]],'#ffdb6e',3);
    shape(ctx,'#ec6640',[[side*31,16],[side*52,29],[side*67,22],[side*55,4]]);
  }

  // Four-fingered claws, armored haunches and giant chest.
  shape(ctx,'#922c44',[[-41,17],[-60,39],[-52,67],[-34,73],[-14,49]]);
  shape(ctx,'#922c44',[[41,17],[60,39],[52,67],[34,73],[14,49]]);
  shape(ctx,'#ed6439',[[-35,20],[-51,49],[-36,57],[-23,40]]);
  shape(ctx,'#ed6439',[[35,20],[51,49],[36,57],[23,40]]);
  oval(ctx,0,16,45,43,target.flash?'#fff1c4':'#d64540',0,4.5);
  shape(ctx,'#69203d',[[-34,-4],[-21,7],[0,1],[21,7],[34,-4],[25,35],[0,56],[-25,35]]);
  shape(ctx,'#ee8247',[[-21,13],[0,6],[21,13],[16,32],[0,46],[-16,32]]);
  shape(ctx,'#fff1a0',[[-4,12],[4,12],[9,22],[0,37],[-9,22]],2.3);
  oval(ctx,0,26,5,9,'#ff4c45');

  // Split infernal horns and genuinely massive crown.
  shape(ctx,'#ffbb65',[[-39,-18],[-59,-44],[-53,-81],[-37,-57],[-26,-38]]);
  shape(ctx,'#ffbb65',[[39,-18],[59,-44],[53,-81],[37,-57],[26,-38]]);
  shape(ctx,'#6e1d3c',[[-43,-30],[-34,-73],[-13,-55],[0,-87],
    [13,-55],[34,-73],[43,-30],[31,-15],[-31,-15]]);
  shape(ctx,'#f8c063',[[-34,-36],[-30,-59],[-12,-46],[0,-75],
    [12,-46],[30,-59],[34,-36],[24,-26],[-24,-26]],2);
  for(const [x,y] of [[-25,-42],[0,-59],[25,-42]])oval(ctx,x,y,4,6,'#ff4d56');

  // Face, burning eyes, oversized teeth, and vicious grin.
  shape(ctx,'#7c2745',[[-37,-26],[-21,-40],[2,-34],[27,-40],[38,-24],[41,3],
    [26,19],[0,27],[-26,19],[-41,2]]);
  shape(ctx,target.flash?'#fff1c4':'#f6603c',[[-35,-21],[-19,-33],[0,-26],
    [24,-33],[34,-21],[30,5],[12,16],[-12,16],[-30,5]],2);
  shape(ctx,'#41122b',[[-31,-18],[-10,-24],[-4,-10],[-25,-9]],0);
  shape(ctx,'#41122b',[[31,-18],[10,-24],[4,-10],[25,-9]],0);
  oval(ctx,-17,-13,7,8,'#ffe8a6');
  oval(ctx,17,-13,7,8,'#ffe8a6');
  oval(ctx,-14,-13,3.2,6,'#3b1431');
  oval(ctx,14,-13,3.2,6,'#3b1431');
  oval(ctx,0,4,23,10,'#340b24');
  shape(ctx,'#fff4d7',[[-21,1],[-13,3],[-10,12],[-5,3],[0,7],
    [6,3],[10,12],[15,3],[22,0],[15,7],[-15,8]],0);
  oval(ctx,-3,-24,3,2,'#fffecc');
  ctx.restore();
}

export function drawBossTell(ctx, target, time, reducedMotion=false) {
  if (!ATTACKS[target.species] || !(target.nextAttack > time))return;
  const remaining=target.nextAttack-time;
  if (remaining > 1.35)return;
  const {label,color}=ATTACKS[target.species];
  const progress=1-remaining/1.35;
  const radius=target.radius+12+(reducedMotion?0:progress*15);
  ctx.save();
  ctx.translate(target.x,target.y);
  ctx.globalAlpha=.35+progress*.6;
  ctx.strokeStyle=color;ctx.lineWidth=2.5+progress*2;
  ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4+(reducedMotion?0:time*.7);
    const dx=Math.cos(angle),dy=Math.sin(angle);
    line(ctx,[[dx*(radius+3),dy*(radius+3)],[dx*(radius+18),dy*(radius+18)]],color,2.5);
  }
  ctx.globalAlpha=.95;
  text(ctx,label,0,-radius-24,color,Math.max(10,Math.min(15,target.radius*.21)));
  ctx.restore();
}

export function drawBossAttack(ctx, effect, reducedMotion=false) {
  if(effect.kind!=='boss-attack' || !(effect.duration>0))return false;
  const kind=ATTACKS[effect.species];
  if(!kind)return false;
  const progress=Math.max(0,Math.min(1,1-effect.life/effect.duration));
  const color=kind.color;
  const radius=effect.radius || 75;
  ctx.save();
  ctx.translate(effect.x,effect.y);
  ctx.globalAlpha=Math.min(.95,1-progress*.92);
  if(effect.species==='king') {
    // Crown Nova: three expanding rings and exploding flame spokes.
    for(let ring=0;ring<3;ring++){
      const r=radius*(.4+progress*2.25+ring*.26);
      ctx.beginPath();ctx.arc(0,0,r,0,TAU);
      ctx.strokeStyle=ring===1?'#fff7bf':color;
      ctx.lineWidth=ring===1?4:7*(1-progress)+1;
      ctx.stroke();
    }
    for(let i=0;i<16;i++){
      const a=i*TAU/16+(reducedMotion?0:progress*.6);
      const inner=radius*(.5+progress*.4);
      const outer=radius*(1.2+progress*2.1)+(i%2)*12;
      line(ctx,[[Math.cos(a)*inner,Math.sin(a)*inner],
        [Math.cos(a)*outer,Math.sin(a)*outer]],i%3?'#ff654c':'#fff2aa',2+(1-progress)*4);
    }
  }else if(effect.species==='hydra'){
    // Triple Hellfire: a fanning three-headed volley, with a pale core.
    const direction=effect.direction||1;
    for(let i=-1;i<=1;i++){
      const endX=direction*(radius*2.8)*(.45+progress*.65);
      const endY=i*radius*(1.2+progress*.6);
      for(const [width,shade] of [[22,color],[9,'#ffb45e'],[3,'#fff9d2']]){
        ctx.beginPath();ctx.moveTo(direction*radius*.18,i*radius*.33);
        ctx.quadraticCurveTo(direction*radius*1.6,i*radius*.25,endX,endY);
        ctx.strokeStyle=shade;ctx.lineWidth=width*(1-progress*.65);ctx.stroke();
      }
      oval(ctx,endX,endY,6+12*(1-progress),7+12*(1-progress),'#fff6c8');
    }
  }else{
    // Stonewing Slam: a faceted purple shockwave and falling shards.
    for(let layer=0;layer<2;layer++){
      const r=radius*(.45+progress*2.2+layer*.2);
      const sides=12;
      ctx.beginPath();
      for(let i=0;i<=sides;i++){
        const a=(i%sides)*TAU/sides;
        const x=Math.cos(a)*r,y=Math.sin(a)*r;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.strokeStyle=layer?'#fff0d5':color;ctx.lineWidth=layer?2:6;ctx.stroke();
    }
    if(!reducedMotion){
      for(let i=0;i<9;i++){
        const angle=i*TAU/9;
        const dist=radius*(.3+progress*1.7);
        ctx.save();ctx.translate(Math.cos(angle)*dist,Math.sin(angle)*dist);
        ctx.rotate(angle+progress*4);
        shape(ctx,i%2?'#ffc6a2':color,[[-5,4],[0,-10],[8,2],[0,12]],1);
        ctx.restore();
      }
    }
  }
  ctx.restore();
  return true;
}


// Boss armor flashes on a resisted capture shot. All credit and catch logic
// remains exclusively on the game engine, not inside this cosmetic renderer.
export function drawBossHit(ctx, effect, reducedMotion=false) {
  if(effect.kind!=='boss-hit' || !(effect.duration>0))return false;
  const palette=ATTACKS[effect.species] ?? ATTACKS.king;
  const opacity=Math.max(0,Math.min(1,effect.life/effect.duration));
  const ring=effect.radius*(.7+(1-opacity)*.55);
  ctx.save();
  ctx.translate(effect.x,effect.y);
  ctx.globalAlpha=opacity;
  ctx.beginPath();ctx.arc(0,0,ring,0,TAU);
  ctx.strokeStyle='#fff7d7';ctx.lineWidth=5*opacity+1;ctx.stroke();
  if(!reducedMotion){
    const count=12;
    for(let i=0;i<count;i++){
      const a=i*TAU/count;
      const r=ring+(1-opacity)*20;
      line(ctx,[[Math.cos(a)*(r-12),Math.sin(a)*(r-12)],
        [Math.cos(a)*(r+8),Math.sin(a)*(r+8)]],i%3?'#fff6c3':palette.color,2.8);
    }
  }
  ctx.restore();
  return true;
}


// Shared, visible boss armor: each landed net strips a chunk, even when capture
// fails. Different players contribute to the same bar, and the final shot wins.
export function drawBossArmor(ctx, target, time, reducedMotion=false) {
  if(!ATTACKS[target.species])return false;
  const maximum=Math.max(1,target.maxArmor??({king:18,hydra:14,gargoyle:10}[target.species]));
  const remaining=Math.max(0,Math.min(maximum,Number.isFinite(target.armor)?target.armor:maximum));
  const fraction=remaining/maximum;
  const exposed=target.exposedUntil>time;
  const palette=ATTACKS[target.species];
  const width=Math.max(92,Math.min(160,target.radius*1.8)), height=10;
  // Leave clearance for the King's crown/name. Both stay in the game field.
  const top=target.y-target.radius-(target.species==='king'?55:30);
  const x=target.x-width/2;
  ctx.save();
  ctx.globalAlpha=.97;
  ctx.fillStyle='#200b1de8';
  ctx.fillRect(x-5,top-5,width+10,height+10);
  ctx.strokeStyle=exposed?'#fff7a8':'#bc8b70';
  ctx.lineWidth=2;
  ctx.strokeRect(x-5,top-5,width+10,height+10);
  ctx.fillStyle='#391b31';
  ctx.fillRect(x,top,width,height);
  if(fraction>0){
    const gradient=ctx.createLinearGradient(x,top,x+width,top);
    gradient.addColorStop(0,fraction<=.3?'#ff425b':'#ff774b');
    gradient.addColorStop(.55,fraction<=.3?'#ffbf5e':palette.color);
    gradient.addColorStop(1,'#fff3a0');
    ctx.fillStyle=gradient;
    ctx.fillRect(x,top,Math.max(1,width*fraction),height);
  }
  // Individual armor segments and jagged cracks make damage easy to read.
  for(let i=1;i<maximum;i++){
    const px=x+width*i/maximum;
    ctx.beginPath();ctx.moveTo(px,top+1);ctx.lineTo(px,top+height-1);
    ctx.strokeStyle='#290c2280';ctx.lineWidth=1;ctx.stroke();
  }
  if(fraction<.5){
    ctx.strokeStyle='#fff3a6a0';ctx.lineWidth=1.4;
    const length=width*(1-fraction);
    for(let i=0;i<3;i++){
      const px=x+length*(i+1)/4;
      line(ctx,[[px,top],[px+4,top+5],[px+1,top+height]],'#fff1b2',1.2);
    }
  }
  text(ctx,exposed?'WEAK POINT!':'ARMOR '+Math.ceil(remaining)+'/'+maximum,
    target.x,top-12,exposed?'#fff7af':'#ffe4bd',11);
  if(exposed){
    const pulse=reducedMotion?1:1+Math.sin(time*12)*.14;
    const y=target.y-target.radius*.25;
    ctx.globalAlpha=.75;
    oval(ctx,target.x,y,9*pulse,9*pulse,palette.color,0,2);
    oval(ctx,target.x,y,4,4,'#fffce3');
  }
  ctx.restore();
  return true;
}
