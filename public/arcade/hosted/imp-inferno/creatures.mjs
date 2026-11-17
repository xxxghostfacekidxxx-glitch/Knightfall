// Original procedural silhouettes for Imp Inferno's non-imp creature families.
export const CREATURE_SPECIES = Object.freeze([
  'coalbug', 'cinderbat', 'hellhound', 'skullwisp',
  'magmaworm', 'boneserpent', 'gargoyle', 'hydra',
]);
const CREATURE_SET = new Set(CREATURE_SPECIES);
const INK = '#210912';
export function isCreature(species) { return CREATURE_SET.has(species); }

function oval(ctx, x, y, rx, ry, color, angle = 0, outline = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = outline;
    ctx.stroke();
  }
}
function shape(ctx, color, points, outline = 2.4) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) { ctx.lineWidth = outline; ctx.strokeStyle = INK; ctx.stroke(); }
}
function curve(ctx, color, width, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}
function eyes(ctx, points, color = '#fff8bf') {
  for (const [x, y, rx = 3, ry = 4] of points) oval(ctx, x, y, rx, ry, color);
}

export function drawCreature(ctx, target, time) {
  if (!isCreature(target.species)) return false;
  const p = time * 5 + target.id;
  const wiggle = Math.sin(p);
  const scale = target.radius / (target.species === 'hydra' ? 43 : 27);
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.scale(scale * (target.direction || 1), scale);
  ctx.lineJoin = 'round';
  oval(ctx, 0, 29, 32, 5, '#19060d75');
  switch (target.species) {
    case 'coalbug': {
      for (const side of [-1, 1]) {
        for (let i = -1; i <= 1; i++) curve(ctx, '#c04c35', 5,
          [[side * 13, i * 7 + 1], [side * (28 + wiggle * 3), i * 11 + 8]]);
      }
      curve(ctx, '#ff9d43', 3, [[-8, -18], [-13, -30], [-20, -33 + wiggle * 3]]);
      curve(ctx, '#ff9d43', 3, [[8, -18], [13, -30], [20, -33 - wiggle * 3]]);
      oval(ctx, 0, 1, 25, 22, '#60243c', 0, 3);
      oval(ctx, 0, -3, 21, 20, target.flash ? '#fff6d2' : '#f35d2a');
      curve(ctx, '#79253a', 3, [[0, -21], [0, 15]]);
      oval(ctx, -10, -1, 5, 6, '#ffa946');
      oval(ctx, 10, -1, 5, 6, '#ffa946');
      eyes(ctx, [[-8, -12, 3, 4], [8, -12, 3, 4]]);
      break;
    }
    case 'cinderbat': {
      const flap = Math.sin(p * 2.4) * 10;
      shape(ctx, '#b53b60', [[-10,-7],[-30,-26-flap],[-51,-30-flap],[-44,0-flap],
        [-34,-5],[-23,13],[-15,6]]);
      shape(ctx, '#f85d3c', [[10,-7],[30,-26-flap],[51,-30-flap],[44,0-flap],
        [34,-5],[23,13],[15,6]]);
      shape(ctx, '#ffb04e', [[-20,-10],[-17,-32],[-3,-20],[9,-21],[20,-34],[24,-11]]);
      oval(ctx, 0, 1, 22, 21, target.flash ? '#fff1b5' : '#922b53', 0, 3);
      oval(ctx, 0, 6, 15, 11, '#ed7047');
      eyes(ctx, [[-9,-5,5,5],[9,-5,5,5]]);
      shape(ctx, '#fff2dd', [[-9,10],[-4,11],[-7,18]], 0);
      shape(ctx, '#fff2dd', [[7,10],[11,9],[9,18]], 0);
      break;
    }
    case 'hellhound': {
      curve(ctx, '#9b2943', 11, [[-22,0],[-38,-14],[-44,-29-wiggle*6]]);
      shape(ctx, '#ffb13e', [[-26,-17],[-16,-33],[-7,-19],[12,-22],[28,-9],
        [25,10],[14,16],[-20,15]]);
      shape(ctx, '#8e2c3e', [[-22,7],[-15,9],[-17,29],[-28,29],[-30,21],
        [-2,6],[9,9],[19,29],[29,29],[29,17],[23,-3]]);
      oval(ctx, 4, -5, 26, 18, target.flash ? '#ffe6aa' : '#e24d3f', -.12, 3);
      shape(ctx, '#62233c', [[13,-15],[21,-30],[26,-13],[35,-17],[43,-8],
        [35,10],[18,13],[10,4]]);
      shape(ctx, '#f0ae53', [[29,-10],[45,-5],[38,7],[25,7]]);
      eyes(ctx, [[28,-9,4,3]]);
      shape(ctx, '#fff0cf', [[34,7],[30,15],[26,7]], 0);
      break;
    }
    case 'skullwisp': {
      const sway = Math.sin(p*.8)*5;
      shape(ctx, '#802d70', [[-15,-6],[-23,15],[-12,27],[-6,18],[3,35],
        [8,17],[18,23],[20,2],[14,-14]]);
      shape(ctx, '#ed6a9c', [[-13,-8],[-20,8],[-11,15],[0,26+sway],
        [10,11],[19,7],[12,-14]]);
      oval(ctx, 0, -8, 23, 21, target.flash ? '#fff9dc' : '#fce3b8', 0, 3);
      shape(ctx, '#fce3b8', [[-13,0],[13,0],[10,15],[-10,15]], 2);
      oval(ctx, -9, -8, 7, 8, '#682c59', -.2);
      oval(ctx, 9, -8, 7, 8, '#682c59', .2);
      shape(ctx, '#692a56', [[0,-3],[-4,4],[4,4]], 0);
      for(let x=-7;x<=7;x+=7) curve(ctx, '#692a56', 2, [[x,9],[x,14]]);
      break;
    }
    case 'magmaworm': {
      for (let i=0;i<6;i++) {
        const x=-34+i*12;
        const y=5+Math.sin(p*1.5+i*.8)*5;
        oval(ctx,x,y,13,15,i%2?'#f99e34':'#b8383f',-.2,2);
        oval(ctx,x,y-6,5,4,'#ffd361');
        shape(ctx,'#ffdb75',[[x-4,y-14],[x,y-24],[x+4,y-13]],1);
      }
      oval(ctx,29,0,18,19,target.flash?'#fff3ba':'#ed5b30',0,3);
      shape(ctx,'#ffcd68',[[18,-11],[21,-26],[29,-13],[37,-27],[39,-8]]);
      eyes(ctx,[[32,-6,4,5]]);
      shape(ctx,'#542036',[[27,7],[40,8],[33,14]],0);
      break;
    }
    case 'boneserpent': {
      const segments=[];
      for(let i=0;i<8;i++){
        const x=-41+i*11;
        const y=8+Math.sin(p*.9+i*.9)*12;
        segments.push([x,y]);
        oval(ctx,x,y,8,7,'#e0cfb5',.5,1.5);
        oval(ctx,x,y,3.5,3,'#71354d');
      }
      curve(ctx,'#ead8b9',4,segments);
      shape(ctx,'#e6d7be',[[27,-13],[48,-7],[49,7],[37,16],[22,11],[19,-2]]);
      shape(ctx,'#9e5361',[[24,-14],[30,-28],[35,-12]],2);
      eyes(ctx,[[38,-2,4,5]],'#a84355');
      shape(ctx,'#fff5da',[[36,14],[41,22],[44,10]],0);
      break;
    }
    case 'gargoyle': {
      const casting = target.lastAttack != null && time - target.lastAttack < .8;
      const flap = Math.sin(p*.9)*5 + (casting ? 15 : 0);
      shape(ctx,'#6f4d79',[[-11,-11],[-23,-35-flap],[-50,-40-flap],
        [-39,-16],[-43,2],[-20,8]]);
      shape(ctx,'#9a6c82',[[11,-11],[23,-35-flap],[50,-40-flap],
        [39,-16],[43,2],[20,8]]);
      shape(ctx,'#d4a09c',[[-26,-15],[-21,-35],[-9,-19],[7,-18],[19,-35],[26,-14]]);
      shape(ctx,'#755779',[[-17,3],[-25,25],[-12,30],[-5,19],
        [12,19],[18,29],[30,25],[20,1]]);
      oval(ctx,0,-6,23,23,target.flash?'#ffe6b9':'#9c7a88',0,3);
      shape(ctx,'#5e3b67',[[-14,-11],[-8,-21],[9,-21],[16,-9],[10,8],[-12,8]]);
      eyes(ctx,[[-10,-7,4,5],[10,-7,4,5]],'#9cffb5');
      shape(ctx,'#f9e8cf',[[-8,10],[-3,17],[1,11],[5,17],[10,9]],0);
      break;
    }
    case 'hydra': {
      const casting = target.lastAttack != null && time - target.lastAttack < .85;
      const heads=[[-32,-21], [0,-34], [32,-19]];
      for(let i=0;i<3;i++){
        const [x,y]=heads[i];
        const sway=Math.sin(p*.65+i*2)*5;
        curve(ctx,'#4c1c43',18,[[0,20],[x*.52,0],[x+sway,y+12]]);
        curve(ctx,'#e05848',12,[[0,20],[x*.52,0],[x+sway,y+12]]);
      }
      shape(ctx,'#842c48',[[-39,20],[-23,4],[0,8],[20,3],[42,20],
        [29,33],[-24,33]]);
      oval(ctx,0,17,28,16,target.flash?'#ffedbe':'#ed6546',0,3);
      for(let i=0;i<3;i++){
        const [x,y]=heads[i];const sway=Math.sin(p*.65+i*2)*5;
        const hx=x+sway;
        shape(ctx,'#ffb753',[[hx-12,y+2],[hx-9,y-15],
          [hx-1,y-9],[hx+8,y-17],[hx+13,y+4],[hx+4,y+11],[hx-11,y+10]]);
        eyes(ctx,[[hx+5,y-1,4,4]],casting?'#fff9be':'#ff4264');
        shape(ctx,'#fff4cb',[[hx+6,y+9],[hx+11,y+17],[hx+13,y+6]],0);
        if(casting){
          shape(ctx,i%2?'#ffb64a':'#ff6680',[[hx+12,y+7],[hx+29,y+3],[hx+41,y+9],[hx+30,y+15],[hx+15,y+13]],0);
          oval(ctx,hx+32,y+9,7,3,'#fff4d1');
        }
      }
      break;
    }
  }
  ctx.restore();
  return true;
}
