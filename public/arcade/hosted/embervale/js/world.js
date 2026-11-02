// ============================================================
// EMBERVALE — world.js
// Maps, screens, warps, NPCs, dialog, spawn tables
// ============================================================
'use strict';

// char -> tile id
const CHAR_TILE = {
  '.': T.GRASS, ',': T.FLOWERS, 'T': T.TREE, 'W': T.WATER, 'S': T.SAND,
  'R': T.ROCK, 'B': T.BUSH, 'P': T.PATH, 'C': T.CRACK, '=': T.BRIDGE,
  'F': T.FENCE, 'H': T.HWALL, 'D': T.HDOOR, 'O': T.CAVE, 'U': T.STUMP,
  'V': T.ROOF, 's': T.SIGN, 'f': T.WATERFALL, 'p': T.POND, 'g': T.GRAVE,
  '#': T.DWALL, '_': T.DFLOOR, 'L': T.DOOR_LOCK, 'X': T.DOOR_BOSS,
  'G': T.DOOR_SHUT, '>': T.STAIRS, 'c': T.DCRACK, 't': T.TORCH, 'A': T.STATUE,
  'o': T.DOOR_OPEN, 'w': T.WFLOOR, 'h': T.WWALL, 'r': T.RUG, 'n': T.COUNTER
};

// ============================================================
// DIALOG
// ============================================================
// Text is word-wrapped automatically by the dialog renderer;
// '\n' forces a hard line break (used for signs and lists).
const DIALOG = {
  elder_pre: "AH... RUA OF THE EMBER TAIL. THE GLOOM KNIGHT STOLE THE VERDANT CROWN. OUR FORESTS WITHER.",
  elder_sword: "TAKE MY OLD BLADE. IT'S DANGEROUS TO WALK THE WILD UNARMED.",
  elder_post: "THE RUINS LIE NORTH OF THE CROSSROADS. LIGHT YOUR WAY, AND TRUST YOUR TAIL.",
  granny1: "MY KNEES ACHE WHEN GHOSTS ARE ABOUT. THE CRYPT IN THE GRAVEYARD HIDES MORE THAN BONES... IF ONLY YOU HAD A BOMB.",
  granny2: "BUSHES HIDE GEMS, DEARIE. SWING THAT SWORD AT EVERYTHING.",
  kid: "I SAW A FAIRY BY THE EAST SHORE! SHE FIXED MY SCRAPED KNEE WITH ONE WINK!",
  farmer: "THE RUINS' HALLS ARE DARK AS A BADGER'S DEN. BRING A LANTERN... OR FIND ONE INSIDE.",
  shopkeep: "FINEST WARES IN BROOKHOLLOW! WALK INTO WHAT YOU FANCY, IF YOUR POUCH JINGLES.",
  fairy: "REST, LITTLE EMBER. YOUR WOUNDS ARE MENDED.",
  sign_crossroads: "NORTH: THE HOLLOW RUINS\nWEST: BROOKHOLLOW",
  sign_meadow: "RUA'S MEADOW.\nEAST: THE GREAT BRIDGE\nNORTH: OLD RUINS",
  sign_village: "BROOKHOLLOW VILLAGE\nPOP: 4 AND A HALF",
  sign_river: "RIVER RUNS DEEP.\nBRIDGE TO THE SOUTH.",
  sign_cape: "THE SEA SHIMMERS.\nSOMEWHERE BEYOND,\nANOTHER ADVENTURE.",
  get_sword: "YOU GOT THE ELDER'S BLADE! PRESS Z TO SWING.",
  get_lantern: "YOU FOUND THE LANTERN! DARK HALLS NOW GLOW AROUND YOU.",
  get_bow: "YOU GOT THE FERN BOW! FIRE ARROWS WITH X. THE GLOOM KNIGHT'S SHIELD FEARS THEM.",
  get_bosskey: "THE GLOOM KEY... IT HUMS WITH SORROW.",
  get_key: "A SMALL KEY!",
  get_heartcont: "A HEART VESSEL! YOUR LIFE GROWS.",
  get_bombs: "BOMBS! SET THEM WITH X. CRACKED ROCK CRUMBLES.",
  get_gems: "A STASH OF GEMS!",
  get_crown: "THE VERDANT CROWN IS YOURS!"
};

