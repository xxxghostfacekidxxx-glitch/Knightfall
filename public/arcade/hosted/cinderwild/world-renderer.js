/* Cache the terrain at native pixel resolution. Actors are composed at draw time. */
(() => {
  const native = 16;
  const assetRoot = new URL("art/", document.currentScript.src);
  const artwork = {};
  const colors = { field: "#8ea64d", grass: "#82993f", town: "#c7ae74", path: "#c29460",
    tree: "#425e3b", water: "#36768a", house: "#917050", roof: "#6c5d45", ruin: "#646748", wall: "#24362e" };
  let terrain;

  function atlas(ctx, image, x, y, width, height, dx, dy, dw = width, dh = height) {
    if (image) ctx.drawImage(image, x * native, y * native, width, height, dx, dy, dw, dh);
  }

  function build(width, height, tileAt, hash, village) {
    const canvas = document.createElement("canvas");
    canvas.width = width * native;
    canvas.height = height * native;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x * native, dy = y * native, tile = tileAt(x, y), variant = hash(x, y) % 13;
        ctx.fillStyle = colors[tile];
        ctx.fillRect(dx, dy, native, native);
        if (tile === "water") {
          ctx.fillStyle = variant < 8 ? "#61a5ad" : "#78b8b0";
          ctx.fillRect(dx + variant % 6, dy + 5, 8, 1);
          ctx.fillRect(dx + 7, dy + 12, 6, 1);
          ctx.fillStyle = "#315e70";
          ctx.fillRect(dx, dy + 15, 16, 1);
          continue;
        }
        const marsh = x >= 32 && x < 51;
        const floor = tile === "path" ? [variant < 2 ? 5 : 1, 8] :
          tile === "town" ? [variant % 3, 5] : [variant < 5 ? 3 : 2, 12];
        atlas(ctx, artwork.terrain, floor[0] + (marsh ? 11 : 0), floor[1], native, native, dx, dy);
        if (tile === "grass") atlas(ctx, artwork.props, 3 + variant % 2, 5, native, native, dx, dy);
        if (tile === "field" && variant < 2) atlas(ctx, artwork.props, 5, 11, native, native, dx, dy);
        if (tile === "tree") atlas(ctx, artwork.props, 4, y > 31 ? 9 : 6, native * 2, native * 2, dx, dy, native, native);
        if (tile === "roof") atlas(ctx, artwork.props, 17, 0, native * 3, native * 2, dx, dy, native, native);
        if (tile === "house") atlas(ctx, artwork.props, 17, 7, native * 3, native * 3, dx, dy, native, native);
        if (x >= 51) {
          ctx.fillStyle = "#3026574b";
          ctx.fillRect(dx, dy, native, native);
        }
      }
    }
    if (village && artwork.village) ctx.drawImage(artwork.village, village.x * native, village.y * native);
    return canvas;
  }

  globalThis.CinderwildRenderer = Object.freeze({
    load(onReady) {
      const images = ["terrain", "props", "village", "trainer", "warden"];
      Promise.all(images.map(name => new Promise(resolve => {
        const image = new Image();
        image.onload = () => { artwork[name] = image; resolve(); };
        image.onerror = () => resolve();
        image.src = new URL(name + ".png", assetRoot);
      }))).then(() => { terrain = null; onReady(); });
    },
    world(ctx, originX, originY, viewWidth, viewHeight, tileSize, width, height, tileAt, hash, village) {
      terrain ??= build(width, height, tileAt, hash, village);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(terrain, originX * native, originY * native, viewWidth * native, viewHeight * native,
        0, 0, viewWidth * tileSize, viewHeight * tileSize);
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
