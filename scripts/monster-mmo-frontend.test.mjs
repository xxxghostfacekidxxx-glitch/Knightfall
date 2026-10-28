import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const js=readFileSync("public/monster-mmo.js","utf8");
const html=readFileSync("public/monster-mmo.html","utf8");
const css=readFileSync("public/monster-mmo.css","utf8");
test("creature frontend parses as a module",()=>{
 const result=spawnSync(process.execPath,["--check","--input-type=module"],{input:js,encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
});
test("map has 10 by 8 grid and safe walkable rules",()=>{
 assert.match(js,/x<=10&&y>=1&&y<=8/);
 assert.match(js,/obstacles=new Set/);
 assert.match(js,/function render\(/);
 assert.match(css,/grid-template-columns:repeat\(10/);
});
test("mobile controls and gameplay are wired",()=>{
 for(const id of ["world","party","battle","trainer","connect","disconnect","rest","encounter","log"])assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
 for(const action of ["attack","capture","flee"])assert.ok(html.includes('data-action="'+action+'"'));
 for(const dir of ["up","down","left","right"])assert.ok(html.includes('data-move="'+dir+'"'));
 assert.match(js,/async function move\(/);
 assert.match(js,/function offlineAction\(/);
});
test("cloud play uses server intents and protects offline state",()=>{
 assert.match(js,/expected_version:version/);
 assert.match(js,/type:"move",direction/);
 assert.match(js,/offlineSave=structuredClone\(save\)/);
 assert.match(js,/credentials:"include"/);
 assert.match(js,/new WebSocket\(wsUrl\)/);
});