// ============================================================
// SCREEN DEFINITIONS
// tiles: 11 strings of 16 chars
// enemies: [type, tx, ty]
// npcs: [{sprite, tx, ty, dialog | dialogFn, wander}]
// chests: [{tx, ty, item, n, flag, requiresClear}]
// pickups: [{tx, ty, item, n, flag}]  (persistent placed pickups)
// warps: [{tx, ty, map, sx, sy, px, py}]  (px,py in tiles)
// ============================================================

const OVERWORLD = {};
function OW(sx, sy, def) { OVERWORLD[sx + ',' + sy] = def; }

OW(0, 0, { // Lost Woods
  name: 'LOST WOODS',
  tiles: [
    'RRRRRRRRRRRRRRRR',
    'TTTT.TTTTRRRRRTT',
    'TT...,...RRORRTT',
    'TT.TT.TT..,..TTT',
    'T..TT.TTT.TT....',
    'T.,...B...TT....',
    'T.TT.TTTB.TT....',
    'TT.....TT..TTTTT',
    'TTTT.B.TTB...TTT',
    'TTTT.....TT..TTT',
    'TTTT...TTTTTTTTT'
  ],
  enemies: [['bat', 5, 8], ['slime', 2, 5]],
  warps: [{ tx: 11, ty: 2, map: 'cave_heart', px: 7, py: 8 }]
});

OW(1, 0, { // Mountainside
  name: 'MOUNTAINSIDE',
  tiles: [
    'RRRRRRRRRRRRRRRR',
    'RRRR....RRRRRRRR',
    'RR...,....RRRRRR',
    'RR.RRR...,...RRR',
    '....RR.........R',
    '......,.........',
    '..RR......RR....',
    'RRR....,..RRRRRR',
    'RRRRR...,..RRRRR',
    'RRRRRR..,..RRRRR',
    'RRRRRRR...RRRRRR'
  ],
  enemies: [['spit', 6, 5], ['spit', 9, 8], ['bat', 12, 5]]
});

OW(2, 0, { // Ruins Gate
  name: 'RUINS GATE',
  tiles: [
    'RRRRRRRRRRRRRRRR',
    'RRRRRRROORRRRRRR',
    'RR.A........A.RR',
    'RR....RRRR....RR',
    '......RRRR....RR',
    '....,......,..RR',
    '..RR........RRRR',
    'RR....,.....RRRR',
    'RRRR...,....RRRR',
    'RRRRR......RRRRR',
    'RRRRRR....RRRRRR'
  ],
  enemies: [['spit', 4, 7], ['spit', 11, 5]],
  warps: [
    { tx: 7, ty: 1, map: 'dungeon', sx: 1, sy: 2, px: 7, py: 8 },
    { tx: 8, ty: 1, map: 'dungeon', sx: 1, sy: 2, px: 8, py: 8 }
  ]
});

OW(3, 0, { // The Falls
  name: 'THE FALLS',
  tiles: [
    'RRRRRRRffRRRRRRR',
    'RRRRRRRffRRRRRRR',
    'RR....RWWR.....R',
    'R..,...WW...,..R',
    'R......WW.......',
    'R..,...WW.......',
    'R......WW.......',
    'RR.....WW.....RR',
    'RRR....WW....RRR',
    'RR..,..WW..,..RR',
    'RR...RRWWRR...RR'
  ],
  enemies: [['bat', 4, 4], ['bat', 11, 7]]
});

