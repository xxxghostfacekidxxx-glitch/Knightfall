import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
import {isProtectedCreationPath,FOUNDRY_REQUIRED} from "./knightfall-creation-preserve.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
const read=path=>readFileSync(resolve(root,path),"utf8");
const manifest=JSON.parse(read("public/assets/knightfall/theme-collections/manifest.json"));
const ornaments=JSON.parse(read("public/assets/knightfall/theme-collections/ornaments.json"));
const originals=JSON.parse(read("scripts/knightfall-theme-art-sources.json"));
const expansion=JSON.parse(read("scripts/knightfall-theme-art-expansion-sources.json"));
const sha256=bytes=>createHash("sha256").update(bytes).digest("hex");

test("13 original PNG illustrations and concept paintings remain preserved byte-for-byte",()=>{
 assert.equal(manifest.id,"knightfall-2026-11-20-premium-theme-art");
 assert.equal(manifest.assets.length,13);
 assert.equal(originals.assets.length,6);
 assert.equal(expansion.assets.length,7);
 const expectedCollections={"egyptian-eclipse":4,"dark-lord-ascendant":3,"korriban":1,"mustafar":1,"theme-selector":4};
 const observed={};
 const sourceItems=[...originals.assets,...expansion.assets];
 const paths=new Set(),ids=new Set();
 for(const item of manifest.assets){
  assert.match(item.path,/^\/assets\/knightfall\/theme-collections\/[a-z0-9-]+\/[a-z0-9-]+\.png$/);
  const local="public"+item.path;
  assert.ok(!paths.has(local)&&!ids.has(item.id),"Duplicate original registered "+item.id);
  paths.add(local);ids.add(item.id);
  assert.ok(existsSync(resolve(root,local)),"First-party original missing: "+local);
  assert.equal(isProtectedCreationPath(local),true,"Artwork not in Creations Vault: "+local);
  assert.ok(FOUNDRY_REQUIRED.includes(local),"Artwork not in required preservation list: "+local);
  const bytes=readFileSync(resolve(root,local));
  assert.equal(bytes.length,item.bytes,"Original PNG size changed: "+local);
  assert.equal(sha256(bytes),item.sha256,"Original PNG content changed: "+local);
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16),item.width);
  assert.equal(bytes.readUInt32BE(20),item.height);
  const source=sourceItems.find(x=>x.id===item.id);
  assert.ok(source,"Unknown PNG entered approved art manifest: "+item.id);
  for(const key of ["sha256","bytes","width","height","collection"])assert.equal(item[key],source[key],item.id+" source mismatch");
  observed[item.collection]=(observed[item.collection]||0)+1;
 }
 assert.deepEqual(observed,expectedCollections);
});

test("32 custom original SVGs have valid same-origin paths, safe markup, and complete UI roles",()=>{
 assert.equal(ornaments.id,"knightfall-original-theme-ornaments");
 assert.equal(ornaments.assets.length,32);
 const roles=["header","frame","divider","corner","emblem","panel","button","side-rail"];
 const count={};
 const paths=new Set();
 for(const item of ornaments.assets){
  assert.match(item.path,/^\/assets\/knightfall\/theme-collections\/(?:egyptian-eclipse|dark-lord-ascendant|korriban|mustafar)\/svg\/(?:header|frame|divider|corner|emblem|panel|button|side-rail)\.svg$/);
  assert.ok(!paths.has(item.path),"SVG ornament path is duplicated "+item.path);
  paths.add(item.path);
  const local="public"+item.path;
  assert.ok(existsSync(resolve(root,local)),"Vector art missing: "+local);
  assert.ok(isProtectedCreationPath(local),"Vector art not protected: "+local);
  assert.ok(FOUNDRY_REQUIRED.includes(local),"Vector art not in deletion prevention list: "+local);
  const art=read(local);
  assert.match(art,/^<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*viewBox="0 0 \d+ \d+"/);
  assert.match(art,/<title\b/);
  assert.match(art,/<desc\b/);
  assert.match(art,/<linearGradient\b/);
  assert.match(art,/<symbol id="sigil"/);
  assert.match(art,/<use href="#sigil"/);
  assert.match(art,/<\/svg>\s*$/);
  assert.doesNotMatch(art,/<(?:script|foreignObject|iframe)\b|on(?:load|error|click)\s*=|href=["'](?:https?:|data:)/i);
  const k=item.collection;
  count[k]??=[];
  count[k].push(item.role);
 }
 for(const c of ["egyptian-eclipse","dark-lord-ascendant","korriban","mustafar"])
  assert.deepEqual(count[c].sort(),[...roles].sort(),"Missing or duplicate SVG ornaments in "+c);
});

test("Creator Foundry discovers the four complete collections, both formats, and original export tools",()=>{
 const html=read("public/devil-tools.html");
 assert.match(html,/id="theme-art-collection" data-workspace hidden/);
 assert.match(html,/href="#theme-art-collection" data-workspace-search/);
 assert.match(html,/id="kf-theme-art-gallery"/);
 for(const c of ["egyptian-eclipse","dark-lord-ascendant","korriban","mustafar","theme-selector"])
  assert.ok(html.includes('data-collection="'+c+'"'),"Missing Foundry filter "+c);
 for(const ext of ["png","svg"])assert.ok(html.includes('data-format="'+ext+'"'));
 assert.match(html,/creator-theme-art-gallery\.css\?v=/);
 assert.match(html,/creator-theme-art-gallery\.js\?v=/);
 assert.match(read("public/creator-foundry.js"),/workshop\.querySelectorAll\("\[data-workspace\]"\)/);
 assert.match(html,/Workshop access required\./);
 const js=read("public/creator-theme-art-gallery.js");
 assert.doesNotThrow(()=>new Script(js,{filename:"creator-theme-art-gallery.js"}));
 assert.match(js,/ornaments\.json/);
 assert.match(js,/foundry:ready/);
 assert.match(js,/navigator\.clipboard\.writeText/);
 assert.match(js,/image\.loading="lazy"/);
 assert.match(js,/Copy CSS/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 const css=read("public/creator-theme-art-gallery.css");
 assert.doesNotMatch(css,/!important\b/);
 assert.match(css,/#theme-art-collection/);
 assert.match(css,/@media\s*\(max-width:790px\)/);
});

test("runtime works only with local original artwork, not external image hosts or franchise branding",()=>{
 const html=read("public/devil-tools.html");
 const js=read("public/creator-theme-art-gallery.js");
 const css=read("public/creator-theme-art-gallery.css");
 for(const content of [html,js,css,JSON.stringify(manifest),JSON.stringify(ornaments)])
  assert.doesNotMatch(content,/gcdn\.picsart\.com|starwars\.com/);
 assert.ok(!html.includes("Darth Vader"));
 assert.match(read(".github/workflows/knightfall-theme-art-import.yml"),/contents: write/);
 assert.match(read(".github/workflows/knightfall-theme-art-expansion-import.yml"),/contents: write/);
 assert.match(read("scripts/knightfall-theme-art-import.mjs"),/createHash/);
 assert.match(read("scripts/knightfall-theme-art-expansion-import.mjs"),/createHash/);
});
