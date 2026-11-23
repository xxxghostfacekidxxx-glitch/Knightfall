// Fail a Cloudflare Pages deployment before publishing public/ if the critical
// site/theme contracts fail. No dependencies, private keys, or network calls.
import {spawnSync} from "node:child_process";
const jobs=[
 ["Textract local OCR, file safety and exports",["--test","scripts/chaos-textract.test.mjs","scripts/chaos-textract-native.test.mjs","scripts/chaos-textract-lab.test.mjs","scripts/chaos-textract-regression.test.mjs"]],
 ["Textract extraction syntax",["--check","public/chaos-textract-core.mjs"]],
 ["Original Textract ZIP syntax",["--check","public/chaos-textract-native-zip.mjs"]],
 ["Original Textract PDF syntax",["--check","public/chaos-textract-native-pdf.mjs"]],
 ["Original Textract OCR syntax",["--check","public/chaos-textract-native-ocr.mjs"]],
 ["Textract lab syntax",["--check","public/chaos-textract.mjs"]],
 ["Protected Knightfall mottos, catalog counts and member disclosures",["--test","scripts/member-copy-guard.test.mjs"]],
 ["Protected artwork and Creator Foundry static audit",["scripts/knightfall-creation-preserve.mjs","--audit"]],
 ["Protected artwork and Creator Foundry workspace regressions",["--test","scripts/knightfall-creation-preserve.test.mjs"]],
 ["Creator Foundry production editor, sprite atlas and tilemap regressions",["--test","scripts/creator-production-lab.test.mjs"]],
 ["Owner-only message archive and mail access boundaries",["--test","scripts/owner-mail-access.test.mjs"]],
 ["Creator role and private owner mailbox authorization",["--test","backend/src/creator-art-submissions-role.test.mjs"]],
 ["Chaosphere scroll and Cards Against Chaos four-seat validation",["--test","scripts/chaosphere-cards-regression.test.mjs"]],
 ["Chaos Sudoku launch recovery and catalog routing",["--test","scripts/arcade-launch-recovery.test.mjs"]],
 ["Six original theme-art PNG checksums, Creator Foundry gallery and safe paths",["--test","scripts/knightfall-theme-art.test.mjs"]],
 ["Original theme-art offline integrity",["scripts/knightfall-theme-art-import.mjs","--verify"]],
 ["Global CSS integrity",["scripts/theme-crew-audit.mjs"]],
 ["CSS ownership, duplicate imports and legacy debt budget",["--test","scripts/theme-style-ownership.test.mjs"]],
 ["Canonical theme asset URLs and single loader",["--test","scripts/theme-asset-url-integrity.test.mjs"]],
 ["Black Sun navigation and theme regression checks",["--test","scripts/black-sun-cleanup.test.mjs"]],
 ["Theme Forge artwork and rapid preset switching",["--test","scripts/theme-forge-fast-switch.test.mjs"]],
 ["Egyptian Eclipse complete painted artwork, SVG ornaments and published preset",["--test","scripts/egyptian-eclipse-theme.test.mjs"]],
 ["Four reviewed artwork realms, future theme kit template and safe generator",["--test","scripts/knightfall-art-themes.test.mjs"]],
 ["Theme kit recipe compiler drift and source safety",["scripts/build-knightfall-theme-kits.mjs","--check"]],
 ["Independent realm theme routing, previews and isolation",["--test","scripts/realm-theme-engine.test.mjs"]],
 ["Celestial, music and chatbot hubs, links, original rhythm lab",["--test","scripts/realm-hubs.test.mjs"]],
 ["Internal navigation and duplicate links",["scripts/site-link-integrity.mjs"]],
 ["Approved Gothic colors, assets and PWA invariants",["scripts/site-theme-audit.mjs"]],
 ["Messaging theme regression",["scripts/messaging-theme-audit.mjs"]],
 ["Chaosphere visual design and composer controls",["--test","scripts/chaosphere-polish.test.mjs","scripts/chaosphere-viewport.test.mjs","scripts/chaosphere-creator-messaging.test.mjs","scripts/messaging-quality.test.mjs"]],
 ["Chaosphere extras syntax",["--check","public/chaosphere-extras.js"]],
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
 ["Miss Chaos local test kits and credential-minimized manual candidate CI",["--test","scripts/chaos-review-test-kit.test.mjs","scripts/chaos-review-sandbox.test.mjs"]],
 ["Miss Chaos manual candidate runner syntax",["--check","scripts/chaos-review-sandbox.mjs"]],
 ["Miss Chaos local candidate kit syntax",["--check","public/chaos-review-test-kit.mjs"]],
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
// Keep Pages build logs compact: Cloudflare's history endpoint truncates large
// logs, which previously hid the first real failure after thousands of passes.
// Every job still runs and blocks publication on a nonzero exit.
for(const [label,args] of jobs){
 const result=spawnSync(process.execPath,args,{
  encoding:"utf8",maxBuffer:32*1024*1024,timeout:120000
 });
 if(result.error||result.status!==0){
  const output=[result.stdout||"",result.stderr||""].filter(Boolean).join("\n");
  console.error("\nPAGES RELEASE GUARD FAILURE: "+label);
  if(output)console.error(output.slice(-40000));
  console.error("PAGES RELEASE BLOCKED: "+label+
   (result.error?": "+String(result.error):" (exit "+result.status+")"));
  process.exitCode=1;
  break;
 }
 console.log("PAGES RELEASE GUARD PASS: "+label);
}
if(!process.exitCode)console.log("\nPAGES RELEASE GATE PASSED: original Knightfall Textract requires no third-party build downloads.");