OW(4, 0, { // NE Cliffs
  name: 'NORTHEAST CLIFFS',
  tiles: [
    'RRRRRRRRRRRRRRRR',
    'RRRR......RRRRRR',
    'RR...RRRR...CRRR',
    'RR.,.......,...R',
    '......RR.......R',
    '....RR....RR...R',
    '......RR.......R',
    'RR...........RRR',
    'RRRR..,..,..RRRR',
    'RRRRR.......RRRR',
    'RRRRRR...RRRRRRR'
  ],
  enemies: [['bat', 5, 7], ['bat', 10, 4], ['spit', 7, 8]],
  warps: [{ tx: 12, ty: 2, map: 'cave_gems', px: 7, py: 8, needsOpen: true }]
});

OW(0, 1, { // Western Woods
  name: 'WESTERN WOODS',
  tiles: [
    'TTTT...TTTTTTTTT',
    'TT.........TTTTT',
    'T...B...B......T',
    'T..TT......TT..T',
    'T....,..........',
    'T...............',
    'T....B....B.....',
    'TT.......TT....T',
    'TTT..B......,..T',
    'TTT.........TTTT',
    'TTTTTT...TTTTTTT'
  ],
  enemies: [['slime', 5, 3], ['slime', 9, 6], ['slime', 3, 7]]
});

OW(1, 1, { // Crossroads
  name: 'CROSSROADS',
  tiles: [
    'RRRRRRR...RRRRRR',
    'TT.....PPP....TT',
    'T...,..PPP..,..T',
    'T..B...PPP.....T',
    '.......PPP......',
    'PPPPPPPPPPPPPPPP',
    '.......PPP......',
    'T.s....PPP..B..T',
    'T..,...PPP.....T',
    'TT.....PPP....TT',
    'TTTTTTTPPPTTTTTT'
  ],
  enemies: [['slime', 3, 3], ['spit', 12, 8], ['slime', 12, 2]],
  signs: [{ tx: 2, ty: 7, text: DIALOG.sign_crossroads }]
});

OW(2, 1, { // North Field
  name: 'NORTH FIELD',
  tiles: [
    'RRRRRR....RRRRRR',
    'TT.....PP.....TT',
    'T..,......,....T',
    'T.....B........T',
    '......B.B.......',
    '.......PP.......',
    '................',
    'T...B......B...T',
    'T....,.....,...T',
    'TT.....PP.....TT',
    'TTTTTT.PP.TTTTTT'
  ],
  enemies: [['spit', 4, 3], ['spit', 11, 7], ['slime', 8, 3], ['bat', 12, 4]]
});

OW(3, 1, { // Riverside
  name: 'RIVERSIDE',
  tiles: [
    'RR...RRWWRR...RR',
    'TT.....WW.....TT',
    'T...s..WW..,...T',
    'T......WW......T',
    '.......WW.......',
    '.......WW.......',
    '.......WW.......',
    'T..,...WW...,..T',
    'T......WW......T',
    'TT.....WW.....TT',
    'TT...RRWWRR...TT'
  ],
  enemies: [['spit', 3, 5], ['slime', 12, 7]],
  signs: [{ tx: 4, ty: 2, text: DIALOG.sign_river }]
});

OW(4, 1, { // Lakeside
  name: 'LAKESIDE',
  tiles: [
    'RRRRRR...RRRRRRR',
    'TT............WW',
    'T....,....WWWWWW',
    'T........WWWWWWW',
    '.........WWWWWWW',
    '........WWWWWWWW',
    '.........WWWWWWW',
    'T....B....WWWWWW',
    'T..,.......WWWWW',
    'TT...........WWW',
    'TTTTTT...TTTTTWW'
  ],
  enemies: [['bat', 4, 6], ['bat', 12, 1], ['spit', 3, 8]]
});

OW(0, 2, { // Sword Cave Hollow
  name: 'QUIET HOLLOW',
  tiles: [
    'TTTTTT...TTTTTTT',
    'TRRRRR....,...TT',
    'TRRORR.........T',
    'T..,.......RR..T',
    'T...............',
    'T...,...........',
    'T.....B.........',
    'TT........B....T',
    'TT.....,.......T',
    'TTT..........TTT',
    'TTTT...TTTTTTTTT'
  ],
  enemies: [['slime', 9, 7]],
  warps: [{ tx: 3, ty: 2, map: 'cave_elder', px: 7, py: 8 }]
});

