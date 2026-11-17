import { HEIGHT, SEAT_COLORS, seatOrigin, WHEEL_MULTIPLIERS } from './furnace.mjs?v=10';
import { drawCreature } from './creatures.mjs?v=1';
import { drawMuzzle, drawProjectile, drawReticle, drawTurret } from './turret.mjs?v=1';

const INK = '#210912';
const COLORS = {
  grinner: ['#ff653d', '#a41737', '#ffe087'],
  ashwing: ['#ffb738', '#ce4529', '#fff1a4'],
  brute: ['#f04838', '#7f1738', '#ffd267'],
  fuse: ['#ff8e33', '#8e2635', '#ffe892'],
  spark: ['#f35555', '#ab2759', '#fffab4'],
  prism: ['#ff735a', '#a02453', '#fff5bb'],
  drill: ['#ff762b', '#802138', '#ffd886'],
  vortex: ['#fc4b55', '#661935', '#ffe0a2'],
  croupier: ['#a646d4', '#651551', '#ffd992'],
  firestorm: ['#fa501d', '#802d2c', '#fff0a6'],
  king: ['#fd783c', '#8c1337', '#ffe58b'],
};

function polygon(ctx, fill, points, line = 3) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (line) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = line;
    ctx.stroke();
  }
}

function ellipse(ctx, x, y, rx, ry, fill, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function imp(ctx, target, time) {
  const [skin, shade, light] = COLORS[target.species];
  const scale = target.radius / 27;
  const flap = Math.sin(time * 16 + target.id) * 7;
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.scale(scale * (target.direction || 1), scale);
  ctx.lineJoin = 'round';

  ellipse(ctx, 0, 28, 34, 6, '#19060d59');
  polygon(ctx, shade, [[-14, 1], [-31, -16 + flap], [-52, -22 + flap], [-43, 11], [-32, 5], [-26, 22], [-15, 13]]);
  polygon(ctx, skin, [[14, 1], [31, -16 + flap], [52, -22 + flap], [43, 11], [32, 5], [26, 22], [15, 13]]);
  polygon(ctx, shade, [[-8, 20], [-4, 32], [-22, 27], [-25, 34], [-30, 26], [-26, 23], [-16, 24]], 2);
  polygon(ctx, light, [[-23, -12], [-32, -30], [-32, -47], [-19, -35], [-13, -20]]);
  polygon(ctx, light, [[14, -18], [21, -37], [35, -43], [29, -22], [24, -11]]);
  polygon(ctx, shade, [[-22, -20], [-4, -28], [25, -21], [35, -5], [29, 15], [12, 27], [-10, 24], [-30, 14], [-34, -3]]);
  polygon(ctx, target.flash ? '#fff7cd' : skin, [[-28, -4], [-21, -17], [-4, -24], [23, -17], [30, -5], [22, 12], [7, 17], [-16, 14]], 0);
  polygon(ctx, light, [[-25, -4], [-18, -12], [-6, -8], [-3, 3], [-15, 4]], 2);
  polygon(ctx, light, [[4, 2], [8, -8], [21, -13], [25, -6], [20, 4]], 2);
  ellipse(ctx, -12, -3, 2.3, 5.3, INK, -.17);
  ellipse(ctx, 14, -4, 2.3, 5.5, INK, .2);
  polygon(ctx, INK, [[-18, 7], [-1, 11], [22, 6], [14, 19], [-2, 21], [-13, 15]], 0);
  polygon(ctx, '#fff3d3', [[-12, 9], [-6, 11], [-9, 15], [0, 12], [8, 10], [6, 16], [14, 9], [18, 8], [14, 13], [-5, 18]], 0);
  polygon(ctx, '#ffffff75', [[-17, -17], [-5, -21], [8, -19], [-4, -17]], 0);
  if (target.species === 'king') {
    polygon(ctx, '#ffd56a', [[-20, -23], [-22, -44], [-8, -37], [0, -49], [11, -36], [24, -45], [19, -21]], 3);
    ellipse(ctx, 1, -33, 4, 5, '#ff543b');
  } else if (target.bonus) {
    ellipse(ctx, -2, 23, 8, 9, target.bonus === 'blast' ? '#ffb339' : '#fffad0');
    const glyphs = { blast: '✹', chain: 'ϟ', beam: '◆', drill: '▼', vortex: '◎', wheel: '✦', storm: '▲' };
    ctx.font = '900 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    ctx.fillText(glyphs[target.bonus], -2, 23);
  }
  ctx.restore();
}

function drawTarget(ctx, target, time) {
  if (!drawCreature(ctx, target, time)) imp(ctx, target, time);
}

function label(ctx, text, x, y, color, size = 13) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 ' + size + 'px system-ui';
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawNet(ctx, effect, opacity) {
  const radius = effect.radius * (.5 + .5 * (1 - opacity));
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (effect.kind !== 'net') {
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius * .88, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  for (let ring = 1; ring <= 3; ring++) {
    ctx.beginPath();
    for (let ray = 0; ray < 8; ray++) {
      const angle = ray * Math.PI / 4;
      const x = effect.x + Math.cos(angle) * radius * ring / 3.2;
      const y = effect.y + Math.sin(angle) * radius * ring / 3.2;
      if (ray === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  for (let ray = 0; ray < 8; ray++) {
    const angle = ray * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(effect.x, effect.y);
    ctx.lineTo(effect.x + Math.cos(angle) * radius, effect.y + Math.sin(angle) * radius);
    ctx.stroke();
  }
}

function drawEffect(ctx, effect, table, reducedMotion) {
  const opacity = effect.life / effect.duration;
  const color = SEAT_COLORS[effect.seat];
  ctx.save();
  ctx.globalAlpha = Math.min(1, opacity * 1.65);
  if (effect.kind === 'muzzle') {
    drawMuzzle(ctx, effect, reducedMotion);
  } else if (effect.kind === 'catch') {
    if (!reducedMotion) {
      const origin = seatOrigin(table, effect.seat);
      const progress = Math.pow(1 - opacity, 2);
      for (let coin = 0; coin < 4; coin++) {
        const drift = Math.sin(Math.PI * progress) * (coin - 1.5) * 18;
        const x = effect.x + (origin.x - effect.x) * progress + drift;
        const y = effect.y + (origin.y - effect.y) * progress - drift;
        ellipse(ctx, x, y, 3 + coin % 2, 5, color, progress * 8);
        ellipse(ctx, x, y, 1.2, 3, '#fff3b4', progress * 8);
      }
      if (opacity > .68) {
        ctx.globalAlpha = (opacity - .68) * 2.4;
        drawTarget(ctx, { ...effect.target, y: effect.y - (1 - opacity) * 38, radius: effect.target.radius * opacity, flash: true }, table.time);
        ctx.globalAlpha = Math.min(1, opacity * 1.65);
      }
    }
    label(ctx, '+' + effect.amount, effect.x, effect.y - 42 + opacity * 28, color, effect.seat ? 14 : 21);
  } else if (effect.kind === 'beam') {
    for (const [width, shade] of [[25, color + '85'], [11, color], [3, '#fff5cb']]) {
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);
      ctx.lineTo(effect.endX, effect.endY);
      ctx.lineWidth = width * Math.max(.14, opacity);
      ctx.strokeStyle = shade;
      ctx.stroke();
    }
  } else {
    ctx.lineWidth = effect.kind === 'net' || effect.kind === 'bounce' ? 1.6 : 4;
    ctx.strokeStyle = color;
    drawNet(ctx, effect, opacity);
    if (effect.kind === 'chain' || effect.kind === 'vortex') {
      for (const point of effect.points) {
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        const dx = point.x - effect.x;
        const dy = point.y - effect.y;
        ctx.lineTo(effect.x + dx * .32 + dy * .12, effect.y + dy * .32 - dx * .12);
        ctx.lineTo(effect.x + dx * .67 - dy * .1, effect.y + dy * .67 + dx * .1);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    }
    const callout = { blast: 'BOMB', chain: 'CHAIN', vortex: 'VORTEX' }[effect.kind];
    if (callout) label(ctx, callout, effect.x, effect.y, color, 20);
  }
  ctx.restore();
}

function drawWheel(ctx, table, control, reduceMotion) {
  const spin = (table.spins ?? []).find(item => item.starts <= table.time
    && (item.seat === (control.onlineSeat ?? 0) || (control.secondSeat && item.seat === 2)));
  if (!spin) return;
  const radius = Math.min(72, table.width * .19);
  const x = Math.max(radius + 15, table.width * .2);
  const y = 121;
  const slice = Math.PI * 2 / WHEEL_MULTIPLIERS.length;
  const elapsed = Math.min(1, (table.time - spin.starts) / (spin.ends - spin.starts));
  const finish = -Math.PI / 2 - (spin.slot + .5) * slice;
  const rotation = reduceMotion && !spin.paid ? 0 : finish - Math.PI * 8 * (1 - elapsed) ** 3;
  const seatColor = SEAT_COLORS[spin.seat];

  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 0, radius + 8, radius + 8, '#240f19ee');
  ellipse(ctx, 0, 0, radius + 4, radius + 4, seatColor);
  for (const [index, multiplier] of WHEEL_MULTIPLIERS.entries()) {
    const start = rotation + index * slice;
    const mid = start + slice / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = spin.paid && index === spin.slot ? '#d96523' : index % 2 ? '#632844' : '#301b35';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#db9b61';
    ctx.stroke();
    label(ctx, multiplier + '×', Math.cos(mid) * radius * .73, Math.sin(mid) * radius * .73, '#fff4d3', radius < 60 ? 10 : 13);
  }
  ellipse(ctx, 0, 0, radius * .26, radius * .26, '#512039');
  label(ctx, '✦', 0, 1, seatColor, 18);
  polygon(ctx, '#fff6c7', [[-8, -radius - 10], [8, -radius - 10], [0, -radius + 10]]);
  const copy = spin.paid ? '+' + spin.cost * WHEEL_MULTIPLIERS[spin.slot] + ' credits' : 'FURNACE WHEEL';
  label(ctx, copy, 0, radius + 21, seatColor, 16);
  ctx.restore();
}

function drawStorms(ctx, table, reduceMotion) {
  for (const storm of table.storms ?? []) {
    const x = (storm.direction === 1 ? storm.progress : 1 - storm.progress) * table.width;
    const trail = 40 * storm.direction;
    const edge = ctx.createLinearGradient(x - trail, 0, x + trail * .26, 0);
    edge.addColorStop(0, '#ff5b1800');
    edge.addColorStop(.65, '#f5683280');
    edge.addColorStop(.8, '#ffb44dbb');
    edge.addColorStop(1, '#ffd47600');
    ctx.fillStyle = edge;
    ctx.fillRect(Math.min(x - trail, x + trail * .26), 0, Math.abs(trail) * 1.26, HEIGHT);
    if (!reduceMotion) {
      const color = SEAT_COLORS[storm.seat];
      for (let i = 0; i < 16; i++) {
        const y = (i * 83 + table.time * 95) % HEIGHT;
        const offset = Math.sin(i * 3.4 + table.time * 8) * 26;
        ellipse(ctx, x - storm.direction * (28 + offset), y, 4 + i % 3 * 2, 2, color, .4);
      }
    }
  }
}

function drawTideEntrances(ctx, width, tide) {
  const reach = Math.min(58, width * .15);
  for (const { from, lane } of tide.schools) {
    const rail = from === 1 ? 0 : width;
    const y = HEIGHT * lane;
    const light = ctx.createLinearGradient(rail, y, rail + from * reach, y);
    light.addColorStop(0, '#ff9836e0');
    light.addColorStop(1, '#ff532000');
    ctx.fillStyle = light;
    ctx.fillRect(from === 1 ? 0 : width - reach, y - 25, reach, 50);
    ctx.beginPath();
    ctx.moveTo(rail + from * 9, y - 10);
    ctx.lineTo(rail + from * 21, y);
    ctx.lineTo(rail + from * 9, y + 10);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff0ac';
    ctx.stroke();
  }
}

export function makeRenderer(ctx, backdrop) {
  return (table, control, reducedMotion, tide) => {
    const width = table.width;
    const time = table.time;
    ctx.clearRect(0, 0, width, HEIGHT);
    if (backdrop.complete && backdrop.naturalWidth) {
      const sourceWidth = backdrop.naturalWidth * Math.min(1, Math.max(.7, width / HEIGHT * backdrop.naturalHeight / backdrop.naturalWidth));
      ctx.drawImage(backdrop, (backdrop.naturalWidth - sourceWidth) / 2, 0, sourceWidth, backdrop.naturalHeight, 0, 0, width, HEIGHT);
    }
    if (table.nextTide - table.time >= 25) {
      ctx.fillStyle = '#f6671b19';
      ctx.fillRect(0, 0, width, HEIGHT);
    }
    ctx.fillStyle = '#360d1654';
    ctx.fillRect(0, 0, width, HEIGHT);
    if (!reducedMotion) {
      for (let i = 0; i < 28; i++) {
        const x = (i * 119 + time * (5 + i % 7)) % width;
        const y = HEIGHT - (i * 79 + time * (8 + i % 14)) % HEIGHT;
        ellipse(ctx, x, y, 1 + i % 3 * .55, 1 + i % 3 * .55, i % 4 ? '#ff742960' : '#ffe37ca0');
      }
    }
    if (tide) drawTideEntrances(ctx, width, tide);
    drawStorms(ctx, table, reducedMotion);
    for (const target of table.targets) {
      if (target.x < -85 || target.x > width + 85) continue;
      drawTarget(ctx, target, time);
      label(ctx, target.multiplier + '×', target.x, target.y + target.radius + 9,
        target.multiplier < 15 ? '#fff4c3' : '#ffcb59', target.species === 'king' ? 23 : 12);
    }
    for (const shot of table.shots) drawProjectile(ctx, shot, time, reducedMotion);
    for (const effect of table.effects) drawEffect(ctx, effect, table, reducedMotion);
    table.seats.forEach((seat, i) => drawTurret(ctx, table, seat, i, reducedMotion));
    drawReticle(ctx, table, control, control.onlineSeat ?? 0, reducedMotion);
    if (control.secondSeat) drawReticle(ctx, table, control.secondSeat, 2, reducedMotion);
    drawWheel(ctx, table, control, reducedMotion);

  };
}

