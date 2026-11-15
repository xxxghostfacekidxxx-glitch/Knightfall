/* The 24 by 18 playable village crop, adapted for Cinderwild. */
(() => {
  const rows = Object.freeze([
    "gg.......gg.ggggggg.gggg",
    "gg.....................g",
    "gggg.gg................g",
    "ggggggg..gg##ggg.gggg##g",
    "gg##g##..g####ggg##gg##g",
    "gg#####..g############gg",
    "#g#####...#############g",
    "####g##..########gg####g",
    "##ggg....########.g##ggg",
    "...........g#####gg##ggg",
    "............####ggg..ggg",
    "#g.....##...ggggggg.gggg",
    "###...####....ggggg.g##g",
    "###g.g#####......g.g####",
    "###g.gggg##ggggg..gg####",
    "####g..ggg.##ggg...g####",
    "g####ggggg####g....#####",
    "#####ggg######gg..######",
  ]);
  const x = 5, y = 38, entrance = 8;
  globalThis.CinderwildVillage = Object.freeze({
    x, y, width: rows[0].length, height: rows.length, entrance,
    terrainAt(col, row) {
      if (row === y - 1) return col === entrance ? "path" : "tree";
      if (row < y) return null;
      const tile = rows[row - y]?.[col - x];
      if (tile === ".") return "path";
      if (tile === "g") return "grass";
      return tile === "#" ? "ruin" : "tree";
    }
  });
})();