OW(1, 2, { // Brookhollow Village
  name: 'BROOKHOLLOW',
  tiles: [
    'TTTTTTTPPPTTTTTT',
    'T......PPP.....T',
    'T.VVVV.PPPVVVV.T',
    'T.VVVV.PPPVVVV.T',
    '..HHDH.PPPHDHH..',
    '..F....PPP....F.',
    '..s....PPP....,.',
    'T.F.F..PPP.F.F.T',
    'T..,...PPP..,..T',
    'TT.....PPP....TT',
    'TTTTTTTPPPTTTTTT'
  ],
  npcs: [{ sprite: 'kid', tx: 12, ty: 7, dialog: 'kid', wander: true }],
  signs: [{ tx: 2, ty: 6, text: DIALOG.sign_village }],
  warps: [
    { tx: 4, ty: 4, map: 'shop', px: 7, py: 8 },
    { tx: 11, ty: 4, map: 'house_granny', px: 7, py: 8 }
  ]
});

OW(2, 2, { // START — Rua's Meadow
  name: "RUA'S MEADOW",
  tiles: [
    'TTTTTT.PP.TTTTTT',
    'TT.....PP.....TT',
    'T..,...PP...,..T',
    'T......PP..B...T',
    '.......PP.......',
    'PPPPPPPPPPPPPPPP',
    '......s.........',
    'T...B......B...T',
    'T..............T',
    'TT....,..,....TT',
    'TTTTTT...TTTTTTT'
  ],
  enemies: [['slime', 3, 8], ['slime', 12, 3]],
  signs: [{ tx: 6, ty: 6, text: DIALOG.sign_meadow }]
});

OW(3, 2, { // Great Bridge
  name: 'THE GREAT BRIDGE',
  tiles: [
    'TT...RRWWRR...TT',
    'T......WW......T',
    'T..,...WW...,..T',
    'T......WW......T',
    'PPPPPPP==PPPPPPP',
    'PPPPPPP==PPPPPPP',
    'PPPPPPP==PPPPPPP',
    'T......WW......T',
    'T..,...WW......T',
    'TT.....WW.....TT',
    'TT...RRWWRR...TT'
  ],
  enemies: [['spit', 12, 2], ['spit', 3, 8], ['bat', 12, 8]]
});

OW(4, 2, { // Glimmer Shore (fairy pond)
  name: 'GLIMMER SHORE',
  music: 'fairy',
  tiles: [
    'TTTTTT...TTTTTWW',
    'T.....,......WWW',
    'T...pppp....WWWW',
    'T...pppp....WWWW',
    '....pppp....WWWW',
    '............WWWW',
    '....,.......WWWW',
    'T..........WWWWW',
    'T.SSS.....WWWWWW',
    'TTSSS....WWWWWWW',
    'TTTTTT...TTTWWWW'
  ],
  npcs: [{ sprite: 'fairy_npc', tx: 5, ty: 5, dialog: 'fairy', fairy: true, float: true }]
});

OW(0, 3, { // South Thicket
  name: 'SOUTH THICKET',
  tiles: [
    'TTTT...TTTTTTTTT',
    'TT....,.....TTTT',
    'T..B...B...B...T',
    'T....B.....B...T',
    'T...B...B.......',
    'T.,....B....,...',
    'T..B...B...B....',
    'TT....B....B...T',
    'T...,......,...T',
    'TSS..........SST',
    'WWWWWWWWWWWWWWWW'
  ],
  enemies: [['slime', 5, 5], ['slime', 10, 3], ['slimeR', 8, 7]]
});

