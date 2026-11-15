/* Cache the terrain at native pixel resolution. Actors are composed at draw time. */
(() => {
  const native = 16;
  const assetRoot = new URL("art/", document.currentScript.src);
  const artwork = {}, portraits = {};
  const colors = { field: "#8ea64d", grass: "#82993f", town: "#c7ae74", path: "#c29460",
    tree: "#425e3b", water: "#36768a", house: "#917050", roof: "#6c5d45", ruin: "#646748", wall: "#24362e" };
  let terrain;
  const water = [];

  function atlas(ctx, image, x, y, width, height, dx, dy, dw = width, dh = height) {
    if (image) ctx.drawImage(image, x * native, y * native, width, height, dx, dy, dw, dh);
  }

  function build(width, height, tileAt, hash, village) {
    const canvas = document.createElement("canvas");
    canvas.width = width * native;
    canvas.height = height * native;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const houses = [], trees = [];
    water.length = 0;
    const isRoad = (x, y) => {
      const tile = tileAt(x, y);
      return tile === "path" || (tile === "town" && y === 16 && (x === 4 || x === 11));
    };
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x * native, dy = y * native, tile = tileAt(x, y), variant = hash(x, y) % 13;
        ctx.fillStyle = colors[tile];
        ctx.fillRect(dx, dy, native, native);
        if (tile === "water") {
          water.push({ x, y, variant });
          ctx.fillStyle = variant < 8 ? "#366968" : "#397471";
          ctx.fillRect(dx, dy, native, native);
          for (const [mx, my, sx, sy, sw, sh] of [
            [-1, 0, 0, 0, 2, 16], [1, 0, 14, 0, 2, 16], [0, -1, 0, 0, 16, 2], [0, 1, 0, 14, 16, 2]
          ]) {
            if (tileAt(x + mx, y + my) !== "water") {
              ctx.fillStyle = "#85a687";
              ctx.fillRect(dx + sx, dy + sy, sw, sh);
            }
          }
          continue;
        }
        const marsh = x >= 32 && x < 51;
        let floor = [variant < 5 ? 3 : 2, 12];
        if (isRoad(x, y)) {
          const column = !isRoad(x - 1, y) ? 0 : !isRoad(x + 1, y) ? 2 : 1;
          const row = !isRoad(x, y - 1) ? 7 : !isRoad(x, y + 1) ? 9 : 8;
          floor = column === 1 && row === 8 && variant < 2 ? [5, 8] : [column, row];
        }
        atlas(ctx, artwork.terrain, floor[0] + (marsh ? 11 : 0), floor[1], native, native, dx, dy);
        if (tile === "grass") {
          ctx.fillStyle = variant < 6 ? "#5c782e" : "#768a33";
          for (const offset of [2 + variant % 4, 10]) {
            ctx.fillRect(dx + offset, dy + 7, 1, 4);
            ctx.fillRect(dx + offset + 1, dy + 9, 2, 2);
          }
        }
        if (tile === "field" && variant < 2) atlas(ctx, artwork.props, 5, 11, native, native, dx, dy);
        if (tile === "tree" && (!village || y < village.y || x < village.x || x >= village.x + village.width)) {
          trees.push({ dx, dy, variant, y });
        }
        if (tile === "house") houses.push({ x: dx, y: dy });
      }
    }
    for (const { dx, dy, variant, y } of trees) {
      if (!artwork.props) {
        ctx.fillStyle = colors.tree;
        ctx.fillRect(dx + 2, dy, 12, 16);
        continue;
      }
      ctx.fillStyle = "#233b2f60";
      ctx.fillRect(dx + 2, dy + 11, 15, 4);
      const size = 17 + variant % 6;
      atlas(ctx, artwork.props, 4, (y > 31 || variant > 9) ? 9 : 6, native * 2, native * 2,
        dx + Math.floor((native - size) / 2), dy + 15 - size, size, size);
    }
    for (const { x, y } of houses) {
      if (!artwork.props) {
        ctx.fillStyle = colors.house;
        ctx.fillRect(x, y - native, native, native * 2);
      } else {
        atlas(ctx, artwork.props, 11, 0, 48, 48, x - 6, y - 17, 28, 32);
      }
      ctx.fillStyle = x < 100 ? "#f1d483" : "#e7a6ba";
      ctx.fillRect(x + 6, y + 4, 4, 2);
    }
    if (village && artwork.village) ctx.drawImage(artwork.village, village.x * native, village.y * native);

    // A cached grade gives each region its own palette while retaining the source sprite edges.
    ctx.globalCompositeOperation = "multiply";
    const grade = ctx.createLinearGradient(0, 0, width * native, 0);
    for (const [stop, color] of [[0, "#cae3bb"], [.2, "#cae3bb"], [.37, "#9ed6b9"],
      [.57, "#9eccc9"], [.73, "#8ac2ce"], [.87, "#a4b2d9"], [1, "#afafd9"]]) grade.addColorStop(stop, color);
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    return canvas;
  }

  globalThis.CinderwildRenderer = Object.freeze({
    load(onReady) {
      const fetchImage = (collection, name, url) => new Promise(resolve => {
        const image = new Image();
        image.onload = () => { collection[name] = image; resolve(); };
        image.onerror = () => resolve();
        image.src = url;
      });
      const tiles = ["terrain", "props", "village", "trainer", "warden"];
      const creatures = ["mossbit", "embercub", "driftfin", "zipfang", "gloamlet", "thornspit", "grubruckle", "mournwing"];
      Promise.all(tiles.map(name => fetchImage(artwork, name, new URL(name + ".png", assetRoot))))
        .then(() => { terrain = null; onReady(); });
      Promise.all(creatures.map(name => fetchImage(portraits, name, "/assets/monster-sprites/" + name + ".svg")))
        .then(onReady);
    },
    world(ctx, originX, originY, viewWidth, viewHeight, tileSize, width, height, tileAt, hash, village, time) {
      terrain ??= build(width, height, tileAt, hash, village);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(terrain, originX * native, originY * native, viewWidth * native, viewHeight * native,
        0, 0, viewWidth * tileSize, viewHeight * tileSize);
      const unit = tileSize / native;
      for (const { x, y, variant } of water) {
        const px = (x - originX) * tileSize, py = (y - originY) * tileSize;
        if (px + tileSize < 0 || py + tileSize < 0 || px >= ctx.canvas.width || py >= ctx.canvas.height) continue;
        const drift = (variant + Math.floor(time / 340)) % 8;
        ctx.fillStyle = variant < 6 ? "#addcbd67" : "#addcbd43";
        ctx.fillRect(px + (drift + 2) * unit, py + (4 + variant % 6) * unit, 5 * unit, unit);
      }
      const glow = ctx.createRadialGradient(ctx.canvas.width * .47, ctx.canvas.height * .4, 0,
        ctx.canvas.width * .47, ctx.canvas.height * .4, Math.hypot(ctx.canvas.width, ctx.canvas.height) * .53);
      glow.addColorStop(0, "#e9edc10d");
      glow.addColorStop(.72, "#1c283400");
      glow.addColorStop(1, "#19273264");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (time) {
        for (let i = 0; i < 14; i++) {
          const x = Math.floor(originX / 5) * 5 + i * 2;
          const y = Math.floor(originY / 5) * 5 + hash(i, 20) % (viewHeight + 5);
          if (tileAt(x, y) !== "grass") continue;
          const flicker = Math.sin((time + hash(x, y) % 4000) / 510);
          if (flicker < .15) continue;
          const px = Math.round((x - originX) * tileSize + 8 + flicker * 4);
          const py = Math.round((y - originY) * tileSize + 14 + flicker * 6);
          ctx.fillStyle = "#feeeb33c";
          ctx.fillRect(px - 2, py - 2, 7, 7);
          ctx.fillStyle = "#f7e6a0";
          ctx.fillRect(px, py, 2, 2);
        }
      }
    },
    creature(ctx, id, size, frame, mirrored) {
      if (!portraits[id]) return false;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (mirrored) { ctx.translate(size, 0); ctx.scale(-1, 1); }
      ctx.drawImage(portraits[id], 1, 1 + [0, 2, 0, -1][frame], size - 2, size - 4);
      ctx.restore();
      return true;
    },
    actor(ctx, name, x, y, size, facing = 0, frame = 0) {
      if (!artwork[name]) return false;
      ctx.fillStyle = "#231f2970";
      ctx.beginPath();
      ctx.ellipse(x + size / 2, y + size * .83, size * .36, size * .13, 0, 0, Math.PI * 2);
      ctx.fill();
      atlas(ctx, artwork[name], facing, frame, native, native, x + 2, y - 2, size - 4, size);
      return true;
    }
  });
})();
