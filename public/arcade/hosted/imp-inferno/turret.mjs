import { SEAT_COLORS, seatOrigin } from './furnace.mjs?v=10';

// Vector-rendered, swiveling furnace cannons, shared by solo and online seats.
export const TURRET_TIP = 46;
const INK = '#1b0b18';
const CREAM = '#fff4ca';

function oval(ctx, x, y, rx, ry, color, edge = '', width = 2) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = width; ctx.stroke(); }
}
function poly(ctx, points, color, edge = INK, width = 2.5) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const pt of points.slice(1)) ctx.lineTo(...pt);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = width; ctx.stroke(); }
}
function line(ctx, points, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const pt of points.slice(1)) ctx.lineTo(...pt);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function text(ctx, label, x, y, color, size = 12) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 ' + size + 'px system-ui';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.strokeText(label, x, y);
  ctx.fillStyle = color;
  ctx.fillText(label, x, y);
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export function drawTurret(ctx, table, seat, index, reducedMotion = false) {
  const { x, y } = seatOrigin(table, index);
  const accent = SEAT_COLORS[index];
  const power = clamp(seat.power ?? 0, 0, 6);
  const recoil = clamp(seat.recoil, 0, 1);
  const pulse = reducedMotion ? 0 : Math.sin(table.time * 4 + index * 2) * .07;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';

  // Heavy cast-iron, eight-toothed swivel socket.
  oval(ctx, 0, 4, 36, 35, '#130713aa');
  for (let i=0; i<8; i++) {
    const a=i*Math.PI/4, dx=Math.cos(a), dy=Math.sin(a);
    poly(ctx, [[dx*25-dy*6,dy*25+dx*6],[dx*35-dy*4,dy*35+dx*4],
      [dx*35+dy*4,dy*35-dx*4],[dx*25+dy*6,dy*25-dx*6]],
    i%2?'#4b293c':'#7b5360', INK, 1.7);
  }
  oval(ctx,0,0,30,30,'#241421','#d7a478',2.6);
  oval(ctx,0,0,26,26,'#62374e',INK,3);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    oval(ctx,Math.cos(a)*25,Math.sin(a)*25,2,2,CREAM);
  }
  oval(ctx,0,0,21,21,'#201322',accent,2.3);
  oval(ctx,0,0,16,16,accent);
  oval(ctx,0,0,12,12,'#882a3e',INK,2);
  poly(ctx,[[-7,5],[-4,-9],[1,-15],[5,-2],[10,2],[3,12],[-4,10]],'#ffc05a','');
  oval(ctx,1,3,4,6,'#fffbc0');

  // The raised double-flanked barrel rotates independently of the pedestal.
  ctx.rotate(Number.isFinite(seat.angle)?seat.angle:-Math.PI/2);
  ctx.translate(-recoil*8,0);
  poly(ctx,[[-16,-12],[-28,-25],[-33,-20],[-26,-3],[-14,0]],'#9e5160');
  poly(ctx,[[-16,12],[-28,25],[-33,20],[-26,3],[-14,0]],'#9e5160');
  poly(ctx,[[-21,-12],[-7,-21],[17,-20],[27,-15],[44,-13],[48,13],
    [27,15],[17,20],[-7,21],[-21,12]],'#261421',INK,3.5);
  poly(ctx,[[-12,-16],[7,-20],[31,-16],[38,-12],[35,-8],[-12,-6]],'#8a5964');
  poly(ctx,[[-12,16],[7,20],[31,16],[38,12],[35,8],[-12,6]],'#653d54');
  poly(ctx,[[-14,-10],[16,-13],[37,-10],[37,10],[16,13],[-14,10]],'#3b2233',INK,1.8);
  poly(ctx,[[-9,-5],[30,-5],[35,0],[30,5],[-9,5]],accent,'');
  line(ctx,[[-7,-12],[9,-15],[28,-13]],'#ffdda7',2);
  line(ctx,[[-7,12],[9,15],[28,13]],'#c68979',2);
  for(let i=0;i<3;i++){
    const xx=10+i*8;
    line(ctx,[[xx,-14],[xx+2,-9]],'#f0bd8e',2.5);
    line(ctx,[[xx,14],[xx+2,9]],'#f0bd8e',2.5);
  }
  // Braced demon-jaw muzzle and twin copper prongs.
  poly(ctx,[[27,-16],[38,-22],[46,-20],[39,-10],[33,-7]],'#edaf76');
  poly(ctx,[[27,16],[38,22],[46,20],[39,10],[33,7]],'#c78e6f');
  poly(ctx,[[34,-9],[49,-11],[54,-7],[54,7],[49,11],[34,9]],'#1d1020','#e3ac75',2.2);
  oval(ctx,50,0,4.5,6,'#12121f',accent,2);
  oval(ctx,50,0,2+power*.3,2.6+power*.3,CREAM);
  // Ornate horned rear housing, its reactor eye intensifies with shot power.
  poly(ctx,[[-15,-12],[-23,-26],[-8,-18],[3,-11],[3,11],[-8,18],[-23,26],[-15,12]],'#a74c58');
  oval(ctx,-10,0,13,13,'#2d1324','#dc9e79',2);
  oval(ctx,-10,0,9*(1+pulse+power*.045),9*(1+pulse+power*.045),'#da5544');
  oval(ctx,-9,-1,4,6,accent);
  oval(ctx,-8,-2,2,3,CREAM);
  if(power>=4){
    line(ctx,[[-12,-20],[-4,-25],[3,-20]],accent,2.4);
    line(ctx,[[-12,20],[-4,25],[3,20]],accent,2.4);
  }
  ctx.restore();

  // Anchored inside each rail, including the top/bottom on mobile.
  const score = seat.name === 'Open' || seat.name === 'Away' ? ''
    : index ? ' ' + seat.credits : '';
  text(ctx,seat.name.toUpperCase()+score,x,y+(index===2?-32:34),accent,11.5);
}