OW(1, 3, { // Farm
  name: 'FERNWICK FARM',
  tiles: [
    'TTTTTTTPPPTTTTTT',
    'T......PPP.....T',
    'T.FFFF.PPPFFFF.T',
    'T.,,,,.PPP,,,,.T',
    '..,,,,.PPP,,,,..',
    '................',
    '..,,,,....,,,,..',
    'T.FFFF....FFFF.T',
    'T..............T',
    'TSS..........SST',
    'WWWWWWWWWWWWWWWW'
  ],
  npcs: [{ sprite: 'shopkeep', tx: 10, ty: 5, dialog: 'farmer', wander: true }],
  enemies: [['slime', 4, 8]]
});

OW(2, 3, { // Graveyard
  name: 'WHISPER GRAVES',
  tiles: [
    'TTTTTT...TTTTTTT',
    'T..............T',
    'T.FF.g.g.g.FF..T',
    'T..............T',
    '....g.g.C.g.....',
    '................',
    '....g.g...g.....',
    'T..............T',
    'T.,.g.g.g.g..,.T',
    'TSS..........SST',
    'WWWWWWWWWWWWWWWW'
  ],
  enemies: [['ghost', 4, 3], ['ghost', 11, 6], ['ghost', 7, 7]],
  warps: [{ tx: 8, ty: 4, map: 'cave_crypt', px: 7, py: 8, needsOpen: true }]
});

OW(3, 3, { // River Mouth
  name: 'RIVER MOUTH',
  tiles: [
    'TT...RRWWRR...TT',
    'T......WW......T',
    'T..,...WW....,.T',
    'T......WW......T',
    'S......WW......S',
    'PPPPPPP==PPPPPPP',
    'S......WW......S',
    'SS.....WW.....SS',
    'SSS....WW....SSS',
    'SSSS...WW...SSSS',
    'WWWWWWWWWWWWWWWW'
  ],
  enemies: [['spit', 4, 7], ['spit', 11, 7]]
});

OW(4, 3, { // Cape
  name: 'SALTWHISKER CAPE',
  tiles: [
    'TTTTTT...TTTWWWW',
    'T...........WWWW',
    'T..,......,.WWWW',
    'T..........WWWWW',
    '...........WWWWW',
    '..........WWWWWW',
    '.....s....WWWWWW',
    'TSSS......WWWWWW',
    'TSSSSS...WWWWWWW',
    'TSSSSSSSWWWWWWWW',
    'WWWWWWWWWWWWWWWW'
  ],
  enemies: [['spit', 4, 4], ['spit', 8, 7]],
  signs: [{ tx: 5, ty: 6, text: DIALOG.sign_cape }]
});

// ============================================================
// DUNGEON — THE HOLLOW RUINS (4 x 3 rooms)
// ============================================================
const DUNGEON = {};
function DG(sx, sy, def) { DUNGEON[sx + ',' + sy] = def; }

DG(1, 2, { // Entrance
  name: 'THE HOLLOW RUINS',
  tiles: [
    '#######LL#######',
    '#t____________t#',
    '#______________#',
    '#__A________A__#',
    'o______________o',
    'o______________o',
    'o______________o',
    '#__A________A__#',
    '#t____________t#',
    '#______________#',
    '#######>>#######'
  ],
  warps: [
    { tx: 7, ty: 10, map: 'overworld', sx: 2, sy: 0, px: 7, py: 2 },
    { tx: 8, ty: 10, map: 'overworld', sx: 2, sy: 0, px: 8, py: 2 }
  ]
});

DG(0, 2, { // Skeleton Gate
  tiles: [
    '#######GG#######',
    '#t____________t#',
    '#___##____##___#',
    '#______________#',
    '#______________G',
    '#______________G',
    '#______________G',
    '#___##____##___#',
    '#t____________t#',
    '#______________#',
    '################'
  ],
  enemies: [['skel', 4, 3], ['skel', 8, 6], ['skel', 11, 3]],
  chests: [{ tx: 2, ty: 5, item: 'key', flag: 'chest_d02' }]
});

