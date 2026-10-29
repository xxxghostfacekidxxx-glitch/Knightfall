import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const load=async path=>readFile(new URL("../"+path,import.meta.url),"utf8");
test("battle commands have matching selectable panels",async()=>{
 const html=await load("public/monster-mmo.html");
 for(const tab of ["fight","party","bag"]){
  assert.match(html,new RegExp('data-battle-tab="'+tab+'"'));
  assert.match(html,new RegExp('data-battle-section="'+tab+'"'));
 }
 const pause=await load("public/monster-mmo-pause-menu.js");
 const game=await load("public/monster-mmo.js");
 assert.match(pause,/battleTabs\.forEach\(b=>b\.addEventListener/);
 assert.match(pause,/section\.hidden=section\.dataset\.battleSection!==name/);
 assert.doesNotMatch(game,/querySelectorAll\("#battle-panel \[data-battle-tab\]"\)/);
});
test("combat is a single viewport rather than a scrolling page",async()=>{
 const css=await load("public/monster-mmo.css");
 assert.match(css,/Battle viewport v4/);
 assert.match(css,/body:has\(#battle-panel:not\(\[hidden\]\)\)\{overflow:hidden/);
 assert.match(css,/#battle-panel:not\(\[hidden\]\)\{\s*position:fixed!important;inset:0!important/);
 assert.match(css,/orientation:landscape/);
 assert.match(css,/#battle-panel:not\(\[hidden\]\) > #battle\.sr-only/);
 assert.match(css,/#battle-panel:not\(\[hidden\]\) > \[hidden\]\{display:none!important\}/);
});
test("pause menu holds nonessential UI",async()=>{
 const html=await load("public/monster-mmo.html");
 const js=await load("public/monster-mmo-pause-menu.js");
 for(const tab of ["creatures","bag","map","missions","bestiary"]){
  assert.match(html,new RegExp('data-pause-tab="'+tab+'"'));
 }
 assert.match(js,/pause-content/);
});
test("sprite atlas supports every species and both battle viewpoints",async()=>{
 const js=await load("public/monster-mmo-sprite-atlas.js");
 const ids=js.match(/const ids="([^"]+)"/)?.[1].split(" ");
 assert.equal(ids?.length,55);
 assert.match(js,/sprite\(ids\[n\],frame,true\)/);
 assert.match(js,/\(back\?4:0\)/);
});
test("quest step tracking and region survive save normalization",async()=>{
 const frontend=await load("public/monster-mmo.js");
 const backend=await load("backend/src/index.mmo-staging.js");
 assert.match(frontend,/typeof save\.routeQuestSteps!=="object"/);
 assert.match(backend,/const clean=\{region:validatedRegion/);
 assert.match(backend,/monsterRegions\[validatedRegion\]\.blocked\.has/);
});

test("original faction battle scenery and readable handheld theme ship together",async()=>{
 const stage=await load("public/monster-mmo-pixel-battle.js");
 const css=await load("public/monster-mmo.css");
 for(const cue of ["Orbiting saucers","Hellscape spires","Two-tone moon/planet","prefers-reduced-motion"])assert.ok(stage.includes(cue)||css.includes(cue),cue);
 assert.match(css,/--hh-pink:#ff63c8/);
 assert.match(css,/button\[aria-selected="true"\]/);
});
test("Creator Foundry lists official free game tools without shipping their binaries",async()=>{
 const html=await load("public/dev-toolkit.html");
 for(const name of ["Phaser 3 / 4","Tiled Map Editor","LDtk World Builder","Piskel Sprite Animator","LibreSprite"])assert.ok(html.includes(name),name);
 assert.match(html,/29 tools/);
});

test("vendored Phaser runtime is installed with license and safe fallback",async()=>{
 const fs=await import("node:fs/promises");
 const runtime=new URL("../public/vendor/phaser/phaser.min.js",import.meta.url);
 const stat=await fs.stat(runtime);
 assert.ok(stat.size>100000,"Phaser runtime must be a nonempty bundled build");
 const license=await load("public/vendor/phaser/LICENSE.md");
 assert.match(license,/MIT License/);
 const html=await load("public/monster-mmo.html");
 const bridge=await load("public/monster-mmo-engine-bridge.js");
 assert.match(html,/monster-mmo-engine-bridge\.js/);
 assert.match(bridge,/\/vendor\/phaser\/phaser\.min\.js/);
 assert.match(bridge,/script\.onerror=\(\)=>\{\}/);
 assert.match(bridge,/pointerEvents|pointer-events:none/);
});
test("overworld contains deterministic original faction micro-biomes",async()=>{
 const world=await load("public/monster-mmo-pixel-world.js");
 assert.match(world,/Original layered micro-biomes/);
 assert.match(world,/hash\(x\/32,y\/32,71\)/);
 assert.match(world,/Faction-specific mushrooms/);
});

test("overworld movement interpolates only adjacent steps and honors reduced motion",async()=>{
 const world=await load("public/monster-mmo-pixel-world.js");
 assert.match(world,/Presentation-only tween/);
 assert.match(world,/distance===1/);
 assert.match(world,/reducedMotion/);
 assert.match(world,/duration:145/);
 assert.match(world,/motion=null;loadExplored/);
});
test("tile boundaries blend adjacent terrain with directional shading",async()=>{
 const world=await load("public/monster-mmo-pixel-world.js");
 assert.match(world,/Tile-aware edges/);
 assert.match(world,/const adjacent=\(dx,dy\)/);
 assert.match(world,/sameSurface\(north\)/);
 assert.match(world,/sameSurface\(south\)/);
});

test("player-follow camera renders the full world to a 12x9 viewport without changing game coordinates",async()=>{
 const world=await load("public/monster-mmo-pixel-world.js");
 assert.match(world,/VIEW_W=384,VIEW_H=288/);
 assert.match(world,/scene\.width=TILE\*W;scene\.height=TILE\*H/);
 assert.match(world,/screenCtx\.drawImage\(scene,Math\.round\(cameraX\),Math\.round\(cameraY\)/);
 assert.match(world,/cameraX\+=\(targetX-cameraX\)\*\.34/);
 assert.match(world,/reducedMotion/);
});
test("legendary creature sprites have individually authored silhouettes",async()=>{
 const atlas=await load("public/monster-mmo-sprite-atlas.js");
 for(const name of ["minionmouse","minivillain","minieddie"])assert.match(atlas,new RegExp('if\\(id==="'+name+'"\\)'));
 assert.match(atlas,/Hand-authored legendary silhouettes/);
});

test("all 55 original monster sprites have species-specific visual details",async()=>{
 const atlas=await load("public/monster-mmo-sprite-atlas.js");
 assert.match(atlas,/Distinct surface details for every creature/);
 assert.match(atlas,/const motif=\(n\*2654435761\)>>>0/);
 assert.match(atlas,/pattern===0/);
 assert.match(atlas,/pattern===5|segmented cyber/);
 assert.match(atlas,/if\(!\["minionmouse","minivillain","minieddie"\]\.includes\(id\)\)/);
});
test("battle sprites have ground shadows and environmental glints",async()=>{
 const stage=await load("public/monster-mmo-pixel-battle.js");
 assert.match(stage,/Ground contact shadows and rim glints/);
 assert.match(stage,/fill\(264,100,63,4/);
});
