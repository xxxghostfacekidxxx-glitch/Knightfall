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
const shopImport='import { handleBotSlotShop } from "./member-shop-checkout.js";';
if(!source.includes(shopImport))source=source.replace(anchor,anchor+'\n'+shopImport);
if(!source.includes('await handleBotSlotShop(request,env,url,')){
 const hook='  // Member safety controls: reports and blocks are private to the acting account.';
 const addition=[
  '  // Signed payment webhooks and account-owned member shop. Never fulfill from a browser redirect.',
  '  if(url.pathname==="/api/member-shop/checkout"||url.pathname==="/api/member-shop/orders"||url.pathname==="/api/member-shop/stripe-webhook"){',
  '   const webhook=url.pathname==="/api/member-shop/stripe-webhook";',
  '   const user=webhook?null:await requireUser(request,env);',
  '   if(!webhook&&user&&request.method==="POST"&&!await rateLimit(env,request,"member-shop-checkout",8,3600,user.id))',
  '    return json({error:"Checkout rate limit reached. Please try later."},429,origin);',
  '   const response=await handleBotSlotShop(request,env,url,user);',
  '   if(response){',
  '    const payload=await response.json().catch(()=>({error:"Shop response unavailable."}));',
  '    return json(payload,response.status,origin);',
  '   }',
  '  }',
  ''
 ].join('\n');
 if(!source.includes(hook))throw Error('Shop route insertion marker missing');
 source=source.replace(hook,addition+hook);
}
fs.writeFileSync(file,source);
console.log(source.includes('await handleMascotPets(request,env,url,')?'Sanctuary API route ready':'Route missing');
