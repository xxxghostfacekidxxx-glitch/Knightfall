// ============================================================
// EMBERVALE — sprites.js
// Pixel art: palette, sprite builder, bitmap font, tile atlas
// ============================================================
'use strict';

// ---- master palette (char -> color) ----
const PAL = {
  '.': null,
  K: '#10121a', k: '#2e3038', g: '#6e7280', l: '#b8bcc8', W: '#f4f4f0',
  O: '#e8843c', o: '#b3571f', Q: '#f4a45c',           // fox fur
  n: '#f7ddb0', N: '#e0b888',                          // cream
  G: '#3e9e4f', d: '#2a6e36', e: '#54bd62',            // tunic green
  R: '#d83838', r: '#8c1f1f', X: '#f47070',            // red
  B: '#3b6ee8', b: '#24449a', c: '#7aa8f4',            // blue
  Y: '#f2cf4a', y: '#b8902a',                          // gold
  P: '#8a4ad8', p: '#552c8e', q: '#b07ae8',            // purple
  C: '#5ad8e8', M: '#8a5a2c', m: '#5c3a1a',            // cyan, brown
  S: '#9aa4b8', s: '#5a6478',                          // steel
  T: '#384050', U: '#cdd4e0',
  V: '#7ee87e', v: '#3ca83c',                          // slime green
  Z: '#e85a9c', z: '#a82c64',                          // pink
  F: '#ffb838', f: '#e85820',                          // flame
  H: '#caa46a', h: '#8a6a3a',                          // bone/wood light
  A: '#404a5e', a: '#262c3a', t: '#7a86a0'             // dungeon stone
};

function makeSprite(rows, opts = {}) {
  const h = rows.length, w = rows[0].length;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const col = PAL[rows[j][i]];
      if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
    }
  }
  if (opts.outline) outlineSprite(cv);
  return cv;
}

// add a dark 1px outline around opaque pixels
function outlineSprite(cv) {
  const x = cv.getContext('2d');
  const img = x.getImageData(0, 0, cv.width, cv.height);
  const d = img.data, w = cv.width, h = cv.height;
  const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 0;
  const out = [];
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++)
      if (!solid(i, j) && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)))
        out.push([i, j]);
  x.fillStyle = '#10121a';
  for (const [i, j] of out) x.fillRect(i, j, 1, 1);
}

function mirrorSprite(cv) {
  const m = document.createElement('canvas');
  m.width = cv.width; m.height = cv.height;
  const x = m.getContext('2d');
  x.translate(cv.width, 0); x.scale(-1, 1);
  x.drawImage(cv, 0, 0);
  return m;
}

