#!/usr/bin/env node
/**
 * Knightfall artwork + Creator Foundry preservation.
 *
 * --verify : compare ALL tracked artwork and Creator Foundry sources against the
 *            pinned, immutable baseline commit. Reject unintended deletions.
 * --archive: create an inspectable, checksum-indexed archive for Actions artifacts.
 * --audit  : static verification suitable for Cloudflare Pages shallow clones.
 *
 * No network calls, third-party packages, mutable branches, secrets, or deletion.
 */
import {execFileSync,spawnSync} from "node:child_process";
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from "node:fs";
import {join,dirname,resolve,relative} from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";

export const BASELINE_COMMIT="1714af42e6ab0d7dd307a22f2a17549b1d867db7";
export const FOUNDRY_REQUIRED=Object.freeze([
 "public/devil-tools.html",
 "public/creator-foundry.js",
 "public/creator-foundry.css",
 "public/creator-foundry-workspaces.js",
 "public/creator-art-studio.js",
 "public/creator-art-studio.css",
 "public/creator-motion-preview.js",
 "public/creator-production-lab.js",
 "public/creator-production-core.mjs",
 "public/open-source-arsenal.html",
 "public/dev-toolkit.html",
 "public/chaos-visual-lab.html",
 "public/assets/knightfall/manifest.json",
 "public/knightfall-art-runtime.js",
 "backend/src/creator-art-submissions.js",
 "backend/src/creator-ideas.js",
 "docs/CREATOR-TOOLKIT.md",
 "public/creator-theme-art-gallery.js",
 "public/creator-theme-art-gallery.css",
 "public/assets/knightfall/theme-collections/manifest.json",
 "public/assets/knightfall/theme-collections/recovered-artwork-manifest.json",
 "public/assets/knightfall/theme-collections/egyptian-eclipse/egyptian-eclipse-hero.png",
 "public/assets/knightfall/theme-collections/egyptian-eclipse/egyptian-eclipse-throne-hall.png",
 "public/assets/knightfall/theme-collections/egyptian-eclipse/egyptian-eclipse-theme-preview.png",
 "public/assets/knightfall/theme-collections/dark-lord-ascendant/dark-lord-ascendant-throne-room.png",
 "public/assets/knightfall/theme-collections/dark-lord-ascendant/dark-lord-ascendant-command-chamber.png",
 "public/assets/knightfall/theme-collections/theme-selector/theme-selector-concept.png",
 "scripts/knightfall-theme-art-sources.json",
 "scripts/knightfall-theme-art-import.mjs",
 ".github/workflows/knightfall-theme-art-import.yml",
 "scripts/knightfall-theme-art.test.mjs",
 "public/egyptian-eclipse-theme.css",
 "public/knightfall-art-theme-variables.css",
 "public/knightfall-art-theme-template.css",
 "public/knightfall-art-theme-showcase.js",
 "public/assets/knightfall/theme-collections/theme-recipes.json",
 "public/assets/knightfall/theme-collections/theme-blueprint-template.json",
 "scripts/build-knightfall-theme-kits.mjs",
 "scripts/scaffold-knightfall-theme.mjs",
 "scripts/knightfall-art-themes.test.mjs",
 "scripts/egyptian-eclipse-theme.test.mjs",
 "public/assets/knightfall/theme-collections/ornaments.json",
 "public/assets/knightfall/theme-collections/egyptian-eclipse/egyptian-eclipse-temple-gateway.png",
 "public/assets/knightfall/theme-collections/dark-lord-ascendant/dark-lord-crimson-eclipse-hall.png",
 "public/assets/knightfall/theme-collections/korriban/korriban-red-necropolis.png",
 "public/assets/knightfall/theme-collections/mustafar/mustafar-obsidian-lava-citadel.png",
 "public/assets/knightfall/theme-collections/theme-selector/theme-forge-four-realm-concept.png",
 "public/assets/knightfall/theme-collections/theme-selector/theme-art-ornaments-concept.png",
 "public/assets/knightfall/theme-collections/theme-selector/creator-foundry-collection-showcase.png",
 "scripts/knightfall-theme-art-expansion-sources.json",
 "scripts/knightfall-theme-art-expansion-import.mjs",
 ".github/workflows/knightfall-theme-art-expansion-import.yml",
 "scripts/knightfall-recovered-theme-art-sources.json",
 "scripts/knightfall-recovered-theme-art-import.mjs",
 ...["arcade-anarchy","astral-dominion","jedi-sanctuary","neon-dystopia","the-asylum"].flatMap(collection=>[
  "asset-sheet.webp","environment-preview.webp","original-sheet.png",
  "header-ornament.svg","header.svg","modular-card-border.svg","modular-corner.svg","modular-panel-frame.svg"
 ].map(file=>"public/assets/knightfall/theme-collections/"+collection+"/"+file)),
 ...["egyptian-eclipse","dark-lord-ascendant","korriban","mustafar"].flatMap(collection=>
  ["header","frame","divider","corner","emblem","panel","button","side-rail"].map(role=>
   "public/assets/knightfall/theme-collections/"+collection+"/svg/"+role+".svg"))
]);
const IMAGE_EXT=/\.(?:svg|png|jpe?g|webp|avif|gif|apng|bmp|ico|tiff?|psd|aseprite|kra|ora|xcf|glb|gltf|fbx|obj|stl|woff2?)$/i;
const SCRIPT_EXT=/\.(?:html|css|js|mjs|json|webmanifest|md)$/i;
const SECRET_FILE=/(?:^|\/)(?:\.env(?:\.[^/]*)?|[^/]*\.(?:pem|key|p12|pfx)|id_rsa|credentials\.json)$/i;
const FOUNDRY_PAGES=new Set([
 "public/devil-tools.html","public/dev-toolkit.html","public/open-source-arsenal.html",
 "public/chaos-visual-lab.html","public/chaos-forge.html",
 "public/mascot-room.html","public/mascot-trials.html",
 "public/chaos-code-studio.html"
]);
const ART_CHROME=new Set([
 "public/knightfall-art-runtime.js","public/knightfall-arcade-covers.js",
 "public/knightfall-gothic-chrome.css","public/knightfall-illustrated-realms.css",
 "public/knightfall-requiem.css","public/theme-crew.css",
 "public/realm-theme-engine.css",
 "public/realm-hubs.css",
 "public/celestial-sanctum.html",
 "public/music.html",
 "public/music-rhythm-lab.js",
 "public/chatbots.html"
]);

