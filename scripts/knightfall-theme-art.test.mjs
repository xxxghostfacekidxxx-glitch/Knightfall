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
const originals=JSON.parse(read("scripts/knightfall-theme-art-sources.json"));
const sha256=bytes=>createHash("sha256").update(bytes).digest("hex");

test("all six generated Knightfall theme artworks are backed up as real same-origin PNG files",()=>{
 assert.equal(manifest.id,"knightfall-2026-11-20-premium-theme-art");
 assert.equal(manifest.assets.length,6);
 assert.equal(originals.assets.length,6);
 const expectedCollections={"egyptian-eclipse":3,"dark-lord-ascendant":2,"theme-selector":1};
 const observed={};
 for(const item of manifest.assets){
  assert.match(item.path,/^\/assets\/knightfall\/theme-collections\/[a-z0-9-]+\/[a-z0-9-]+\.png$/);
  const local="public"+item.path;
  assert.ok(existsSync(resolve(root,local)),"First-party original missing: "+local);
  assert.equal(isProtectedCreationPath(local),true,"Artwork not under Creations Vault: "+local);
  assert.ok(FOUNDRY_REQUIRED.includes(local),"First-party asset missing deletion protection: "+local);
  const bytes=readFileSync(resolve(root,local));
  assert.equal(bytes.length,item.bytes,"Original file length changed: "+local);
  assert.equal(sha256(bytes),item.sha256,"Original checksum changed: "+local);
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16),item.width);
  assert.equal(bytes.readUInt32BE(20),item.height);
  observed[item.collection]=(observed[item.collection]||0)+1;
 }
 assert.deepEqual(observed,expectedCollections);
});

test("Creator Foundry discovers theme originals as a staff-gated workspace",()=>{
 const html=read("public/devil-tools.html");
 assert.match(html,/id="theme-art-collection" data-workspace hidden/);
 assert.match(html,/href="#theme-art-collection" data-workspace-search/);
 assert.match(html,/id="kf-theme-art-gallery"/);
 assert.match(html,/creator-theme-art-gallery\.css\?v=/);
 assert.match(html,/creator-theme-art-gallery\.js\?v=/);
 assert.match(html,/role="status"/);
 assert.match(read("public/creator-foundry.js"),/workshop\.querySelectorAll\("\[data-workspace\]"\)/);
 assert.match(html,/Workshop access required\./);
 const js=read("public/creator-theme-art-gallery.js");
 assert.doesNotThrow(()=>new Script(js,{filename:"creator-theme-art-gallery.js"}));
 assert.match(js,/manifest\.json/);
 assert.match(js,/foundry:ready/);
 assert.match(js,/navigator\.clipboard\.writeText/);
 assert.match(js,/loading="lazy"|image\.loading="lazy"/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 const css=read("public/creator-theme-art-gallery.css");
 assert.doesNotMatch(css,/!important\b/);
 assert.match(css,/#theme-art-collection/);
 assert.match(css,/@media\(max-width:790px\)/);
});

test("theme art sources are exact preserved originals, not unlicensed external runtime dependencies",()=>{
 const html=read("public/devil-tools.html");
 const js=read("public/creator-theme-art-gallery.js");
 const css=read("public/creator-theme-art-gallery.css");
 for(const source of originals.assets){
  const asset=manifest.assets.find(x=>x.id===source.id);
  assert.ok(asset,source.id);
  assert.equal(asset.sha256,source.sha256);
  assert.equal(asset.bytes,source.bytes);
  assert.equal(asset.width,source.width);
  assert.equal(asset.height,source.height);
 }
 for(const content of [html,js,css,JSON.stringify(manifest)])
  assert.doesNotMatch(content,/gcdn\.picsart\.com|https?:\/\/[^"']*starwars\.com/);
 assert.ok(!html.includes("Darth Vader"));
 assert.match(read(".github/workflows/knightfall-theme-art-import.yml"),/contents: write/);
 assert.match(read("scripts/knightfall-theme-art-import.mjs"),/sha256/);
});