export function drawMuzzle(ctx, effect, reducedMotion = false) {
  if (effect.kind !== 'muzzle' || !(effect.duration > 0)) return;
  const strength = clamp(effect.power,0,6);
  const opacity = clamp(effect.life/effect.duration,0,1);
  const accent = SEAT_COLORS[effect.seat] ?? CREAM;
  const length=(reducedMotion?11:19+3*strength)*opacity;
  const width=9+strength*1.8;
  ctx.save();
  ctx.translate(effect.x,effect.y);
  ctx.rotate(effect.angle);
  ctx.globalAlpha=opacity;
  poly(ctx,[[-8,-width*.6],[5,-width],[length,-4],[length+10,0],[length,4],[5,width],[-8,width*.6]],accent,'');
  poly(ctx,[[-5,-4],[length*.7,-3],[length+6,0],[length*.7,3],[-5,4]],CREAM,'');
  oval(ctx,0,0,5+strength*.6,5+strength*.6,'#ffffff');
  if(!reducedMotion){
    for(const direction of [-1,1])
      line(ctx,[[7,direction*(width+2)],[13+strength,direction*(width+9)]],accent,2);
  }
  ctx.restore();
}

export function drawProjectile(ctx, shot, time = 0, reducedMotion = false) {
  const accent=SEAT_COLORS[shot.seat] ?? CREAM;
  const size=(shot.drill?7:3.5)+Math.sqrt(clamp(shot.cost,1,25))*.6;
  ctx.save();
  ctx.translate(shot.x,shot.y);
  ctx.rotate(shot.angle);
  if(!reducedMotion){
    poly(ctx,[[-24,0],[-8,-size*1.2],[-2,-size],[3,0],[-2,size],[-8,size*1.2]],accent,'');
    line(ctx,[[-25,0],[-17,0],[-11,-1]],'#ffbd6a',2.4);
  }
  oval(ctx,0,0,size*1.2,size*.85,accent);
  oval(ctx,1,0,size*.72,size*.55,CREAM);
  if(shot.drill){
    for(let i=0;i<3;i++){
      const a=time*9+i*Math.PI*2/3;
      ctx.beginPath();ctx.arc(0,0,size+3,a,a+Math.PI/3);
      ctx.lineWidth=2;ctx.strokeStyle=accent;ctx.stroke();
    }
    poly(ctx,[[4,-4],[13,0],[4,4]],CREAM,'');
  }
  ctx.restore();
}

export function drawReticle(ctx, table, control, seat, reducedMotion = false) {
  if (!control?.aim) return;
  const target=table.targets.find(item=>item.id===control.lockId);
  const aim=target??control.aim;
  if (!Number.isFinite(aim.x)||!Number.isFinite(aim.y))return;
  const accent=SEAT_COLORS[seat]??CREAM;
  const radius=(target?target.radius+13:14)+(reducedMotion?0:Math.sin(table.time*5)*1.6);
  ctx.save();ctx.translate(aim.x,aim.y);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2+Math.PI/4;
    ctx.beginPath();ctx.arc(0,0,radius,a-.24,a+.24);
    ctx.strokeStyle=accent;ctx.lineWidth=target?3:2;ctx.stroke();
    const dx=Math.cos(a),dy=Math.sin(a);
    line(ctx,[[dx*(radius+3),dy*(radius+3)],[dx*(radius+9),dy*(radius+9)]],accent,2);
  }
  if(target){oval(ctx,0,0,2.7,2.7,CREAM);text(ctx,'LOCK',0,-radius-15,accent,10);}
  else {line(ctx,[[-6,0],[6,0]],accent,1.6);line(ctx,[[0,-6],[0,6]],accent,1.6);}
  ctx.restore();
}
