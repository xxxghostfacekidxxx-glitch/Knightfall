#!/usr/bin/env node
/**
 * Theme scaffold: use saved first-party art to draft a validated recipe.
 * Dry-run is the default. --write appends to theme-recipes.json and rebuilds
 * the variable CSS, but NEVER authorizes publishing or changes the Worker.
 * Example:
 * node scripts/scaffold-knightfall-theme.mjs --preset=moonlit_ruins --collection=moonlit-ruins --name="Moonlit Ruins" --write
 */
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url));
const get=p=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith("--")&&x.includes("=")).map(x=>{const i=x.indexOf("=");return[x.slice(2,i),x.slice(i+1)]}));
const name=String(args.name||"").trim(),preset=String(args.preset||""),collection=String(args.collection||"");
if(!/^[a-z][a-z0-9_]{2,39}$/.test(preset)||!/^[a-z][a-z0-9-]{2,45}$/.test(collection)||name.length<3||name.length>80||/[<>{}/*\\r\\n]/.test(name))
 throw Error("Provide --preset=valid_name --collection=original-art-slug --name='Readable theme name'");
if(process.argv.slice(2).some(x=>x.startsWith("--")&&!x.includes("=")&&x!=="--write"&&x!=="--json"))throw Error("Unknown argument");
const catalogPath=resolve(root,"public/assets/knightfall/theme-collections/theme-recipes.json");
const catalog=get("public/assets/knightfall/theme-collections/theme-recipes.json");
if(catalog.themes.some(x=>x.preset===preset||x.collection===collection))throw Error("Preset or collection is already registered. Existing themes cannot be overwritten.");
const paintings=get("public/assets/knightfall/theme-collections/manifest.json").assets.filter(x=>x.collection===collection);
const ornaments=get("public/assets/knightfall/theme-collections/ornaments.json").assets.filter(x=>x.collection===collection);
const required=["header","frame","divider","corner","emblem","panel","button","side-rail"];
if(!paintings.length||paintings.length>8||!required.every(role=>ornaments.some(x=>x.role===role)))
 throw Error("Save the original PNG(s) and complete eight-piece SVG ornament kit in Creator Foundry first.");
const hero=paintings.find(x=>x.role==="hero")||paintings[0],background=paintings.find(x=>x.role==="background")||hero;
const file=x=>x.path.split("/").at(-1);
const palette={accent:"#d6ac78",glow:"#a84ce8",metal:"#b4a5c8",ink:"#0b0a11",surface:"#292039",depth:"#15111e",highlight:"#f5d7f3"};
for(const key of Object.keys(palette)){
 if(args[key]!==undefined){
  if(!/^#[a-fA-F0-9]{6}$/.test(args[key]))throw Error("Invalid color "+key);
  palette[key]=args[key];
 }
}
const recipe={preset,collection,name,tag:"Original realm / custom artwork",...palette,
 heading:name,description:"An original Knightfall realm crafted from preserved paintings and scalable vector ornaments.",
 hero:file(hero),background:file(background),showcase:paintings.map(file),
 artStyle:"Original user-authorized artwork only.",legacyStandalone:false};
const summary={recipe,requiredCodeReview:[
 "Add reviewed preset metadata to backend/src/theme-crew.js",
 "Add preset ID to KNOWN and ART_KITS in public/theme-crew-runtime.js",
 "Add original PNG thumbnail to PREVIEW_ART in public/theme-crew-ui.js",
 "Run CI, deploy Worker and Pages, then publish through authorized Theme Forge"
]};
if(!process.argv.includes("--write")){
 process.stdout.write(JSON.stringify(summary,null,2)+"\n");
}else{
 catalog.themes.push(recipe);
 writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+"\n");
 const out=spawnSync(process.execPath,[resolve(root,"scripts/build-knightfall-theme-kits.mjs"),"--write"],{cwd:root,stdio:"inherit"});
 if(out.status!==0)throw Error("Theme recipe staged, but CSS generation failed. Correct the original asset inventory, rerun --write and inspect git diff.");
 process.stdout.write("Theme design staged. It is NOT approved or published until the reviewed backend, browser allowlist and thumbnail changes deploy.\n");
}
