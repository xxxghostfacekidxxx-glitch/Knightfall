#!/usr/bin/env node
/* Art-kit generator.  A theme recipe cannot grant publishing privileges.
 * Run --write to rebuild the static palette sheet; --check in release CI.
 * Main API and browser allowlists remain independent reviewed authority.
 */
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
function renderVariables(catalog){
 const lines=[
  "/* GENERATED from theme-recipes.json by scripts/build-knightfall-theme-kits.mjs.",
  " * Color schemes and all eight original SVG ornaments are defined per theme.",
  " * Put new presentation rules in knightfall-art-theme-template.css, not here. */"
 ];
 for(const t of catalog.themes.filter(t=>!t.legacyStandalone)){
  const base="/assets/knightfall/theme-collections/"+t.collection+"/";
  const palette={
   "--kf-realm-metal":t.metal,"--kf-realm-glow":t.glow,"--kf-realm-tint":t.surface,
   "--kf-crew-ink":t.ink,"--kf-crew-surface":t.surface,"--kf-crew-depth":t.depth,
   "--kf-crew-highlight":t.highlight,"--kf-crew-shadow":t.glow+"50","--kf-crew-accent":t.accent,
   "--kf-accent":t.accent,"--kf-accent-bright":t.highlight,
   "--kf-kit-accent":t.accent,"--kf-kit-metal":t.metal,"--kf-kit-glow":t.glow,
   "--kf-kit-ink":t.ink,"--kf-kit-surface":t.surface,"--kf-kit-depth":t.depth,
   "--kf-kit-scene":`url('${base+t.hero}')`,
   "--kf-kit-backdrop":`url('${base+t.background}')`
  };
  for(const role of ["header","frame","divider","corner","emblem","panel","button","side-rail"])
   palette["--kf-kit-"+role]=`url('${base+"svg/"+role+".svg"}')`;
  lines.push("",`/* ${t.name}: preserved original art and complete scalable ornament kit. */`,
   `html body[data-kf-realm][data-kf-theme="${t.preset}"]:not(.profile-custom-theme):not(.kf-gameplay-page){`);
  for(const [key,value]of Object.entries(palette))lines.push(" "+key+":"+value+";");
  lines.push("}");
 }
 return lines.join("\n")+"\n";
}
const root=fileURLToPath(new URL("../",import.meta.url));
const path=p=>resolve(root,p);
const catalog=JSON.parse(readFileSync(path("public/assets/knightfall/theme-collections/theme-recipes.json"),"utf8"));
const paintings=JSON.parse(readFileSync(path("public/assets/knightfall/theme-collections/manifest.json"),"utf8"));
const ornaments=JSON.parse(readFileSync(path("public/assets/knightfall/theme-collections/ornaments.json"),"utf8"));
const mode=process.argv.includes("--write")?"write":process.argv.includes("--check")?"check":null;
if(!mode||process.argv.includes("--write")&&process.argv.includes("--check"))throw Error("Usage: node scripts/build-knightfall-theme-kits.mjs --check|--write");
if(catalog.version!==1||!Array.isArray(catalog.themes)||catalog.themes.length<4)throw Error("Invalid original theme catalog");
const seen=new Set();
for(const kit of catalog.themes){
 if(!/^[a-z][a-z0-9_]{2,39}$/.test(kit.preset)||seen.has(kit.preset))throw Error("Invalid duplicate preset identifier");
 seen.add(kit.preset);
 if(!/^[a-z][a-z0-9-]{2,45}$/.test(kit.collection))throw Error("Unsafe art collection");
 if(typeof kit.name!=="string"||kit.name.length<3||kit.name.length>80||/[<>{}/*\\r\\n]/.test(kit.name)||typeof kit.heading!=="string"||kit.heading.length>100||typeof kit.description!=="string"||kit.description.length>240||typeof kit.tag!=="string"||kit.tag.length>100)throw Error("Theme title or copy outside safe bounds");
 for(const color of ["accent","glow","metal","ink","surface","depth","highlight"])
  if(typeof kit[color]!=="string"||!/^#[0-9a-fA-F]{6}$/.test(kit[color]))throw Error("Unreviewed theme color: "+kit.preset);
 if(!Array.isArray(kit.showcase)||kit.showcase.length<1||kit.showcase.length>8||!kit.showcase.includes(kit.hero))throw Error("Invalid artwork lineup");
 for(const file of [kit.hero,kit.background,...kit.showcase]){
  if(typeof file!=="string"||!/^[a-z0-9-]+\\.png$/.test(file))throw Error("Unsafe picture path");
  const p="/assets/knightfall/theme-collections/"+kit.collection+"/"+file;
  if(!paintings.assets.some(x=>x.path===p)||!existsSync(path("public"+p)))throw Error("Unpreserved original PNG: "+p);
 }
 for(const role of ["header","frame","divider","corner","emblem","panel","button","side-rail"]){
  const p="/assets/knightfall/theme-collections/"+kit.collection+"/svg/"+role+".svg";
  if(!ornaments.assets.some(x=>x.path===p)||!existsSync(path("public"+p)))throw Error("Unpreserved original SVG: "+p);
 }
}
const output=path("public/knightfall-art-theme-variables.css");
const expected=renderVariables(catalog);
if(mode==="write")writeFileSync(output,expected,"utf8");
else if(!existsSync(output)||readFileSync(output,"utf8")!==expected)throw Error("Generated palette sheet drift; run --write and inspect changes");
console.log("ART THEME TEMPLATE "+mode.toUpperCase()+" PASS:",catalog.themes.length,"reviewed recipes, each with eight preserved SVG components");
