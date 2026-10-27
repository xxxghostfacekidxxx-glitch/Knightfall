#!/usr/bin/env node
// Evidence-oriented provenance inventory. A clean scan never proves authorship.
import {readFile,readdir,mkdir,writeFile} from "node:fs/promises";
import {resolve,relative,join,extname} from "node:path";
const root=resolve("public"),manifest=JSON.parse(await readFile(join(root,"arcade/original-creations.json"),"utf8"));
const report=process.argv.includes("--report"),strict=process.argv.includes("--strict");
const evidence=[];
const knownHost=/github\.com|gitlab\.com|itch\.io|cdnjs|unpkg|jsdelivr|fonts\.googleapis|opengameart|kenney\.nl|craftpix|freepik|flaticon|pixabay|unsplash|creativecommons|license|copyright|attribution|third.party|upstream|source.code/i;
const suspect=/\b(?:SkiFree|Doodle Jump|Candy Crush|Crossy Road|Tetris|Pac.Man|Space Invaders|Mario|Flappy Bird|Breakout)\b/i;
const media=new Set([".png",".jpg",".jpeg",".gif",".webp",".svg",".mp3",".ogg",".wav",".woff",".woff2",".ttf",".otf"]);
async function walk(dir,files=[]){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p,files);else if(e.isFile())files.push(p)}return files}
for(const game of manifest.games){
 const dir=join(root,"arcade/hosted",game.id),files=await walk(dir),flags=[],sources=[];
 for(const file of files){
  const rel=relative(root,file).replaceAll("\\","/"),ext=extname(file).toLowerCase();
  if(media.has(ext))sources.push(rel);
  if(![".html",".js",".css",".svg",".md",".txt",".json"].includes(ext))continue;
  const content=await readFile(file,"utf8");
  const links=[...content.matchAll(/https?:\/\/[^\s"'<>\\)]+/g)].map(m=>m[0]).filter(u=>knownHost.test(u));
  if(links.length)flags.push({file:rel,type:"source-or-license-reference",samples:[...new Set(links)].slice(0,8)});
  if(suspect.test(content))flags.push({file:rel,type:"possible-third-party-game-name",note:"Name similarity is not proof of copied code"});
  if(/(?:©|copyright|licensed under|SPDX-License-Identifier|based on|adapted from|forked from)/i.test(content))flags.push({file:rel,type:"copyright-or-derivation-marker"});
 }
 const notices=files.filter(f=>/(?:^|\/)(?:LICENSE|NOTICE|COPYING|SOURCE|CREDITS)(?:\.[^/]*)?$/i.test(f)).map(f=>relative(root,f).replaceAll("\\","/"));
 evidence.push({id:game.id,engine:game.engine,files:files.length,media:sources.length,notices,flags,review:"unverified",conclusion:"No ownership or license clearance established by automated scanning"});
}
const catalog=await readFile(join(root,"arcade-30-games.html"),"utf8");
const external=[...catalog.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>/g)].map(m=>m[1]);
const output={schema:1,generatedAt:new Date().toISOString(),games:evidence.length,flaggedGames:evidence.filter(e=>e.flags.length).length,unverifiedGames:evidence.length,externalCatalogLinks:[...new Set(external)],disclaimer:"Static inspection only. Originality requires author/source history, asset provenance, license review, and independent gameplay QA.",entries:evidence};
if(report){await mkdir(resolve("artifacts"),{recursive:true});await writeFile(resolve("artifacts/arcade-provenance.json"),JSON.stringify(output,null,2)+"\n")}
console.log("Arcade provenance inventory:",output.games,"games;",output.flaggedGames,"flagged for review;",output.unverifiedGames,"not independently cleared");
for(const e of evidence.filter(e=>e.flags.length))console.log("REVIEW",e.id,e.flags.map(f=>f.type).join(", "));
if(strict&&evidence.some(e=>e.flags.length))process.exitCode=1;