// recolor a sprite by mapping (for variants / flash effects)
function tintSprite(cv, color, alpha = 1) {
  const m = document.createElement('canvas');
  m.width = cv.width; m.height = cv.height;
  const x = m.getContext('2d');
  x.drawImage(cv, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = alpha;
  x.fillStyle = color;
  x.fillRect(0, 0, m.width, m.height);
  return m;
}

// ============================================================
// SPRITE DATA
// ============================================================
const SPR = {};

(function buildSprites() {
  const S = (name, rows, opts = { outline: true }) => { SPR[name] = makeSprite(rows, opts); };

  // ---------------- FOX HERO (16x16) ----------------
  // facing DOWN, frame 0
  S('fox_d0', [
    '....O......O....',
    '...OO......OO...',
    '...OnO....OnO...',
    '...OOOOOOOOOO...',
    '..OOOOOOOOOOOO..',
    '..OOWKOOOOWKOO..',
    '..OOnnnOOnnnOO..',
    '...OnnnKKnnnO...',
    '....nnnnnnnn....',
    '....GGGGGGGG....',
    '...GGGGGGGGGG...',
    '...GGGyyyyGGG...',
    '....dddddddd....',
    '....oo....oo....',
    '....oo....oo....',
    '....KK....KK....'
  ]);
  S('fox_d1', [
    '....O......O....',
    '...OO......OO...',
    '...OnO....OnO...',
    '...OOOOOOOOOO...',
    '..OOOOOOOOOOOO..',
    '..OOWKOOOOWKOO..',
    '..OOnnnOOnnnOO..',
    '...OnnnKKnnnO...',
    '....nnnnnnnn....',
    '....GGGGGGGG....',
    '...GGGGGGGGGG...',
    '...GGGyyyyGGG...',
    '....dddddddd....',
    '...oo......oo...',
    '....oo....oo....',
    '....KK.....KK...'
  ]);
  // facing UP
  S('fox_u0', [
    '....O......O....',
    '...OO......OO...',
    '...OnO....OnO...',
    '...OOOOOOOOOO...',
    '..OOOOOOOOOOOO..',
    '..OOOOOOOOOOOO..',
    '..OOOOOOOOOOOO..',
    '...OOOOOOOOOO...',
    '....OOOOOOOO....',
    '....GGGGGGGG....',
    '...GGGGGGGGGG...',
    '...GGGyyyyGGG...',
    '..nOdddddddd....',
    '..nnOoo...oo....',
    '...nOoo...oo....',
    '....KK....KK....'
  ]);
  S('fox_u1', [
    '....O......O....',
    '...OO......OO...',
    '...OnO....OnO...',
    '...OOOOOOOOOO...',
    '..OOOOOOOOOOOO..',
    '..OOOOOOOOOOOO..',
    '..OOOOOOOOOOOO..',
    '...OOOOOOOOOO...',
    '....OOOOOOOO....',
    '....GGGGGGGG....',
    '...GGGGGGGGGG...',
    '...GGGyyyyGGG...',
    '....ddddddddOn..',
    '...oo...ooOnn...',
    '...oo...ooOn....',
    '...KK.....KK....'
  ]);
  // facing LEFT
  S('fox_l0', [
    '....O....O......',
    '....OO..OO......',
    '....OnO.OnO.....',
    '....OOOOOOO.....',
    '...OOOOOOOOO....',
    '..nKWOOOOOOO....',
    '..nnnOOOOOOO....',
    '..Knnn.OOOO.....',
    '....GGGGGGG.....',
    '...GGGGGGGGGnn..',
    '...GGyyyGGGOnnn.',
    '...GGGGGGGGOOn..',
    '....ddddddd.....',
    '....oo..oo......',
    '....oo..oo......',
    '....KK..KK......'
  ]);
  S('fox_l1', [
    '....O....O......',
    '....OO..OO......',
    '....OnO.OnO.....',
    '....OOOOOOO.....',
    '...OOOOOOOOO....',
    '..nKWOOOOOOO....',
    '..nnnOOOOOOO....',
    '..Knnn.OOOO.....',
    '....GGGGGGG.....',
    '...GGGGGGGGGnn..',
    '...GGyyyGGGOnnn.',
    '...GGGGGGGGOOn..',
    '....ddddddd.....',
    '...oo....oo.....',
    '...oo.....oo....',
    '...KK.....KK....'
  ]);
  SPR.fox_r0 = mirrorSprite(SPR.fox_l0);
  SPR.fox_r1 = mirrorSprite(SPR.fox_l1);

  // hurt flash versions
  for (const k of ['fox_d0', 'fox_u0', 'fox_l0', 'fox_r0']) {
    SPR[k + '_flash'] = tintSprite(SPR[k], '#ffffff', 0.85);
  }

  // ---------------- ENEMIES ----------------
  // Slime (green) — 2 frames
  S('slime0', [
    '................',
    '................',
    '................',
    '.....VVVVVV.....',
    '....VVVVVVVV....',
    '...VVWKVVKWVV...',
    '...VVVVVVVVVV...',
    '..VVVVVVVVVVVV..',
    '..VvVVVVVVVVvV..',
    '..vvvVVVVVVvvv..',
    '...vvvvvvvvvv...',
    '................',
    '................',
    '................',
    '................',
    '................'
  ]);
  S('slime1', [
    '................',
    '................',
    '................',
    '................',
    '................',
    '....VVVVVVVV....',
    '...VVWKVVKWVV...',
    '..VVVVVVVVVVVV..',
    '.VVVVVVVVVVVVVV.',
    '.VvVVVVVVVVVVvV.',
    '.vvvvVVVVVVvvvv.',
    '..vvvvvvvvvvvv..',
    '................',
    '................',
    '................',
    '................'
  ]);
  SPR.slimeR0 = tintSprite(SPR.slime0, '#d84848', 0.45);
  SPR.slimeR1 = tintSprite(SPR.slime1, '#d84848', 0.45);

  // Spitter (octopus-ish shooter)
  S('spit0', [
    '................',
    '................',
    '....RRRRRRRR....',
    '...RRRRRRRRRR...',
    '..RRWKRRRRKWRR..',
    '..RRRRRRRRRRRR..',
    '..RRRRrrrrRRRR..',
    '..RRRrXXXXrRRR..',
    '...RRrXKKXrRR...',
    '...RRRrrrrRRR...',
    '..rRRrRRRRrRRr..',
    '..rRr.rRRr.rRr..',
    '..r.r..rr...rr..',
    '................',
    '................',
    '................'
  ]);
  S('spit1', [
    '................',
    '................',
    '....RRRRRRRR....',
    '...RRRRRRRRRR...',
    '..RRWKRRRRKWRR..',
    '..RRRRRRRRRRRR..',
    '..RRRRrrrrRRRR..',
    '..RRRrXXXXrRRR..',
    '...RRrXKKXrRR...',
    '...RRRrrrrRRR...',
    '..rRrRRRRRRrRr..',
    '..rr.rRRRRr.rr..',
    '......rrrr......',
    '................',
    '................',
    '................'
  ]);

  // Bat
  S('bat0', [
    '................',
    '................',
    '................',
    '.PP..........PP.',
    '.PPP........PPP.',
    '.PPPP.PPPP.PPPP.',
    '..PPPPPPPPPPPP..',
    '...PPWKPPKWPP...',
    '....PPPPPPPP....',
    '.....P.PP.P.....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................'
  ]);
  S('bat1', [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......PPPP......',
    '..PPPPPPPPPPPP..',
    '.PPPPPWKPPKWPPP.',
    '.PP..PPPPPPP.PP.',
    '......P.PP.P....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................'
  ]);

  // Skeleton soldier
  S('skel0', [
    '................',
    '....WWWWWWWW....',
    '...WWWWWWWWWW...',
    '...WKKWWWWKKW...',
    '...WWWWWWWWWW...',
    '....WKWKWKWW....',
    '.....WWWWWW.....',
    '....llllllll....',
    '...lWlWWWWlWl...',
    '...lWlWWWWlWl...',
    '....lWWWWWWl....',
    '.....WWWWWW.....',
    '....WW....WW....',
    '....WW....WW....',
    '...WW......WW...',
    '................'
  ]);
  S('skel1', [
    '................',
    '....WWWWWWWW....',
    '...WWWWWWWWWW...',
    '...WKKWWWWKKW...',
    '...WWWWWWWWWW...',
    '....WKWKWKWW....',
    '.....WWWWWW.....',
    '....llllllll....',
    '...lWlWWWWlWl...',
    '...lWlWWWWlWl...',
    '....lWWWWWWl....',
    '.....WWWWWW.....',
    '....WW....WW....',
    '...WW......WW...',
    '....WW....WW....',
    '................'
  ]);

  // Ghost (graveyard)
  S('ghost0', [
    '................',
    '....UUUUUUUU....',
    '...UUUUUUUUUU...',
    '..UUUUUUUUUUUU..',
    '..UUKKUUUUKKUU..',
    '..UUKKUUUUKKUU..',
    '..UUUUUUUUUUUU..',
    '..UUUUUKKUUUUU..',
    '..UUUUUUUUUUUU..',
    '..UUUUUUUUUUUU..',
    '..UUUUUUUUUUUU..',
    '..UU.UUU.UUU.U..',
    '..U...UU..UU....',
    '................',
    '................',
    '................'
  ], { outline: false });
  S('ghost1', [
    '................',
    '....UUUUUUUU....',
    '...UUUUUUUUUU...',
    '..UUUUUUUUUUUU..',
    '..UUKKUUUUKKUU..',
    '..UUKKUUUUKKUU..',
    '..UUUUUUUUUUUU..',
    '..UUUUUKKUUUUU..',
    '..UUUUUUUUUUUU..',
    '..UUUUUUUUUUUU..',
    '..UUUUUUUUUUUU..',
    '..U.UUU.UUU.UU..',
    '....UU..UU...U..',
    '................',
    '................',
    '................'
  ], { outline: false });

  // Royal Slime (miniboss, 24x24)
  S('bigslime0', [
    '..........YY............',
    '......Y...YY...Y........',
    '......YY..YY..YY........',
    '......YYYYYYYYYY........',
    '......YYYYYYYYYY........',
    '.......VVVVVVVV.........',
    '.....VVVVVVVVVVVV.......',
    '....VVVVVVVVVVVVVV......',
    '...VVVWWKVVVVKWWVVV.....',
    '...VVVWKKVVVVKKWVVV.....',
    '..VVVVVVVVVVVVVVVVVV....',
    '..VVVVVVVVVVVVVVVVVV....',
    '..VVVVVVVKKKKVVVVVVV....',
    '.VVVVVVVVKKKKVVVVVVVV...',
    '.VVvVVVVVVVVVVVVVVvVV...',
    '.VvvvVVVVVVVVVVVVvvvV...',
    '.vvvvvVVVVVVVVVVvvvvv...',
    '..vvvvvvvvvvvvvvvvvv....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................'
  ]);
  S('bigslime1', [
    '........................',
    '..........YY............',
    '......Y...YY...Y........',
    '......YY..YY..YY........',
    '......YYYYYYYYYY........',
    '......YYYYYYYYYY........',
    '.......VVVVVVVV.........',
    '.....VVVVVVVVVVVV.......',
    '....VVVVVVVVVVVVVV......',
    '...VVVWWKVVVVKWWVVV.....',
    '...VVVWKKVVVVKKWVVV.....',
    '..VVVVVVVVVVVVVVVVVV....',
    '.VVVVVVVVVVVVVVVVVVVV...',
    'VVVVVVVVVKKKKVVVVVVVVV..',
    'VVvVVVVVVKKKKVVVVVVvVV..',
    'VvvvVVVVVVVVVVVVVVvvvV..',
    'vvvvvVVVVVVVVVVVVvvvvv..',
    '.vvvvvvvvvvvvvvvvvvvv...',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................'
  ]);

  // Gloom Knight (boss, 24x24) — frame 0/1 walk, shield held front
  S('boss0', [
    '........TTTTTTTT........',
    '.......TTTTTTTTTT.......',
    '.......TTRRTTTTRR.......',
    '.......TTRRTTTTRR.......',
    '.......TTTTTTTTTT.......',
    '........TTTTTTTT........',
    '......PPTTTTTTTTPP......',
    '....PPPPPPPPPPPPPPPP....',
    '...PPPPPPPPPPPPPPPPPP...',
    '...PPpPPPPPPPPPPPPpPP...',
    '..SSPpPPPPppppPPPPpPSS..',
    '..SSPpPPPppppppPPPpPSS..',
    '..SSPpPPPpPPPPpPPPpPSS..',
    '..SSPpPPPppppppPPPpPSS..',
    '..SSPpPPPPppppPPPPpPSS..',
    '..SSPPPPPPPPPPPPPPPPSS..',
    '..SS.PPPPPPPPPPPPPP.SS..',
    '......PPPP....PPPP......',
    '......TTTT....TTTT......',
    '......TTTT....TTTT......',
    '.....TTTT......TTTT.....',
    '........................',
    '........................',
    '........................'
  ]);
  S('boss1', [
    '........TTTTTTTT........',
    '.......TTTTTTTTTT.......',
    '.......TTRRTTTTRR.......',
    '.......TTRRTTTTRR.......',
    '.......TTTTTTTTTT.......',
    '........TTTTTTTT........',
    '......PPTTTTTTTTPP......',
    '....PPPPPPPPPPPPPPPP....',
    '...PPPPPPPPPPPPPPPPPP...',
    '...PPpPPPPPPPPPPPPpPP...',
    '..SSPpPPPPppppPPPPpPSS..',
    '..SSPpPPPppppppPPPpPSS..',
    '..SSPpPPPpPPPPpPPPpPSS..',
    '..SSPpPPPppppppPPPpPSS..',
    '..SSPpPPPPppppPPPPpPSS..',
    '..SSPPPPPPPPPPPPPPPPSS..',
    '..SS.PPPPPPPPPPPPPP.SS..',
    '......PPPP....PPPP......',
    '......TTTT....TTTT......',
    '.....TTTT......TTTT.....',
    '......TTTT....TTTT......',
    '........................',
    '........................',
    '........................'
  ]);
  SPR.boss_stun = tintSprite(SPR.boss0, '#f2cf4a', 0.5);
  SPR.boss_rage0 = tintSprite(SPR.boss0, '#d83838', 0.35);
  SPR.boss_rage1 = tintSprite(SPR.boss1, '#d83838', 0.35);

  // boss shield (drawn in front, 12x16)
  S('shield', [
    '.llllllllll.',
    'llSSSSSSSSll',
    'lSSSUUUUSSSl',
    'lSSUUUUUUSSl',
    'lSSUSSSSUSSl',
    'lSSUSYYSUSSl',
    'lSSUSYYSUSSl',
    'lSSUSSSSUSSl',
    'lSSUUUUUUSSl',
    'lSSSUUUUSSSl',
    'llSSSSSSSSll',
    '.lSSSSSSSSl.',
    '.llSSSSSSll.',
    '..llSSSSll..',
    '...llSSll...',
    '....llll....'
  ]);

  // ---------------- NPCs ----------------
  S('elder', [
    '................',
    '....llllllll....',
    '...llllllllll...',
    '...lWWWWWWWWl...',
    '...lWKWWWWKWl...',
    '...lWWWWWWWWl...',
    '....WWlWWlWW....',
    '....WWWWWWWW....',
    '.....WWWWWW.....',
    '....RRRRRRRR....',
    '...RRRRRRRRRR...',
    '...RRRyyyyRRR...',
    '...RRRRRRRRRR...',
    '....rrrrrrrr....',
    '....rr....rr....',
    '....KK....KK....'
  ]);
  S('shopkeep', [
    '................',
    '....mmmmmmmm....',
    '...mmmmmmmmmm...',
    '...mnnnnnnnnm...',
    '...mnKnnnnKnm...',
    '...mnnnnnnnnm...',
    '....nnmnnmnn....',
    '....nnnnnnnn....',
    '.....nnnnnn.....',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '...BBByyyyBBB...',
    '...BBBBBBBBBB...',
    '....bbbbbbbb....',
    '....bb....bb....',
    '....KK....KK....'
  ]);
  S('granny', [
    '................',
    '....llllllll....',
    '...llllllllll...',
    '...lnnnnnnnnl...',
    '...lnKnnnnKnl...',
    '...lnnnnnnnnl...',
    '....nnnnnnnn....',
    '.....nnnnnn.....',
    '....PPPPPPPP....',
    '...PPPPPPPPPP...',
    '...PPPPPPPPPP...',
    '...PPPPPPPPPP...',
    '...PPPPPPPPPP...',
    '....pppppppp....',
    '....pp....pp....',
    '....KK....KK....'
  ]);
  S('kid', [
    '................',
    '................',
    '................',
    '.....mmmmmm.....',
    '....mmmmmmmm....',
    '....nKnnnnKn....',
    '....nnnnnnnn....',
    '.....nnnnnn.....',
    '....YYYYYYYY....',
    '....YYYYYYYY....',
    '....YYYYYYYY....',
    '.....yyyyyy.....',
    '.....nn..nn.....',
    '.....KK..KK.....',
    '................',
    '................'
  ]);
  S('fairy_npc', [
    '................',
    '................',
    '....C......C....',
    '...CCC....CCC...',
    '..CCCCC..CCCCC..',
    '..CCCWWWWWWCCC..',
    '...CCWWKKWWCC...',
    '...CCWWWWWWCC...',
    '..CCCCWWWWCCCC..',
    '..CCCC.WW.CCCC..',
    '...CC..WW..CC...',
    '........W.......',
    '................',
    '................',
    '................',
    '................'
  ], { outline: false });

  // ---------------- ITEMS (16x16) ----------------
  S('it_sword', [
    '................',
    '.......WW.......',
    '......WWcW......',
    '......WWcW......',
    '......WWcW......',
    '......WWcW......',
    '......WWcW......',
    '......WWcW......',
    '......WWcW......',
    '....yYYYYYYy....',
    '....yYYYYYYy....',
    '......YYYY......',
    '......yYYy......',
    '......yYYy......',
    '.......yy.......',
    '................'
  ]);
  S('it_bow', [
    '................',
    '....MM..........',
    '...MMHM.........',
    '...MHM..........',
    '..MMH...........',
    '..MH......W.....',
    '..MH.....WW.....',
    '..MHWWWWWWWW....',
    '..MH.....WW.....',
    '..MH......W.....',
    '..MMH...........',
    '...MHM..........',
    '...MMHM.........',
    '....MM..........',
    '................',
    '................'
  ]);
  S('it_lantern', [
    '................',
    '......yyyy......',
    '.....y....y.....',
    '.....y....y.....',
    '....yyyyyyyy....',
    '....y.FFFF.y....',
    '....y.FFFF.y....',
    '....yFFWWFFy....',
    '....yFFWWFFy....',
    '....y.FFFF.y....',
    '....y.ffff.y....',
    '....yyyyyyyy....',
    '.....yyyyyy.....',
    '................',
    '................',
    '................'
  ]);
  S('it_crown', [
    '................',
    '................',
    '...G.........G..',
    '..YGY..Y...YGY..',
    '..YY..YYY...YY..',
    '..YY.YYYYY..YY..',
    '..YYYYYYYYYYYY..',
    '..YYYYYYYYYYYY..',
    '..YYGYYYYYYGYY..',
    '..YYGYYRRYYGYY..',
    '..YYYYYRRYYYYY..',
    '..YYYYYYYYYYYY..',
    '..yyyyyyyyyyyy..',
    '................',
    '................',
    '................'
  ]);
  S('it_heartcont', [
    '................',
    '................',
    '...RRR....RRR...',
    '..RRXRR..RRXRR..',
    '..RXXRR..RRRRR..',
    '.RRXRRRRRRRRRRR.',
    '.RRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRRR.',
    '..RRRRRRRRRRRR..',
    '...RRRRRRRRRR...',
    '....RRRRRRRR....',
    '.....RRRRRR.....',
    '......RRRR......',
    '.......RR.......',
    '................',
    '................'
  ]);
  S('it_bosskey', [
    '................',
    '................',
    '....PPPP........',
    '...PP..PP.......',
    '...PP..PP.......',
    '....PPPP........',
    '.....PP.........',
    '.....PP.........',
    '.....PPPPPPPPP..',
    '.....PP..P..P...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................'
  ]);

  // ---------------- PICKUPS (8x8 drawn in 16 grid for ease) ----------------
  S('heart', [
    '........',
    '.RR..RR.',
    'RXXRRRRR',
    'RXXRRRRR',
    'RRRRRRRR',
    '.RRRRRR.',
    '..RRRR..',
    '...RR...'
  ]);
  S('gem', [
    '........',
    '...CC...',
    '..CWCC..',
    '.CWCCCC.',
    '.CCCCCC.',
    '..CCCC..',
    '...CC...',
    '........'
  ]);
  S('gem_big', [
    '........',
    '...YY...',
    '..YWYY..',
    '.YWYYYY.',
    '.YYYYYY.',
    '..YYYY..',
    '...YY...',
    '........'
  ]);
  S('key', [
    '..YY....',
    '.Y..Y...',
    '.Y..Y...',
    '..YY....',
    '..Y.....',
    '..Y.....',
    '..YYY...',
    '..Y.....'
  ]);
  S('bomb_pickup', [
    '....l...',
    '...l....',
    '..KKK...',
    '.KKkKK..',
    '.KkKKK..',
    '.KKKKK..',
    '..KKK...',
    '........'
  ]);
  S('arrow_pickup', [
    '...W....',
    '..WWW...',
    '...M....',
    '...M....',
    '...M....',
    '...M....',
    '..HMH...',
    '...M....'
  ]);

  // ---------------- OBJECTS ----------------
  S('chest', [
    '................',
    '..mmmmmmmmmmmm..',
    '.mMMMMMMMMMMMm..',
    '.mMMMMMMMMMMMm..',
    '.mMMMMMMMMMMMm..',
    '.mmmmmmmmmmmmm..',
    '.mMMMMyYyMMMMm..',
    '.mMMMMyyyMMMMm..',
    '.mMMMMMyMMMMMm..',
    '.mMMMMMMMMMMMm..',
    '.mmmmmmmmmmmmm..',
    '................',
    '................',
    '................',
    '................',
    '................'
  ]);
  S('chest_open', [
    '................',
    '..mmmmmmmmmmmm..',
    '.mKKKKKKKKKKKm..',
    '.mKKKKKKKKKKKm..',
    '.mKKKKKKKKKKKm..',
    '.mmmmmmmmmmmmm..',
    '.mMMMMMMMMMMMm..',
    '.mMMMMMMMMMMMm..',
    '.mMMMMMMMMMMMm..',
    '.mMMMMMMMMMMMm..',
    '.mmmmmmmmmmmmm..',
    '................',
    '................',
    '................',
    '................',
    '................'
  ]);
  S('bomb', [
    '................',
    '......l.........',
    '.....l..........',
    '....KKKK........',
    '...KKkKKK.......',
    '...KkKKKK.......',
    '...KKKKKK.......',
    '....KKKK........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................'
  ]);
  S('rock_proj', [
    '........',
    '..ggg...',
    '.glggg..',
    '.ggggg..',
    '.gkgkg..',
    '..ggg...',
    '........',
    '........'
  ]);
  S('gloom_proj', [
    '........',
    '...PP...',
    '..PqqP..',
    '.PqWWqP.',
    '.PqWWqP.',
    '..PqqP..',
    '...PP...',
    '........'
  ], { outline: false });

  // sword beam
  S('beam', [
    '...CC...',
    '..CWWC..',
    '.CWWWWC.',
    '..CWWC..',
    '...CC...',
    '........',
    '........',
    '........'
  ], { outline: false });
})();

// ============================================================
// BITMAP FONT (3x5)
// ============================================================
const FONT = (() => {
  const G = {
    A: [2,5,7,5,5], B: [6,5,6,5,6], C: [3,4,4,4,3], D: [6,5,5,5,6], E: [7,4,6,4,7],
    F: [7,4,6,4,4], G: [3,4,5,5,3], H: [5,5,7,5,5], I: [7,2,2,2,7], J: [1,1,1,5,2],
    K: [5,5,6,5,5], L: [4,4,4,4,7], M: [5,7,7,5,5], N: [5,7,7,7,5], O: [2,5,5,5,2],
    P: [6,5,6,4,4], Q: [2,5,5,7,3], R: [6,5,6,5,5], S: [3,4,2,1,6], T: [7,2,2,2,2],
    U: [5,5,5,5,7], V: [5,5,5,5,2], W: [5,5,7,7,5], X: [5,5,2,5,5], Y: [5,5,2,2,2],
    Z: [7,1,2,4,7],
    '0': [2,5,5,5,2], '1': [2,6,2,2,7], '2': [6,1,2,4,7], '3': [6,1,2,1,6], '4': [5,5,7,1,1],
    '5': [7,4,6,1,6], '6': [3,4,6,5,2], '7': [7,1,2,2,2], '8': [2,5,2,5,2], '9': [2,5,3,1,6],
    ' ': [0,0,0,0,0], '.': [0,0,0,0,2], ',': [0,0,0,2,4], '!': [2,2,2,0,2], '?': [6,1,2,0,2],
    "'": [2,2,0,0,0], '-': [0,0,7,0,0], ':': [0,2,0,2,0], '/': [1,1,2,4,4], '<': [1,2,4,2,1],
    '>': [4,2,1,2,4], '*': [5,2,7,2,5], '+': [0,2,7,2,0], '(': [1,2,2,2,1], ')': [4,2,2,2,4]
  };
  const cache = {};
  function glyph(ch, color) {
    const key = ch + color;
    if (cache[key]) return cache[key];
    const rows = G[ch] || G['?'];
    const cv = document.createElement('canvas');
    cv.width = 3; cv.height = 5;
    const x = cv.getContext('2d');
    x.fillStyle = color;
    for (let j = 0; j < 5; j++)
      for (let i = 0; i < 3; i++)
        if (rows[j] & (4 >> i)) x.fillRect(i, j, 1, 1);
    cache[key] = cv;
    return cv;
  }
  function draw(ctx, text, x, y, color = '#f4f4f0') {
    text = String(text).toUpperCase();
    let cx = x;
    for (const ch of text) {
      if (ch === '\n') { y += 7; cx = x; continue; }
      ctx.drawImage(glyph(ch, color), cx, y);
      cx += 4;
    }
  }
  function width(text) { return String(text).length * 4 - 1; }
  return { draw, width };
})();

// ============================================================
// BITMAP FONT (5x7) — larger, readable font for dialog & UI
// ============================================================
const FONT5 = (() => {
  const G = {
    A: [14,17,17,31,17,17,17], B: [30,17,17,30,17,17,30], C: [14,17,16,16,16,17,14],
    D: [30,17,17,17,17,17,30], E: [31,16,16,30,16,16,31], F: [31,16,16,30,16,16,16],
    G: [14,17,16,23,17,17,14], H: [17,17,17,31,17,17,17], I: [14,4,4,4,4,4,14],
    J: [7,2,2,2,2,18,12],      K: [17,18,20,24,20,18,17], L: [16,16,16,16,16,16,31],
    M: [17,27,21,21,17,17,17], N: [17,17,25,21,19,17,17], O: [14,17,17,17,17,17,14],
    P: [30,17,17,30,16,16,16], Q: [14,17,17,17,21,18,13], R: [30,17,17,30,20,18,17],
    S: [14,17,16,14,1,17,14],  T: [31,4,4,4,4,4,4],       U: [17,17,17,17,17,17,14],
    V: [17,17,17,17,17,10,4],  W: [17,17,17,21,21,27,17], X: [17,17,10,4,10,17,17],
    Y: [17,17,17,10,4,4,4],    Z: [31,1,2,4,8,16,31],
    '0': [14,17,19,21,25,17,14], '1': [4,12,4,4,4,4,14],  '2': [14,17,1,2,4,8,31],
    '3': [31,2,4,2,1,17,14],   '4': [2,6,10,18,31,2,2],   '5': [31,16,30,1,1,17,14],
    '6': [6,8,16,30,17,17,14], '7': [31,1,2,4,8,8,8],     '8': [14,17,17,14,17,17,14],
    '9': [14,17,17,15,1,2,12],
    ' ': [0,0,0,0,0,0,0], '.': [0,0,0,0,0,12,12], ',': [0,0,0,0,12,4,8],
    '!': [4,4,4,4,4,0,4], '?': [14,17,1,2,4,0,4], "'": [4,4,8,0,0,0,0],
    '-': [0,0,0,31,0,0,0], ':': [0,12,12,0,12,12,0], '/': [1,1,2,4,8,16,16],
    '<': [2,4,8,16,8,4,2], '>': [8,4,2,1,2,4,8], '*': [0,4,21,14,21,4,0],
    '+': [0,4,4,31,4,4,0], '(': [2,4,8,8,8,4,2], ')': [8,4,2,2,2,4,8]
  };
  const cache = {};
  function glyph(ch, color) {
    const key = ch + color;
    if (cache[key]) return cache[key];
    const rows = G[ch] || G['?'];
    const cv = document.createElement('canvas');
    cv.width = 5; cv.height = 7;
    const x = cv.getContext('2d');
    x.fillStyle = color;
    for (let j = 0; j < 7; j++)
      for (let i = 0; i < 5; i++)
        if (rows[j] & (16 >> i)) x.fillRect(i, j, 1, 1);
    cache[key] = cv;
    return cv;
  }
  function draw(ctx, text, x, y, color = '#f4f4f0') {
    text = String(text).toUpperCase();
    let cx = x;
    for (const ch of text) {
      if (ch === '\n') { y += 9; cx = x; continue; }
      ctx.drawImage(glyph(ch, color), cx, y);
      cx += 6;
    }
  }
  function width(text) { return String(text).length * 6 - 1; }
  return { draw, width };
})();

// ============================================================
// TILE ATLAS — procedural tile art
// ============================================================
const T = {
  GRASS: 0, FLOWERS: 1, TREE: 2, WATER: 3, SAND: 4, ROCK: 5, BUSH: 6, PATH: 7,
  CRACK: 8, BRIDGE: 9, FENCE: 10, HWALL: 11, HDOOR: 12, CAVE: 13, STUMP: 14,
  DWALL: 20, DFLOOR: 21, DOOR_LOCK: 22, DOOR_BOSS: 23, DOOR_SHUT: 24, STAIRS: 25,
  DCRACK: 26, TORCH: 27, STATUE: 28, DOOR_OPEN: 29,
  WFLOOR: 30, WWALL: 31, RUG: 32, COUNTER: 33, GRAVE: 34, POND: 35, ROOF: 36,
  SIGN: 37, WATERFALL: 38
};

const SOLID_TILES = new Set([
  T.TREE, T.WATER, T.ROCK, T.BUSH, T.FENCE, T.HWALL, T.CRACK, T.STUMP,
  T.DWALL, T.DOOR_LOCK, T.DOOR_BOSS, T.DOOR_SHUT, T.DCRACK, T.TORCH, T.STATUE,
  T.WWALL, T.COUNTER, T.GRAVE, T.POND, T.ROOF, T.SIGN, T.WATERFALL
]);

// seeded PRNG for consistent texture
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const TileArt = (() => {
  const FRAMES = 2;
  const COLS = 40;
  const atlas = document.createElement('canvas');
  atlas.width = COLS * 16;
  atlas.height = FRAMES * 16;
  const x = atlas.getContext('2d');

  function px(i, j, c) { x.fillStyle = c; x.fillRect(i, j, 1, 1); }

  function drawGrassBase(ox, oy, seed) {
    x.fillStyle = '#4f9e52';
    x.fillRect(ox, oy, 16, 16);
    const r = makeRng(seed);
    for (let n = 0; n < 13; n++) {
      const i = (r() * 16) | 0, j = (r() * 16) | 0;
      px(ox + i, oy + j, r() < 0.5 ? '#3e8948' : '#63b45e');
    }
  }
  function drawDirtBase(ox, oy, seed) {
    x.fillStyle = '#d9bd7c';
    x.fillRect(ox, oy, 16, 16);
    const r = makeRng(seed);
    for (let n = 0; n < 10; n++) {
      const i = (r() * 16) | 0, j = (r() * 16) | 0;
      px(ox + i, oy + j, r() < 0.5 ? '#c4a868' : '#e6cf94');
    }
  }
  function drawStoneBase(ox, oy, seed, base, dark, light) {
    x.fillStyle = base; x.fillRect(ox, oy, 16, 16);
    const r = makeRng(seed);
    for (let n = 0; n < 12; n++) {
      const i = (r() * 16) | 0, j = (r() * 16) | 0;
      px(ox + i, oy + j, r() < 0.5 ? dark : light);
    }
  }

  function draw(id, frame, fn) {
    const ox = id * 16, oy = frame * 16;
    x.save();
    x.beginPath(); x.rect(ox, oy, 16, 16); x.clip();
    fn(ox, oy);
    x.restore();
  }

  for (let f = 0; f < FRAMES; f++) {
    // GRASS
    draw(T.GRASS, f, (ox, oy) => drawGrassBase(ox, oy, 7));
    // FLOWERS (sway between frames)
    draw(T.FLOWERS, f, (ox, oy) => {
      drawGrassBase(ox, oy, 21);
      const fy = f === 0 ? 0 : 1;
      px(ox + 3, oy + 4 + fy, '#f4f4f0'); px(ox + 4, oy + 4 + fy, '#f2cf4a');
      px(ox + 11, oy + 9 - fy, '#f47070'); px(ox + 12, oy + 9 - fy, '#f4f4f0');
      px(ox + 7, oy + 12 + fy, '#f2cf4a');
    });
    // TREE
    draw(T.TREE, f, (ox, oy) => {
      drawGrassBase(ox, oy, 33);
      x.fillStyle = '#1d5c2a'; x.fillRect(ox + 1, oy + 1, 14, 12);
      x.fillStyle = '#2e7d3a'; x.fillRect(ox + 2, oy + 2, 12, 10);
      x.fillStyle = '#3f9e4a';
      x.fillRect(ox + 3, oy + 3, 5, 3); x.fillRect(ox + 9, oy + 5, 4, 2);
      x.fillRect(ox + 4, oy + 8, 3, 2);
      x.fillStyle = '#1d5c2a';
      x.fillRect(ox + 7, oy + 6, 2, 2); x.fillRect(ox + 11, oy + 9, 2, 2);
      x.fillStyle = '#5c3a1a'; x.fillRect(ox + 6, oy + 13, 4, 3);
      x.fillStyle = '#8a5a2c'; x.fillRect(ox + 7, oy + 13, 2, 3);
    });
    // WATER (animated)
    draw(T.WATER, f, (ox, oy) => {
      x.fillStyle = '#2a64c8'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#3c80e0';
      const off = f === 0 ? 0 : 2;
      for (let j = 0; j < 16; j += 4) {
        x.fillRect(ox + ((j + off) % 8), oy + j + 1, 5, 1);
        x.fillRect(ox + ((j + off + 8) % 12) + 2, oy + j + 3, 3, 1);
      }
      x.fillStyle = '#9cc8f8';
      px(ox + (f === 0 ? 4 : 10), oy + 2, '#9cc8f8');
      px(ox + (f === 0 ? 12 : 6), oy + 10, '#9cc8f8');
    });
    // WATERFALL
    draw(T.WATERFALL, f, (ox, oy) => {
      x.fillStyle = '#3c80e0'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#9cc8f8';
      for (let i = 1; i < 16; i += 3) {
        const off = (f === 0 ? 0 : 8);
        x.fillRect(ox + i, oy + ((i * 5 + off) % 16), 1, 4);
      }
      x.fillStyle = '#dceeff';
      x.fillRect(ox, oy + 14 + (f === 0 ? 0 : 1) - 1, 16, 1);
    });
    // SAND
    draw(T.SAND, f, (ox, oy) => {
      x.fillStyle = '#e8d8a0'; x.fillRect(ox, oy, 16, 16);
      const r = makeRng(91);
      for (let n = 0; n < 9; n++) px(ox + (r() * 16 | 0), oy + (r() * 16 | 0), '#d0bc84');
    });
    // ROCK (mountain)
    draw(T.ROCK, f, (ox, oy) => {
      x.fillStyle = '#6e6254'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#9a8a78'; x.fillRect(ox + 1, oy + 1, 14, 14);
      x.fillStyle = '#c0b4a4';
      x.fillRect(ox + 2, oy + 2, 6, 2); x.fillRect(ox + 10, oy + 6, 4, 2);
      x.fillStyle = '#6e6254';
      x.fillRect(ox + 8, oy + 4, 2, 6); x.fillRect(ox + 3, oy + 9, 5, 2);
      x.fillRect(ox + 11, oy + 11, 3, 3);
      x.fillStyle = '#52483c'; x.fillRect(ox, oy + 15, 16, 1);
    });
    // BUSH
    draw(T.BUSH, f, (ox, oy) => {
      drawGrassBase(ox, oy, 55);
      x.fillStyle = '#1d5c2a';
      x.beginPath(); x.arc(ox + 8, oy + 9, 6.5, 0, 7); x.fill();
      x.fillStyle = '#2e8d3a';
      x.beginPath(); x.arc(ox + 8, oy + 8, 5.5, 0, 7); x.fill();
      x.fillStyle = '#4fae54';
      x.fillRect(ox + 5, oy + 5, 3, 2); x.fillRect(ox + 9, oy + 8, 3, 2);
      x.fillStyle = '#1d5c2a';
      x.fillRect(ox + 8, oy + 6, 2, 1); x.fillRect(ox + 5, oy + 10, 2, 1);
    });
    // PATH
    draw(T.PATH, f, (ox, oy) => drawDirtBase(ox, oy, 17));
    // CRACK (bombable rock)
    draw(T.CRACK, f, (ox, oy) => {
      x.fillStyle = '#6e6254'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#9a8a78'; x.fillRect(ox + 1, oy + 1, 14, 14);
      x.fillStyle = '#52483c';
      x.fillRect(ox + 7, oy + 2, 1, 4); x.fillRect(ox + 8, oy + 5, 1, 3);
      x.fillRect(ox + 6, oy + 8, 1, 3); x.fillRect(ox + 8, oy + 10, 1, 4);
      x.fillRect(ox + 5, oy + 5, 2, 1); x.fillRect(ox + 9, oy + 8, 2, 1);
    });
    // BRIDGE
    draw(T.BRIDGE, f, (ox, oy) => {
      x.fillStyle = '#8a5a2c'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#a8742c';
      for (let j = 1; j < 16; j += 4) x.fillRect(ox, oy + j, 16, 2);
      x.fillStyle = '#5c3a1a';
      x.fillRect(ox, oy, 1, 16); x.fillRect(ox + 15, oy, 1, 16);
    });
    // FENCE
    draw(T.FENCE, f, (ox, oy) => {
      drawGrassBase(ox, oy, 73);
      x.fillStyle = '#8a5a2c';
      x.fillRect(ox + 2, oy + 4, 3, 10); x.fillRect(ox + 11, oy + 4, 3, 10);
      x.fillStyle = '#a8742c';
      x.fillRect(ox, oy + 6, 16, 2); x.fillRect(ox, oy + 10, 16, 2);
      x.fillStyle = '#5c3a1a';
      x.fillRect(ox + 2, oy + 13, 3, 1); x.fillRect(ox + 11, oy + 13, 3, 1);
    });
    // HOUSE WALL
    draw(T.HWALL, f, (ox, oy) => {
      x.fillStyle = '#b06a48'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#8a4a30';
      for (let j = 0; j < 16; j += 4) {
        x.fillRect(ox, oy + j + 3, 16, 1);
        const off = (j / 4) % 2 === 0 ? 4 : 10;
        x.fillRect(ox + off, oy + j, 1, 3);
      }
      x.fillStyle = '#c87f5a'; x.fillRect(ox + 1, oy + 1, 2, 1);
    });
    // ROOF
    draw(T.ROOF, f, (ox, oy) => {
      x.fillStyle = '#a83838'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#8c2424';
      for (let j = 2; j < 16; j += 4) x.fillRect(ox, oy + j, 16, 1);
      x.fillStyle = '#c85050';
      for (let j = 0; j < 16; j += 4) x.fillRect(ox + (j % 8 ? 3 : 9), oy + j, 4, 1);
    });
    // HOUSE DOOR
    draw(T.HDOOR, f, (ox, oy) => {
      x.fillStyle = '#b06a48'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#2a1a10'; x.fillRect(ox + 3, oy + 2, 10, 14);
      x.fillStyle = '#5c3a1a'; x.fillRect(ox + 4, oy + 3, 8, 13);
      x.fillStyle = '#8a5a2c'; x.fillRect(ox + 5, oy + 4, 6, 12);
      x.fillStyle = '#f2cf4a'; x.fillRect(ox + 10, oy + 9, 1, 2);
    });
    // CAVE
    draw(T.CAVE, f, (ox, oy) => {
      x.fillStyle = '#6e6254'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#9a8a78'; x.fillRect(ox + 1, oy + 1, 14, 14);
      x.fillStyle = '#10121a';
      x.fillRect(ox + 4, oy + 5, 8, 11);
      x.fillRect(ox + 5, oy + 3, 6, 2);
    });
    // STUMP
    draw(T.STUMP, f, (ox, oy) => {
      drawGrassBase(ox, oy, 99);
      x.fillStyle = '#5c3a1a';
      x.beginPath(); x.arc(ox + 8, oy + 8, 5.5, 0, 7); x.fill();
      x.fillStyle = '#8a5a2c';
      x.beginPath(); x.arc(ox + 8, oy + 8, 4, 0, 7); x.fill();
      x.fillStyle = '#a8742c';
      x.beginPath(); x.arc(ox + 8, oy + 8, 2, 0, 7); x.fill();
    });
    // DUNGEON WALL
    draw(T.DWALL, f, (ox, oy) => {
      x.fillStyle = '#404a5e'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#2c3344';
      for (let j = 0; j < 16; j += 4) {
        x.fillRect(ox, oy + j + 3, 16, 1);
        const off = (j / 4) % 2 === 0 ? 5 : 11;
        x.fillRect(ox + off, oy + j, 1, 3);
      }
      x.fillStyle = '#525e76'; x.fillRect(ox + 1, oy + 1, 3, 1); x.fillRect(ox + 8, oy + 9, 3, 1);
    });
    // DUNGEON FLOOR
    draw(T.DFLOOR, f, (ox, oy) => {
      x.fillStyle = '#2e3444'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#262c3a';
      x.fillRect(ox, oy, 16, 1); x.fillRect(ox, oy, 1, 16);
      const r = makeRng(140);
      for (let n = 0; n < 4; n++) px(ox + (r() * 14 | 0) + 1, oy + (r() * 14 | 0) + 1, '#363e52');
    });
    // LOCKED DOOR
    draw(T.DOOR_LOCK, f, (ox, oy) => {
      x.fillStyle = '#404a5e'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#8a5a2c'; x.fillRect(ox + 2, oy + 2, 12, 14);
      x.fillStyle = '#a8742c'; x.fillRect(ox + 3, oy + 3, 10, 13);
      x.fillStyle = '#f2cf4a';
      x.fillRect(ox + 7, oy + 7, 2, 2); x.fillRect(ox + 7, oy + 9, 2, 3);
      x.fillStyle = '#5c3a1a'; x.fillRect(ox + 3, oy + 8, 10, 1);
    });
    // BOSS DOOR
    draw(T.DOOR_BOSS, f, (ox, oy) => {
      x.fillStyle = '#404a5e'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#552c8e'; x.fillRect(ox + 2, oy + 2, 12, 14);
      x.fillStyle = '#8a4ad8'; x.fillRect(ox + 3, oy + 3, 10, 13);
      x.fillStyle = '#f2cf4a';
      x.fillRect(ox + 6, oy + 6, 4, 2); x.fillRect(ox + 7, oy + 8, 2, 4);
      x.fillStyle = '#10121a'; px(ox + 7, oy + 6, '#10121a'); px(ox + 8, oy + 6, '#10121a');
    });
    // SHUTTER DOOR
    draw(T.DOOR_SHUT, f, (ox, oy) => {
      x.fillStyle = '#404a5e'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#5a6478';
      for (let j = 1; j < 16; j += 3) x.fillRect(ox + 1, oy + j, 14, 2);
      x.fillStyle = '#2c3344';
      for (let j = 0; j < 16; j += 3) x.fillRect(ox + 1, oy + j, 14, 1);
    });
    // OPEN DOOR (dungeon doorway floor)
    draw(T.DOOR_OPEN, f, (ox, oy) => {
      x.fillStyle = '#2e3444'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#1c2230'; x.fillRect(ox, oy, 2, 16); x.fillRect(ox + 14, oy, 2, 16);
    });
    // STAIRS
    draw(T.STAIRS, f, (ox, oy) => {
      x.fillStyle = '#10121a'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#5a6478';
      for (let j = 0; j < 16; j += 4) x.fillRect(ox + 2 + j / 4, oy + j, 12 - j / 2, 2);
    });
    // DUNGEON CRACK
    draw(T.DCRACK, f, (ox, oy) => {
      x.fillStyle = '#404a5e'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#2c3344';
      for (let j = 0; j < 16; j += 4) x.fillRect(ox, oy + j + 3, 16, 1);
      x.fillStyle = '#171c28';
      x.fillRect(ox + 7, oy + 2, 1, 4); x.fillRect(ox + 8, oy + 5, 1, 3);
      x.fillRect(ox + 6, oy + 8, 1, 3); x.fillRect(ox + 8, oy + 10, 1, 4);
      x.fillRect(ox + 5, oy + 5, 2, 1); x.fillRect(ox + 9, oy + 9, 2, 1);
    });
    // TORCH (animated flame)
    draw(T.TORCH, f, (ox, oy) => {
      x.fillStyle = '#404a5e'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#2c3344';
      for (let j = 0; j < 16; j += 4) x.fillRect(ox, oy + j + 3, 16, 1);
      x.fillStyle = '#8a5a2c'; x.fillRect(ox + 7, oy + 8, 2, 6);
      x.fillStyle = '#f47020';
      if (f === 0) { x.fillRect(ox + 6, oy + 4, 4, 4); x.fillRect(ox + 7, oy + 2, 2, 2); }
      else { x.fillRect(ox + 6, oy + 3, 4, 5); x.fillRect(ox + 7, oy + 1, 2, 2); }
      x.fillStyle = '#ffb838';
      x.fillRect(ox + 7, oy + 5, 2, 3);
      x.fillStyle = '#fff0a0'; px(ox + (f === 0 ? 7 : 8), oy + 6, '#fff0a0');
    });
    // STATUE
    draw(T.STATUE, f, (ox, oy) => {
      x.fillStyle = '#2e3444'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#5a6478';
      x.fillRect(ox + 4, oy + 12, 8, 3);
      x.fillRect(ox + 5, oy + 5, 6, 7);
      x.fillRect(ox + 5, oy + 1, 6, 4);
      x.fillStyle = '#7a86a0';
      x.fillRect(ox + 6, oy + 2, 2, 2); x.fillRect(ox + 6, oy + 6, 1, 5);
      x.fillStyle = '#10121a';
      x.fillRect(ox + 6, oy + 3, 1, 1); x.fillRect(ox + 9, oy + 3, 1, 1);
    });
    // WOOD FLOOR
    draw(T.WFLOOR, f, (ox, oy) => {
      x.fillStyle = '#b08850'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#98744c';
      for (let j = 3; j < 16; j += 4) x.fillRect(ox, oy + j, 16, 1);
      x.fillStyle = '#8a6a3a';
      px(ox + 4, oy + 1, '#8a6a3a'); px(ox + 12, oy + 9, '#8a6a3a');
    });
    // WOOD WALL
    draw(T.WWALL, f, (ox, oy) => {
      x.fillStyle = '#8a5a2c'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#6a4420';
      for (let i = 3; i < 16; i += 4) x.fillRect(ox + i, oy, 1, 16);
      x.fillStyle = '#a8742c'; x.fillRect(ox, oy + 14, 16, 1);
      x.fillStyle = '#5c3a1a'; x.fillRect(ox, oy + 15, 16, 1);
    });
    // RUG
    draw(T.RUG, f, (ox, oy) => {
      x.fillStyle = '#a83838'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#c85050'; x.fillRect(ox + 2, oy + 2, 12, 12);
      x.fillStyle = '#f2cf4a';
      x.fillRect(ox + 4, oy + 4, 8, 1); x.fillRect(ox + 4, oy + 11, 8, 1);
      x.fillRect(ox + 4, oy + 4, 1, 8); x.fillRect(ox + 11, oy + 4, 1, 8);
    });
    // COUNTER
    draw(T.COUNTER, f, (ox, oy) => {
      x.fillStyle = '#b08850'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#caa46a'; x.fillRect(ox, oy, 16, 6);
      x.fillStyle = '#8a6a3a'; x.fillRect(ox, oy + 6, 16, 2);
      x.fillStyle = '#6a4420';
      for (let i = 3; i < 16; i += 5) x.fillRect(ox + i, oy + 8, 1, 8);
    });
    // GRAVE
    draw(T.GRAVE, f, (ox, oy) => {
      drawGrassBase(ox, oy, 113);
      x.fillStyle = '#5a6478';
      x.fillRect(ox + 4, oy + 4, 8, 10);
      x.fillRect(ox + 5, oy + 2, 6, 2);
      x.fillStyle = '#7a86a0';
      x.fillRect(ox + 5, oy + 3, 2, 9);
      x.fillStyle = '#404a5e';
      x.fillRect(ox + 6, oy + 6, 4, 1); x.fillRect(ox + 7, oy + 5, 2, 3);
      x.fillStyle = '#3e8948'; x.fillRect(ox + 3, oy + 13, 3, 2);
    });
    // POND (fairy water)
    draw(T.POND, f, (ox, oy) => {
      x.fillStyle = '#3c80e0'; x.fillRect(ox, oy, 16, 16);
      x.fillStyle = '#7ab4f4';
      const off = f === 0 ? 0 : 2;
      for (let j = 1; j < 16; j += 5) x.fillRect(ox + ((j + off) % 9), oy + j, 6, 1);
      x.fillStyle = '#dceeff';
      px(ox + (f === 0 ? 3 : 11), oy + 4, '#dceeff');
      px(ox + (f === 0 ? 12 : 5), oy + 11, '#dceeff');
    });
    // SIGN
    draw(T.SIGN, f, (ox, oy) => {
      drawGrassBase(ox, oy, 127);
      x.fillStyle = '#5c3a1a'; x.fillRect(ox + 7, oy + 8, 2, 7);
      x.fillStyle = '#8a5a2c'; x.fillRect(ox + 2, oy + 2, 12, 7);
      x.fillStyle = '#a8742c'; x.fillRect(ox + 3, oy + 3, 10, 5);
      x.fillStyle = '#5c3a1a';
      x.fillRect(ox + 4, oy + 4, 7, 1); x.fillRect(ox + 4, oy + 6, 5, 1);
    });
  }

  function drawTile(ctx, id, dx, dy, frame = 0) {
    ctx.drawImage(atlas, id * 16, (frame % FRAMES) * 16, 16, 16, dx, dy, 16, 16);
  }

  return { drawTile, atlas };
})();