DG(0, 1, { // Dark Maze
  dark: true,
  tiles: [
    '#######oo#######',
    '#__#________#__#',
    '#______________#',
    '#__A__#__A__#__#',
    '#______________#',
    '#___#_____#____#',
    '#______________#',
    '#__#__A__#__A__#',
    '#______________#',
    '#t____________t#',
    '#######oo#######'
  ],
  enemies: [['bat', 4, 2], ['bat', 11, 6], ['ghost', 8, 4]]
});

DG(0, 0, { // Key Room
  dark: true,
  tiles: [
    '################',
    '#t____________t#',
    '#_____####_____#',
    '#______________#',
    '#___A______A___#',
    '#______________#',
    '#______________#',
    '#___A______A___#',
    '#t____________t#',
    '#______________#',
    '#######oo#######'
  ],
  enemies: [['skel', 3, 6], ['skel', 12, 6]],
  chests: [{ tx: 7, ty: 5, item: 'key', flag: 'chest_d00' }]
});

DG(1, 1, { // Locked Hall
  tiles: [
    '#######XX#######',
    '#t____________t#',
    '#__A________A__#',
    '#______________#',
    '#______________o',
    '#______________o',
    '#______________o',
    '#______________#',
    '#__A________A__#',
    '#t____________t#',
    '#######LL#######'
  ],
  enemies: [['spit', 4, 4], ['spit', 11, 7], ['skel', 8, 3]]
});

DG(2, 1, { // Miniboss — Royal Slime
  tiles: [
    '#######oo#######',
    '#t____________t#',
    '#______________#',
    '#______________#',
    'G______________#',
    'G______________L',
    'G______________#',
    '#______________#',
    '#______________#',
    '#t____________t#',
    '################'
  ],
  enemies: [['bigslime', 8, 5]],
  chests: [{ tx: 7, ty: 3, item: 'bow', flag: 'chest_bow', requiresClear: true }]
});

DG(3, 1, { // Boss Key Room
  tiles: [
    '#######oo#######',
    '#t____________t#',
    '#__#________#__#',
    '#______________#',
    '#______________#',
    'L______________#',
    '#______________#',
    '#______________#',
    '#__#________#__#',
    '#t____________t#',
    '#######cc#######'
  ],
  enemies: [['ghost', 4, 3], ['ghost', 11, 7], ['skel', 8, 2]],
  chests: [{ tx: 12, ty: 5, item: 'bosskey', flag: 'chest_bosskey' }]
});

DG(3, 2, { // Gem Vault
  tiles: [
    '#######cc#######',
    '#t____________t#',
    '#______________#',
    '#___#______#___#',
    'o______________#',
    'o______________#',
    'o______________#',
    '#___#______#___#',
    '#______________#',
    '#t____________t#',
    '################'
  ],
  enemies: [['skel', 4, 2], ['skel', 11, 8], ['bat', 8, 5]],
  chests: [{ tx: 11, ty: 5, item: 'gems', n: 30, flag: 'chest_d32' }]
});

DG(2, 2, { // Bat Hall — lantern
  tiles: [
    '################',
    '#t____________t#',
    '#__#________#__#',
    '#______________#',
    'G______________G',
    'G______________G',
    'G______________G',
    '#______________#',
    '#__#________#__#',
    '#t____________t#',
    '################'
  ],
  enemies: [['bat', 3, 3], ['bat', 12, 3], ['bat', 4, 7], ['bat', 11, 7]],
  chests: [{ tx: 7, ty: 5, item: 'lantern', flag: 'chest_lantern', requiresClear: true }]
});

DG(1, 0, { // BOSS — Gloom Knight
  boss: true,
  tiles: [
    '################',
    '#t____________t#',
    '#______________#',
    '#t____________t#',
    '#______________#',
    '#______________#',
    '#______________#',
    '#t____________t#',
    '#______________#',
    '#______________#',
    '#######XX#######'
  ],
  enemies: [['boss', 8, 3]]
});

