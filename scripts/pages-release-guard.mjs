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
 ["Cloudflare custom header budget and deduplication",["--test","scripts/pages-header-budget.test.mjs"]],
 ["Miss Chaos Crucible real project brief regressions",["--test","scripts/chaos-crucible.test.mjs","scripts/chaos-crucible-progress.test.mjs","scripts/chaos-crucible-shelf.test.mjs"]],
 ["Crucible page syntax",["--check","public/chaos-crucible.mjs"]],
 ["Crucible briefing engine syntax",["--check","public/chaos-crucible-core.mjs"]],
 ["Crucible milestone engine syntax",["--check","public/chaos-crucible-progress.mjs"]],
 ["Crucible device shelf syntax",["--check","public/chaos-crucible-shelf.mjs"]],
 ["Miss Chaos abilities guide, server mode gates and source index",["--test","scripts/miss-chaos-guide.test.mjs","scripts/miss-chaos-site-index.test.mjs"]],
 ["Miss Chaos guide runtime syntax",["--check","public/miss-chaos-guide.mjs"]],
 ["Miss Chaos supervised code review UI and security",["--test","scripts/chaos-dev-review-ui.test.mjs"]],
 ["Eye of Chaos review UI syntax",["--check","public/chaos-dev-review-ui.mjs"]],
 ["Code Studio review UI syntax",["--check","public/chaos-code-studio.js"]],
 ["Miss Chaos guide model syntax",["--check","public/miss-chaos-guide-core.mjs"]],
 ["Miss Chaos Worker site index syntax",["--check","backend/chaos-public-tools.mjs"]],
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
