#!/usr/bin/env node
// One-time, idempotent source integration for Knightfall's oversized API router.
// Runs in CI against main; no pull requests, separate branches or code deletion.
import fs from 'node:fs';
const file='backend/src/index.js';
let source=fs.readFileSync(file,'utf8');
const imported='import { handleMascotPets } from "./mascot-pets.js";';
const anchor='import { checkTurnstile } from "./turnstile.js";';
const route='  // Member safety controls: reports and blocks are private to the acting account.';
if(!source.includes(anchor)||!source.includes(route))throw Error('Backend router insertion anchors have moved');
if(!source.includes(imported))source=source.replace(anchor,anchor+'\n'+imported);
if(!source.includes('await handleMascotPets(request,env,url,')){
 const addition='  // Mascot pets: authenticated and privacy-aware D1-backed profile companions.\n'+
 '  if(url.pathname.startsWith("/api/mascot-pets")){\n'+
 '   const petResponse=await handleMascotPets(request,env,url,{getUser,json,rateLimit,origin});\n'+
 '   if(petResponse)return petResponse;\n'+
 '  }\n\n';
 source=source.replace(route,addition+route);
}
fs.writeFileSync(file,source);
console.log(source.includes('await handleMascotPets(request,env,url,')?'Sanctuary API route ready':'Route missing');