DG(2, 0, { // Gloom Hall
  dark: true,
  tiles: [
    '################',
    '#t____________t#',
    '#__A________A__#',
    '#______________#',
    '#______________o',
    '#______________o',
    '#______________o',
    '#______________#',
    '#__A________A__#',
    '#t____________t#',
    '#######oo#######'
  ],
  enemies: [['ghost', 5, 3], ['ghost', 10, 7], ['bat', 8, 5]],
  chests: [{ tx: 3, ty: 5, item: 'gems', n: 20, flag: 'chest_d20' }]
});

DG(3, 0, { // Heart Room
  dark: true,
  tiles: [
    '################',
    '#t____________t#',
    '#_____####_____#',
    '#______________#',
    'o______________#',
    'o______________#',
    'o______________#',
    '#______________#',
    '#t____________t#',
    '#______________#',
    '#######oo#######'
  ],
  enemies: [['skel', 4, 6], ['skel', 11, 6]],
  chests: [{ tx: 7, ty: 3, item: 'heartcont', flag: 'chest_d30' }]
});

// ============================================================
// INTERIORS (single-screen maps)
// ============================================================
const INTERIORS = {
  cave_elder: {
    music: 'house',
    tiles: [
      '################',
      '#t____________t#',
      '#______________#',
      '#______________#',
      '#______________#',
      '#______________#',
      '#______________#',
      '#t____________t#',
      '#______________#',
      '#______________#',
      '#######>>#######'
    ],
    npcs: [{ sprite: 'elder', tx: 7, ty: 3, dialog: 'elder' }],
    warps: [
      { tx: 7, ty: 10, map: 'overworld', sx: 0, sy: 2, px: 3, py: 3 },
      { tx: 8, ty: 10, map: 'overworld', sx: 0, sy: 2, px: 3, py: 3 }
    ]
  },
  cave_heart: {
    music: 'dungeon',
    tiles: [
      '################',
      '#t____________t#',
      '#______________#',
      '#___#______#___#',
      '#______________#',
      '#______________#',
      '#___#______#___#',
      '#t____________t#',
      '#______________#',
      '#______________#',
      '#######>>#######'
    ],
    enemies: [['slimeR', 4, 4], ['slimeR', 11, 4]],
    chests: [{ tx: 7, ty: 2, item: 'heartcont', flag: 'chest_woods' }],
    warps: [
      { tx: 7, ty: 10, map: 'overworld', sx: 0, sy: 0, px: 11, py: 3 },
      { tx: 8, ty: 10, map: 'overworld', sx: 0, sy: 0, px: 11, py: 3 }
    ]
  },
  cave_gems: {
    music: 'dungeon',
    tiles: [
      '################',
      '#t____________t#',
      '#______________#',
      '#______________#',
      '#______________#',
      '#______________#',
      '#______________#',
      '#t____________t#',
      '#______________#',
      '#______________#',
      '#######>>#######'
    ],
    pickups: [
      { tx: 4, ty: 3, item: 'gem_big', flag: 'gg1' }, { tx: 7, ty: 2, item: 'gem_big', flag: 'gg2' },
      { tx: 11, ty: 3, item: 'gem_big', flag: 'gg3' }, { tx: 5, ty: 5, item: 'gem', flag: 'gg4' },
      { tx: 8, ty: 5, item: 'gem', flag: 'gg5' }, { tx: 10, ty: 5, item: 'gem', flag: 'gg6' }
    ],
    warps: [
      { tx: 7, ty: 10, map: 'overworld', sx: 4, sy: 0, px: 12, py: 3 },
      { tx: 8, ty: 10, map: 'overworld', sx: 4, sy: 0, px: 12, py: 3 }
    ]
  },
  cave_crypt: {
    music: 'dungeon',
    dark: true,
    tiles: [
      '################',
      '#t____________t#',
      '#______________#',
      '#___#______#___#',
      '#______________#',
      '#______________#',
      '#___#______#___#',
      '#t____________t#',
      '#______________#',
      '#______________#',
      '#######>>#######'
    ],
    enemies: [['ghost', 5, 3], ['ghost', 10, 3]],
    chests: [{ tx: 7, ty: 2, item: 'gems', n: 25, flag: 'chest_crypt' }],
    pickups: [{ tx: 4, ty: 5, item: 'gem_big', flag: 'cg1' }, { tx: 11, ty: 5, item: 'gem_big', flag: 'cg2' }],
    warps: [
      { tx: 7, ty: 10, map: 'overworld', sx: 2, sy: 3, px: 8, py: 5 },
      { tx: 8, ty: 10, map: 'overworld', sx: 2, sy: 3, px: 8, py: 5 }
    ]
  },
  shop: {
    music: 'house',
    tiles: [
      'hhhhhhhhhhhhhhhh',
      'hwwwwwwwwwwwwwwh',
      'hwwnnnnnnnnnnwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwrrwwwwwwh',
      'hhhhhhhrrhhhhhhh'
    ],
    npcs: [{ sprite: 'shopkeep', tx: 7, ty: 1, dialog: 'shopkeep' }],
    shopItems: [
      { tx: 4, ty: 4, item: 'bombs', n: 4, price: 20, label: 'BOMBS' },
      { tx: 7, ty: 4, item: 'heartcont', price: 80, label: 'LIFE', flag: 'shop_heart' },
      { tx: 11, ty: 4, item: 'arrows', n: 10, price: 15, label: 'ARROWS' }
    ],
    warps: [
      { tx: 7, ty: 10, map: 'overworld', sx: 1, sy: 2, px: 4, py: 5 },
      { tx: 8, ty: 10, map: 'overworld', sx: 1, sy: 2, px: 4, py: 5 }
    ]
  },
  house_granny: {
    music: 'house',
    tiles: [
      'hhhhhhhhhhhhhhhh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwrrrrrrrrwwwh',
      'hwwwrrrrrrrrwwwh',
      'hwwwrrrrrrrrwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hwwwwwwwwwwwwwwh',
      'hhhhhhhrrhhhhhhh'
    ],
    npcs: [{ sprite: 'granny', tx: 5, ty: 4, dialog: 'granny' }],
    warps: [
      { tx: 7, ty: 10, map: 'overworld', sx: 1, sy: 2, px: 11, py: 5 },
      { tx: 8, ty: 10, map: 'overworld', sx: 1, sy: 2, px: 11, py: 5 }
    ]
  }
};

