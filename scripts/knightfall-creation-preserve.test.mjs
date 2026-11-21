import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {BASELINE_COMMIT,FOUNDRY_REQUIRED,isProtectedCreationPath} from "./knightfall-creation-preserve.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
test("all key Creator Foundry workspaces and art manifest survive cleanup",()=>{
 assert.match(BASELINE_COMMIT,/^[a-f0-9]{40}$/);
 for(const path of FOUNDRY_REQUIRED){
  assert.ok(existsSync(resolve(root,path)),"Protected Foundry / artwork file is missing: "+path);
  assert.ok(isProtectedCreationPath(path),"Preservation archive must include "+path);
 }
 const foundry=readFileSync(resolve(root,"public/devil-tools.html"),"utf8");
 assert.match(foundry,/<title>Creator Foundry \| Knightfall<\/title>/);
 assert.match(foundry,/id="production-workbench"/);
 assert.match(foundry,/id="kf-art-relic-gallery"/);
 assert.match(foundry,/creator-foundry\.js/);
});
test("all original artwork formats and asset libraries are preserved regardless of realm",()=>{
 for(const path of [
  "public/assets/knightfall/black-sun-temple.svg",
  "public/assets/knightfall/creator-theme-concept.png",
  "public/assets/knightfall/knightfall-character-sprites.zip",
  "public/assets/pets/mini-villain.webp",
  "public/arcade/hosted/imp-inferno/sprites/flame.gif",
  "public/icons/knightfall-crest-192.png",
  "public/arcade/hosted/unknown/game-art.glb",
  "public/creator-production-core.mjs",
  "public/creator-art-studio.js",
  "public/knightfall-illustrated-realms.css"
 ])assert.equal(isProtectedCreationPath(path),true,"Artwork path must survive "+path);
 assert.equal(isProtectedCreationPath("public/index.html"),false);
});
test("secrets, credentials and env files must never enter a Foundry archive",()=>{
 for(const path of [
  "public/assets/.env","public/assets/.env.production",
  "public/icons/private.key","public/assets/id_rsa",
  "public/assets/credentials.json","public/assets/certificate.pem"
 ])assert.equal(isProtectedCreationPath(path),false,"Do not archive private configuration: "+path);
});
test("Knightfall asset manifest is retained and its primary artwork files resolve",()=>{
 const manifest=JSON.parse(readFileSync(resolve(root,"public/assets/knightfall/manifest.json"),"utf8"));
 assert.equal(manifest.id,"knightfall-original-art");
 assert.ok(manifest.sprites?.length>=16);
 assert.ok(manifest.relics?.length>=12);
 for(const path of [manifest?.crest?.small,manifest?.crest?.large,manifest?.uiReference?.image,
   ...(manifest?.collections||[]).flatMap(x=>[x.image,x.pack])].filter(Boolean)){
  assert.ok(path.startsWith("/"),"Artwork manifest path must be local: "+path);
  assert.ok(existsSync(resolve(root,"public",path.slice(1))),"Manifest artwork missing: "+path);
 }
});
