import { HEIGHT, bossParts, muzzle } from './furnace.mjs';

const INK = '#210912';
const COLORS = {
  grinner: ['#ff653d', '#a41737', '#ffe087'],
  ashwing: ['#ffb738', '#ce4529', '#fff1a4'],
  brute: ['#f04838', '#7f1738', '#ffd267'],
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
  const [skin, shade, light] = COLORS[target.type];
  const scale = target.radius / 27;
  const flap = Math.sin(time * 16 + (target.phase || 0)) * 7;
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
  ctx.restore();
}

function bossArt(ctx, boss, time) {
  imp(ctx, { ...boss, y: boss.y - 22, radius: 42, type: 'king' }, time);
  const exposed = !boss.left && !boss.right;
  for (const part of bossParts(boss)) {
    if (!part.hp) continue;
    const core = part.id === 'core';
    const hp = part.hp / (core ? 51 : 26);
    const x = part.x;
    const y = part.y;
    ctx.save();
    ctx.translate(x, y);
    const glow = core && exposed;
    if (glow) {
      const radius = 32 + Math.sin(time * 9) * 3;
      const flare = ctx.createRadialGradient(0, 0, 4, 0, 0, radius + 13);
      flare.addColorStop(0, '#ffca57');
      flare.addColorStop(1, '#ff521600');
      ellipse(ctx, 0, 0, radius + 13, radius + 13, flare);
    }
    polygon(ctx, glow ? '#ffe587' : '#762638', [[-26, -4], [-15, -21], [10, -23], [25, -10], [24, 14], [1, 27], [-20, 15]], 4);
    polygon(ctx, glow ? '#fff8d6' : '#df643f', [[-19, -5], [-10, -16], [9, -18], [17, -9], [8, -6], [-4, -9]], 0);
    if (!core || glow) {
      polygon(ctx, glow ? '#fff2a4' : '#ffac59', [[0, -13], [12, 0], [0, 14], [-10, 0]], 2);
      ctx.fillStyle = '#260b15';
      ctx.fillRect(-20, 31, 40, 5);
      ctx.fillStyle = '#ffd367';
      ctx.fillRect(-20, 31, 40 * hp, 5);
    } else {
      ctx.strokeStyle = '#ffae6e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-11, -2);
      ctx.lineTo(10, 9);
      ctx.moveTo(11, -2);
      ctx.lineTo(-10, 9);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function makeRenderer(ctx, backdrop) {
  return (run, width, aim, mode, time, reducedMotion) => {
    ctx.clearRect(0, 0, width, HEIGHT);
    if (backdrop.complete && backdrop.naturalWidth) {
      // Keep both banks in view when the table is upright on a phone.
      const ratio = width / HEIGHT;
      const imageRatio = backdrop.naturalWidth / backdrop.naturalHeight;
      const sourceWidth = backdrop.naturalWidth * Math.min(1, Math.max(.72, ratio / imageRatio));
      ctx.drawImage(backdrop, (backdrop.naturalWidth - sourceWidth) / 2, 0, sourceWidth, backdrop.naturalHeight, 0, 0, width, HEIGHT);
    }
    const shade = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    shade.addColorStop(0, '#1d091344');
    shade.addColorStop(.62, '#2a0a131f');
    shade.addColorStop(1, '#14060cc4');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, HEIGHT);
    for (let i = 0; i < 45; i++) {
      const x = ((i * 119 + time * (5 + i % 7)) % width + width) % width;
      const y = HEIGHT - (i * 79 + time * (8 + i % 14)) % HEIGHT;
      const radius = 1 + i % 3 * .48;
      ellipse(ctx, x, y, radius, radius, i % 4 ? '#fc681965' : '#ffe37ca0');
    }
    for (const target of run.targets) imp(ctx, target, time);
    if (run.boss && run.boss.core) bossArt(ctx, run.boss, time);
    ctx.lineCap = 'round';
    for (const shot of run.shots) {
      ctx.beginPath();
      ctx.moveTo(shot.x - shot.vx * .018, shot.y - shot.vy * .018);
      ctx.lineTo(shot.x, shot.y);
      ctx.strokeStyle = shot.color;
      ctx.lineWidth = shot.radius;
      ctx.stroke();
      ellipse(ctx, shot.x, shot.y, shot.radius * .72, shot.radius * .72, '#fff6db');
    }
    for (const impact of run.effects) {
      if (impact.label) {
        ctx.textAlign = 'center';
        ctx.font = '900 22px system-ui';
        ctx.lineWidth = 4;
        ctx.strokeStyle = INK;
        ctx.fillStyle = impact.color;
        const y = impact.y - 30 + impact.life * 27;
        ctx.strokeText(impact.label, impact.x, y);
        ctx.fillText(impact.label, impact.x, y);
      } else if (!reducedMotion) {
        const radius = (1 - impact.life / .28) * 27;
        for (let i = 0; i < 7; i++) {
          const angle = impact.seed + i * Math.PI * 2 / 7;
          polygon(ctx, impact.color, [[impact.x + Math.cos(angle) * radius, impact.y + Math.sin(angle) * radius],
            [impact.x + Math.cos(angle + .13) * (radius + 7), impact.y + Math.sin(angle + .13) * (radius + 7)],
            [impact.x + Math.cos(angle - .1) * (radius + 5), impact.y + Math.sin(angle - .1) * (radius + 5)]], 0);
        }
      }
    }

    const origin = muzzle(width, aim);
    const cannonColors = ['#ffd870', '#ff8d52', '#fff0cf'];
    const color = cannonColors[mode];
    ctx.save();
    ctx.translate(width / 2, HEIGHT - 35);
    ellipse(ctx, 0, 7, 43, 23, '#260c17');
    ellipse(ctx, 0, 1, 36, 20, '#a74f39');
    ctx.rotate(origin.angle);
    ctx.translate(-run.recoil * 7, 0);
    polygon(ctx, '#60273c', [[-23, -13], [-9, -20], [18, -15], [40, -13], [43, 13], [18, 15], [-9, 20], [-23, 13]], 4);
    polygon(ctx, '#c96646', [[-15, -10], [-5, -16], [29, -11], [32, -6], [-8, -4]], 0);
    ellipse(ctx, 4, 0, 8, 6, color);
    if (run.recoil > .6) ellipse(ctx, 46, 0, 11, 6, color);
    ctx.restore();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(aim.x, aim.y, 9, 0, Math.PI * 2);
    ctx.moveTo(aim.x - 15, aim.y); ctx.lineTo(aim.x - 5, aim.y);
    ctx.moveTo(aim.x + 5, aim.y); ctx.lineTo(aim.x + 15, aim.y);
    ctx.moveTo(aim.x, aim.y - 15); ctx.lineTo(aim.x, aim.y - 5);
    ctx.moveTo(aim.x, aim.y + 5); ctx.lineTo(aim.x, aim.y + 15);
    ctx.stroke();
  };
}