// ============================================================
// WORLD ACCESS
// ============================================================
const MAPS = {
  overworld: { grid: OVERWORLD, w: 5, h: 4, music: 'overworld', outdoor: true },
  dungeon: { grid: DUNGEON, w: 4, h: 3, music: 'dungeon' }
};

function getScreenDef(map, sx, sy) {
  if (map === 'overworld' || map === 'dungeon') return MAPS[map].grid[sx + ',' + sy] || null;
  return INTERIORS[map] || null;
}

function mapMusic(map, screenDef) {
  if (screenDef && screenDef.music) return screenDef.music;
  if (MAPS[map]) return MAPS[map].music;
  return 'dungeon';
}

// validate maps at boot (console only)
(function validateMaps() {
  const all = [];
  for (const k in OVERWORLD) all.push(['overworld ' + k, OVERWORLD[k]]);
  for (const k in DUNGEON) all.push(['dungeon ' + k, DUNGEON[k]]);
  for (const k in INTERIORS) all.push(['interior ' + k, INTERIORS[k]]);
  let bad = 0;
  for (const [name, def] of all) {
    if (def.tiles.length !== 11) { console.error('MAP ' + name + ': has ' + def.tiles.length + ' rows'); bad++; }
    def.tiles.forEach((row, j) => {
      if (row.length !== 16) { console.error('MAP ' + name + ' row ' + j + ': len ' + row.length + ' "' + row + '"'); bad++; }
      for (const ch of row) if (!(ch in CHAR_TILE)) { console.error('MAP ' + name + ' row ' + j + ': bad char "' + ch + '"'); bad++; }
    });
  }
  if (!bad) console.log('[world] all maps valid');
})();
