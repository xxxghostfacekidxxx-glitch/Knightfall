// Fail a Cloudflare Pages deployment before publishing public/ if the critical
// site/theme contracts fail. No dependencies, private keys, or network calls.
import {spawnSync} from "node:child_process";
const jobs=[
 ["Global CSS integrity",["scripts/theme-crew-audit.mjs"]],
 ["Internal navigation and duplicate links",["scripts/site-link-integrity.mjs"]],
 ["Approved Gothic colors, assets and PWA invariants",["scripts/site-theme-audit.mjs"]],
 ["Messaging theme regression",["scripts/messaging-theme-audit.mjs"]],
 ["Sitewide art, responsive safety and realm routing",["--test","scripts/cathedral-overhaul.test.mjs","scripts/knightfall-sitewide-artwork.test.mjs","scripts/theme-crew-route.test.mjs"]],
 ["GOD-only publisher, revisions and rollback",["--test","backend/src/theme-crew.test.mjs"]],
 ["Shared navigation syntax",["--check","public/nav.js"]],
 ["Theme switcher runtime syntax",["--check","public/theme-crew-runtime.js"]],
 ["Theme Crew interface syntax",["--check","public/theme-crew-ui.js"]],
 ["PWA service worker syntax",["--check","public/sw.js"]],
 ["API theme module syntax",["--check","backend/src/theme-crew.js"]]
];
for(const [label,args] of jobs){
 console.log("\nPAGES RELEASE GUARD: "+label);
 const result=spawnSync(process.execPath,args,{stdio:"inherit",timeout:120000});
 if(result.error||result.status!==0){
  console.error("PAGES RELEASE BLOCKED: "+label+
   (result.error?": "+String(result.error):" (exit "+result.status+")"));
  process.exitCode=1;
  break;
 }
}
if(!process.exitCode)console.log("\nPAGES RELEASE GATE PASSED: all critical source and role checks.");
