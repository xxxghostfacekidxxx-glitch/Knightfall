// Рендерер: всё рисуем примитивами в маленький буфер 320x180.
// Контекст уже работает в низком разрешении — апскейл делает CSS (pixelated).
export class Renderer {
  constructor(ctx, w, h) {
    this.ctx = ctx;
    this.w = w;
    this.h = h;
  }

  clear(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  px(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x | 0, y | 0, 1, 1);
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x | 0, y | 0, Math.max(0, w | 0), Math.max(0, h | 0));
  }

  // Рамка толщиной t пикселей.
  rectLine(x, y, w, h, color, t = 1) {
    x |= 0; y |= 0; w |= 0; h |= 0;
    this.rect(x, y, w, t, color);
    this.rect(x, y + h - t, w, t, color);
    this.rect(x, y, t, h, color);
    this.rect(x + w - t, y, t, h, color);
  }

  hline(x, y, w, color) { this.rect(x, y, w, 1, color); }
  vline(x, y, h, color) { this.rect(x, y, 1, h, color); }

  // Anti-aliased vector primitives are rendered into a 4x backing buffer.
  // Keep gameplay coordinates logical (320x180) while avoiding jagged circular edges.
  line(x0, y0, x1, y1, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 + 0.5, y0 + 0.5);
    ctx.lineTo(x1 + 0.5, y1 + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  circle(cx, cy, r, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.5, r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ring(cx, cy, r, color, th = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.75, th);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.5, r - th / 2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Спрайт: rows — массив строк; map — { символ: цвет }, '.'/' ' = прозрачно.
  sprite(def, x, y, scale = 1) {
    const { rows, map } = def;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const col = map[row[c]];
        if (col) this.rect(x + c * scale, y + r * scale, scale, scale, col);
      }
    }
  }

  // Ограничение области рисования (для окошек барабанов и т.п.).
  clip(x, y, w, h) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.clip();
  }
  unclip() { this.ctx.restore(); }

  // Альфа для мягких свечений/затемнений.
  alpha(a) { this.ctx.globalAlpha = a; }
  resetAlpha() { this.ctx.globalAlpha = 1; }
}