export function isProtectedCreationPath(path){
 if(typeof path!=="string"||SECRET_FILE.test(path))return false;
 if(FOUNDRY_REQUIRED.includes(path)||FOUNDRY_PAGES.has(path)||ART_CHROME.has(path))return true;
 if(/^public\/(?:assets|icons)\//.test(path))return true;
 if(/^public\/.*\//.test(path)&&IMAGE_EXT.test(path))return true;
 if(/^public\/[^/]+$/.test(path)&&IMAGE_EXT.test(path))return true;
 if(/^public\/creator-[\w.-]+$/.test(path)&&SCRIPT_EXT.test(path))return true;
 if(/^backend\/src\/creator-[\w.-]+$/.test(path)&&SCRIPT_EXT.test(path))return true;
 if(/^docs\/(?:CREATOR|KNIGHTFALL-CINEMATIC-ART|KNIGHTFALL-APPROVED-GOTHIC|THEME-FORGE)[\w.-]*\.md$/.test(path))return true;
 return false;
}
const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runGit=args=>execFileSync("git",args,{cwd:repoRoot,encoding:"utf8",maxBuffer:48*1024*1024});
function tree(ref){
 const raw=execFileSync("git",["ls-tree","-r","-z","--name-only",ref],{cwd:repoRoot,maxBuffer:48*1024*1024});
 return raw.toString("utf8").split("\0").filter(Boolean);
}
function audit(){
 const missing=FOUNDRY_REQUIRED.filter(path=>!existsSync(join(repoRoot,path)));
 const art=join(repoRoot,"public/assets/knightfall/manifest.json");
 if(existsSync(art)){
  try{
   const manifest=JSON.parse(readFileSync(art,"utf8"));
   const sourcePaths=[manifest?.crest?.small,manifest?.crest?.large,manifest?.uiReference?.image,
    ...(manifest?.collections||[]).flatMap(x=>[x.image,x.pack])].filter(Boolean);
   for(const asset of sourcePaths){
    if(typeof asset!=="string"||!asset.startsWith("/")||!existsSync(join(repoRoot,"public",asset.slice(1))))
     missing.push("Artwork manifest reference: "+String(asset));
   }
  }catch(error){missing.push("Artwork manifest invalid: "+error.message)}
 }
 if(missing.length)throw new Error("Protected Knightfall creations absent:\n"+missing.join("\n"));
 return {foundryFiles:FOUNDRY_REQUIRED.length,manifest:"valid"};
}
function verify(){
 const originals=tree(BASELINE_COMMIT).filter(isProtectedCreationPath);
 const changedSinceBaseline=runGit(["log","--no-renames","--format=","--name-only",
  BASELINE_COMMIT+"..HEAD","--","public","backend/src","docs"]).split(/\r?\n/).map(x=>x.trim())
  .filter(isProtectedCreationPath);
 const allEverProtected=new Set([...originals,...changedSinceBaseline]);
 const current=new Set(tree("HEAD"));
 const missing=[...allEverProtected].filter(path=>!current.has(path)).sort();
 if(missing.length)throw new Error("Artwork / Creator Foundry DELETION BLOCKED ("+missing.length+"):\n"+
  missing.slice(0,100).join("\n")+
  (missing.length>100?"\n...additional missing files omitted":"")+
  "\nRestore from git history, then request explicit review before retiring any creation.");
 return {baseline:BASELINE_COMMIT,protectedAtBaseline:originals.length,
  protectedAcrossHistory:allEverProtected.size,removed:0};
}
function archive(){
 const paths=tree("HEAD").filter(isProtectedCreationPath).sort();
 const missing=paths.filter(path=>!existsSync(join(repoRoot,path)));
 if(missing.length)throw new Error("Tracked creation missing from checkout: "+missing.slice(0,12).join(", "));
 const out=join(repoRoot,"artifacts","knightfall-preservation");
 mkdirSync(out,{recursive:true});
 const inventory=paths.map(path=>{
  const buf=readFileSync(join(repoRoot,path));
  return {path,bytes:buf.length,sha256:createHash("sha256").update(buf).digest("hex")};
 });
 const head=runGit(["rev-parse","HEAD"]).trim();
 const report={schema:1,baseline:BASELINE_COMMIT,commit:head,createdAt:new Date().toISOString(),
  note:"Tracked repository artwork and Creator Foundry source only; uploaded user creations in R2/D1 or external storage require a separate backup.",
  files:inventory,totals:{count:inventory.length,bytes:inventory.reduce((n,x)=>n+x.bytes,0)}};
 writeFileSync(join(out,"inventory.json"),JSON.stringify(report,null,2)+"\n");
 const archivePath=join(out,"knightfall-artwork-and-creator-foundry.tar.gz");
 const result=spawnSync("tar",["-czf",archivePath,"--null","-T","-"],{
  cwd:repoRoot,input:paths.join("\0")+"\0",encoding:"utf8",maxBuffer:2*1024*1024
 });
 if(result.error||result.status!==0)throw new Error("Backup archive failed: "+String(result.stderr||result.error));
 if(!existsSync(archivePath)||statSync(archivePath).size===0)throw new Error("Backup archive is empty");
 const check=spawnSync("tar",["-tzf",archivePath],{encoding:"utf8",maxBuffer:48*1024*1024});
 if(check.status!==0)throw new Error("Archive integrity check failed: "+String(check.stderr));
 const archived=check.stdout.split("\n").filter(Boolean);
 if(archived.length!==paths.length||paths.some((path,i)=>archived[i]!==path))
  throw new Error("Archive file list does not match the protected source inventory");
 return {commit:head,count:paths.length,bytes:report.totals.bytes,archiveBytes:statSync(archivePath).size,
  archive:relative(repoRoot,archivePath),inventory:relative(repoRoot,join(out,"inventory.json"))};
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 try{
  const modes=new Set(process.argv.slice(2));
  const results={};
  if(modes.size===0||modes.has("--audit"))results.audit=audit();
  if(modes.has("--verify"))results.verify=verify();
  if(modes.has("--archive")){results.audit=audit();results.verify=verify();results.archive=archive()}
  if([...modes].some(mode=>!["--audit","--verify","--archive"].includes(mode)))
   throw new Error("Unknown option. Use --audit, --verify, or --archive.");
  console.log("KNIGHTFALL CREATIONS PRESERVED\n"+JSON.stringify(results,null,2));
 }catch(error){console.error("KNIGHTFALL CREATIONS PROTECTION FAILED\n"+error.stack);process.exitCode=1}
}
