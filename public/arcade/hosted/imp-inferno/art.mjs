import { HEIGHT, SEAT_COLORS, seatOrigin } from './furnace.mjs?v=3';

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
    const glyphs = { blast: '✹', chain: 'ϟ', beam: '◆', drill: '▼', vortex: '◎' };
    ctx.font = '900 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    ctx.fillText(glyphs[target.bonus], -2, 23);
  }
  ctx.restore();
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

function drawSeat(ctx, table, seat, index) {
  const { x, y } = seatOrigin(table, index);
  const color = SEAT_COLORS[index];
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 1, 34, 34, '#240a1699');
  ellipse(ctx, 0, 0, 28, 28, '#4b2030');
  ellipse(ctx, 0, 0, 23, 23, color);
  ellipse(ctx, 0, 0, 20, 20, '#361829');
  ctx.rotate(seat.angle);
  ctx.translate(-seat.recoil * 7, 0);
  polygon(ctx, color, [[-21, -10], [-10, -17], [17, -14], [41, -11], [42, 11], [18, 14], [-10, 17], [-21, 10]], 4);
  polygon(ctx, '#492235', [[-7, -8], [40, -7], [41, 7], [-7, 8]], 0);
  ellipse(ctx, 6, 0, 8, 7, color);
  if (seat.recoil > .6) ellipse(ctx, 46, 0, 12, 7, color);
  ctx.restore();
  label(ctx, seat.name.toUpperCase() + (index ? ' ' + seat.credits : ''), x, y + (index === 2 ? -25 : 34), color, 12);
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
  if (effect.kind === 'catch') {
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
        imp(ctx, { ...effect.target, y: effect.y - (1 - opacity) * 38, radius: effect.target.radius * opacity, flash: true }, table.time);
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

export function makeRenderer(ctx, backdrop) {
  return (table, control, reducedMotion) => {
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
    for (const target of table.targets) {
      if (target.x < -85 || target.x > width + 85) continue;
      imp(ctx, target, time);
      label(ctx, target.multiplier + '×', target.x, target.y + target.radius + 9,
        target.multiplier < 15 ? '#fff4c3' : '#ffcb59', target.species === 'king' ? 23 : 12);
    }
    ctx.lineCap = 'round';
    for (const shot of table.shots) {
      const color = SEAT_COLORS[shot.seat];
      ctx.beginPath();
      ctx.moveTo(shot.x - Math.cos(shot.angle) * 18, shot.y - Math.sin(shot.angle) * 18);
      ctx.lineTo(shot.x, shot.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = shot.drill ? 11 : shot.cost > 2 ? 5 : 3;
      ctx.stroke();
      ellipse(ctx, shot.x, shot.y, shot.drill ? 11 : 3, shot.drill ? 5 : 3, '#fff6db', shot.angle);
    }
    for (const effect of table.effects) drawEffect(ctx, effect, table, reducedMotion);
    table.seats.forEach((seat, i) => drawSeat(ctx, table, seat, i));
    const lock = table.targets.find(target => target.id === control.lockId);
    const aim = lock ?? control.aim;
    const radius = lock ? lock.radius + 9 : 10;
    ctx.strokeStyle = SEAT_COLORS[0];
    ctx.lineWidth = lock ? 2.7 : 1.7;
    ctx.beginPath();
    ctx.arc(aim.x, aim.y, radius, 0, Math.PI * 2);
    for (let i = 0; i < 4; i++) {
      const x = Math.cos(i * Math.PI / 2);
      const y = Math.sin(i * Math.PI / 2);
      ctx.moveTo(aim.x + x * (radius - 4), aim.y + y * (radius - 4));
      ctx.lineTo(aim.x + x * (radius + 6), aim.y + y * (radius + 6));
    }
    ctx.stroke();
  };
}
