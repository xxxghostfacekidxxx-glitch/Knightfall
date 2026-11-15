/* World materials and scenery are baked once. Actors and light are composed in the viewport. */
(() => {
  const tileSize = 32;
  const artUrl = new URL("art/", document.currentScript.src);
  const materials = ["forest", "marsh", "slate", "road", "cobbles", "pool"];
  const colors = ["#4f6443", "#355b51", "#4c465b", "#7b6247", "#666a59", "#274f55"];
  const props = {
    pine: 0, oak: 1, willow: 2, slate: 3, infirmary: 4, shop: 5, ruin: 6, sign: 7,
    rocks: 8, flowers: 9, fern: 10, lantern: 11, shrine: 12, reeds: 13, logs: 14, grass: 15
  };
  const roster = [
    ["mossbit", "mossreaper", "embercub", "ashhorn", "driftfin", "cryptfin", "zipfang", "voltmaw",
      "gloamlet", "gloamshade", "thornspit", "thornmaw", "grubruckle", "gravruckle", "mournwing", "doomwing"],
    ["squibblex", "squibmarshal", "hexpup", "hexhound", "starjelly", "astraljelly", "minionmouse", "minivillain", "minieddie"]
  ];
  const files = ["bestiary-common.webp", "bestiary-rare.webp"];
  const portraits = new Map(roster.flatMap((ids, sheet) => ids.map((id, index) => [id, { sheet, index, columns: sheet ? 3 : 4 }])));
  const cast = { trainer: 0, nurse: 1, merchant: 2, warden: 3 };
  const art = {};
  let terrain;
  let waters = [], lights = [], fireflies = [];

  function sheetCell(ctx, image, index, columns, rows, x, y, width, height = width) {
    const sw = image.width / columns, sh = image.height / rows;
    ctx.drawImage(image, (index % columns) * sw, Math.floor(index / columns) * sh, sw, sh, x, y, width, height);
  }

  function drawProp(ctx, name, x, y, width, height = width) {
    if (!art.scenery) return false;
    sheetCell(ctx, art.scenery, props[name], 4, 4, x - width / 2, y - height, width, height);
    return true;
  }

  function shadows(ctx, x, y, width, depth) {
    ctx.beginPath();
    ctx.ellipse(x, y, width, depth, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#10191b68";
    ctx.fill();
  }

  function build(width, height, tileAt, hash, village) {
    const n = tileSize;
    const canvas = document.createElement("canvas");
    canvas.width = width * n;
    canvas.height = height * n;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    waters = []; lights = []; fireflies = [];
    const shapes = materials.map(() => new Path2D());
    const objects = [];
    const roadAt = (x, y) => tileAt(x, y) === "path" || (tileAt(x, y) === "town" && y === 16 && (x === 4 || x === 11));
    const settlement = (x, y) => x >= 2 && x <= 13 && y >= 16 && y <= 20;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const kind = tileAt(x, y), v = hash(x, y);
        const dx = x * n, dy = y * n;
        const marsh = x >= 32 && x < 51, ridge = x >= 51;
        const villageTile = village && x >= village.x && x < village.x + village.width && y >= village.y && y < village.y + village.height;
        shapes[ridge ? 2 : marsh ? 1 : 0].rect(dx, dy, n, n);

        if (kind === "water") {
          shapes[5].rect(dx, dy, n, n);
          waters.push({ x, y, v, shore: [tileAt(x, y - 1), tileAt(x + 1, y), tileAt(x, y + 1), tileAt(x - 1, y)].map(t => t !== "water") });
        } else if (roadAt(x, y) || settlement(x, y)) {
          const inset = settlement(x, y) ? 0 : 2 + v % 5;
          const shape = shapes[settlement(x, y) ? 4 : 3];
          const left = roadAt(x - 1, y) || settlement(x - 1, y) ? 0 : inset;
          const right = roadAt(x + 1, y) || settlement(x + 1, y) ? 0 : inset;
          const top = roadAt(x, y - 1) || settlement(x, y - 1) ? 0 : inset;
          const bottom = roadAt(x, y + 1) || settlement(x, y + 1) ? 0 : inset;
          shape.roundRect(dx + left, dy + top, n - left - right, n - top - bottom,
            [left && top, right && top, right && bottom, left && bottom].map(edge => edge ? inset : 0));
        }

        if (kind === "tree") {
          const tree = ridge ? (v % 3 ? "slate" : "pine") : marsh ? "willow" : (v % 4 === 0 ? "pine" : "oak");
          objects.push({ name: tree, x: dx + n / 2, y: dy + n * .91, size: n * (1.54 + (v % 7) * .085), shadow: .29 });
        } else if (kind === "house") {
          const px = dx + n * .5, py = dy + n;
          objects.push({ name: x === 4 ? "infirmary" : "shop", x: px, y: py, size: n * 2.95, shadow: .31 });
          lights.push({ x: px, y: py - n * .45, radius: n * 1.15, hue: "242,164,76" });
        } else if (kind === "ruin" && villageTile) {
          objects.push({ name: v % 3 === 0 ? "ruin" : "rocks", x: dx + n / 2, y: dy + n * .87, size: n * (1.04 + (v % 5) * .13), shadow: .24 });
        } else if (kind === "grass" && v % 7 < 4) {
          const leaf = v % 9 < 2 ? "flowers" : marsh ? "reeds" : (v % 4 ? "grass" : "fern");
          objects.push({ name: leaf, x: dx + 8 + v % 16, y: dy + 17 + v % 14, size: n * (.41 + (v % 9) * .035) });
          if (v % 29 === 0) fireflies.push({ x: dx + n / 2, y: dy + n / 2, seed: v });
        } else if (kind === "field" && v % 12 === 0) {
          objects.push({ name: v % 24 ? "rocks" : "logs", x: dx + n / 2, y: dy + n * .82, size: n * .93 });
        }

        if (y === 16 && (x === 2 || x === 13 || x === 30 || x === 49 || x === 53)) {
          objects.push({ name: "lantern", x: dx + n / 2, y: dy + n * .88, size: n * 1.16, shadow: .19 });
          lights.push({ x: dx + n / 2, y: dy + n * .30, radius: n * 1.34, hue: "255,180,87" });
        }
        if (y === 20 && (x === 13 || x === 31 || x === 50)) {
          objects.push({ name: "sign", x: dx + n / 2, y: dy + n * .83, size: n, shadow: .12 });
        }
      }
    }

    for (const [index, shape] of shapes.entries()) {
      ctx.fillStyle = colors[index];
      if (art.ground) {
        const swatch = document.createElement("canvas");
        swatch.width = swatch.height = 96;
        const sample = swatch.getContext("2d");
        sample.imageSmoothingEnabled = false;
        sheetCell(sample, art.ground, index, 3, 2, 0, 0, 96);
        ctx.fillStyle = ctx.createPattern(swatch, "repeat") || colors[index];
      }
      ctx.fill(shape);
    }

    // Broad patches of canopy shadow break up the repeating materials on long routes.
    const shade = document.createElement("canvas");
    shade.width = Math.ceil(width * n / 4);
    shade.height = Math.ceil(height * n / 4);
    const shadeCtx = shade.getContext("2d");
    for (let y = 2; y < height; y += 5) {
      for (let x = 2; x < width; x += 6) {
        const seed = hash(x, y);
        const centerX = (x + (seed % 6) * .32) * n / 4;
        const centerY = (y + (seed % 9) * .24) * n / 4;
        const radius = 15 + seed % 19;
        paintLight(shadeCtx, centerX, centerY, radius,
          seed % 3 === 0 ? "210,189,112" : x >= 32 && x < 51 ? "9,35,42" : "13,23,28", seed % 3 === 0 ? .16 : .28);
      }
    }
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(shade, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (const { x, y, shore } of waters) {
      const dx = x * n, dy = y * n;
      const edges = [[dx, dy, n, 3], [dx + n - 3, dy, 3, n], [dx, dy + n - 3, n, 3], [dx, dy, 3, n]];
      ctx.fillStyle = "#abd0a168";
      shore.forEach((edge, i) => { if (edge) ctx.fillRect(...edges[i]); });
    }

    for (const item of objects.sort((a, b) => a.y - b.y)) {
      if (item.shadow) shadows(ctx, item.x + 2, item.y - 2, item.size * item.shadow, item.size * .075);
      if (!drawProp(ctx, item.name, item.x, item.y, item.size) && item.shadow) {
        ctx.fillStyle = "#53654a";
        ctx.fillRect(item.x - item.size * .2, item.y - item.size * .44, item.size * .4, item.size * .44);
      }
    }
    return canvas;
  }

  function paintLight(ctx, x, y, radius, hue, opacity) {
    const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
    light.addColorStop(0, "rgba(" + hue + "," + opacity + ")");
    light.addColorStop(1, "rgba(" + hue + ",0)");
    ctx.fillStyle = light;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  globalThis.CinderwildRenderer = Object.freeze({
    load(onReady) {
      const images = {
        ground: "ground-materials.webp", scenery: "world-scenery.webp", cast: "field-cast.webp",
        common: files[0], rare: files[1], trainer: "trainer.png", warden: "warden.png"
      };
      for (const [key, file] of Object.entries(images)) {
        const image = new Image();
        image.onload = () => {
          art[key] = image;
          if (key === "ground" || key === "scenery") terrain = null;
          onReady();
        };
        image.src = new URL(file, artUrl);
      }
    },
    world(ctx, originX, originY, viewWidth, viewHeight, t, width, height, tileAt, hash, village, time) {
      terrain ??= build(width, height, tileAt, hash, village);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(terrain, originX * tileSize, originY * tileSize, viewWidth * tileSize, viewHeight * tileSize,
        0, 0, viewWidth * t, viewHeight * t);
      const visible = (x, y) => x >= -t && y >= -t && x <= ctx.canvas.width + t && y <= ctx.canvas.height + t;
      for (const { x, y, v } of waters) {
        const dx = (x - originX) * t, dy = (y - originY) * t;
        if (!visible(dx, dy)) continue;
        const drift = (v % 17 + Math.floor(time / 240)) % 17;
        ctx.fillStyle = "#b8ead54b";
        ctx.fillRect((dx + drift * t / 32) | 0, dy + (v % 16 + 7) * t / 32, .28 * t, 1);
      }
      for (const lamp of lights) {
        const x = (lamp.x / tileSize - originX) * t, y = (lamp.y / tileSize - originY) * t;
        if (visible(x, y)) paintLight(ctx, x, y, lamp.radius * t / tileSize, lamp.hue, .43 + (time ? Math.sin(time / 440 + lamp.x) * .075 : 0));
      }
      if (originX + viewWidth >= 34 && originX < 46 && originY + viewHeight > 4 && originY < 14) {
        for (let i = 0; i < 3; i++) {
          const drift = time ? Math.sin(time / 3400 + i) * .9 : 0;
          const x = (38 + i * 3 + drift - originX) * t;
          const y = (6 + i * 2 - originY) * t;
          if (visible(x, y)) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(1, .32);
            paintLight(ctx, 0, 0, t * 3.5, "172,216,210", .24);
            ctx.restore();
          }
        }
      }
      for (const fly of fireflies) {
        const x = (fly.x / tileSize - originX) * t + Math.sin(time / 780 + fly.seed) * 5;
        const y = (fly.y / tileSize - originY) * t + Math.cos(time / 960 + fly.seed) * 8;
        const bright = .25 + Math.sin(time / 540 + fly.seed) * .22;
        if (!visible(x, y) || bright < .13) continue;
        paintLight(ctx, x, y, 7, "255,225,137", bright);
        ctx.fillStyle = "#ffeca5";
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
    },
    shrine(ctx, x, y, t, active, cleared) {
      if (!art.scenery) return false;
      shadows(ctx, x + t / 2, y + t * .84, t * .36, t * .10);
      drawProp(ctx, "shrine", x + t / 2, y + t * .89, t * 1.28);
      if (!cleared) paintLight(ctx, x + t * .49, y + t * .30, t * .41, active ? "222,144,255" : "109,143,208", active ? .76 : .26);
      return true;
    },
    creature(ctx, id, size, frame, mirrored) {
      const slot = portraits.get(id);
      const sheet = slot && art[slot.sheet ? "rare" : "common"];
      if (!sheet) return false;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (mirrored) { ctx.translate(size, 0); ctx.scale(-1, 1); }
      sheetCell(ctx, sheet, slot.index, slot.columns, slot.columns, 0, [0, 2, 0, -1][frame], size);
      ctx.restore();
      return true;
    },
    portraitStyle(id) {
      const slot = portraits.get(id);
      if (!slot) return "";
      const n = slot.columns;
      const x = (slot.index % n) * 100 / (n - 1), y = Math.floor(slot.index / n) * 100 / (n - 1);
      return "--portrait:url('" + new URL(files[slot.sheet], artUrl).pathname + "');--atlas:" + (n * 100) +
        "%;--portrait-pos:" + x + "% " + y + "%";
    },
    actor(ctx, name, x, y, size, facing = 0, frame = 0) {
      const sheet = art.cast || art[name === "trainer" ? "trainer" : "warden"];
      if (!sheet) return false;
      ctx.imageSmoothingEnabled = false;
      shadows(ctx, x + size / 2, y + size * .87, size * .27, size * .115);
      if (art.cast) {
        const side = size * 1.38;
        const step = frame ? (frame === 1 ? -2 : 1) : 0;
        sheetCell(ctx, sheet, cast[name] * 4 + facing, 4, 4, x + (size - side) / 2, y + size * .93 - side + step, side);
      } else {
        sheetCell(ctx, sheet, frame * 4 + facing, 4, 4, x + 2, y - 2, size - 4, size);
      }
      return true;
    }
  });
})();
