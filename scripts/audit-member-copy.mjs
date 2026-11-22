#!/usr/bin/env node
// Public-copy audit. Review findings; do not automatically strip license notices or credits.
import {readFileSync,readdirSync} from "node:fs";
import {join,relative} from "node:path";
const root=new URL("../public/",import.meta.url).pathname;
const patterns=[
 ["internal repository",/github\.com\/xxxghostfacekidxxx-glitch\/Knightfall/gi],
 ["deployment provider",/\b(?:Cloudflare Pages|Cloudflare Workers|wrangler deploy)\b/gi],
 ["internal architecture",/\b(?:D1 database|KV namespace|SESSIONS KV|backend Worker|internal API endpoint)\b/gi],
 ["engineering status in member copy",/\b(?:GitHub Actions|CI pipeline|deployment SHA|repository branch)\b/gi]
];
const exceptions=[/\/admin(?:-|\.)/,/\/eye-of-chaos/,/\/developer/,/\/ai-handoff/,/\/theme-crew/];
const hits=[];
function scan(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isDirectory()){if(!["node_modules",".git"].includes(entry.name))scan(file);continue;}if(!/\.(?:html|mjs|js|json)$/.test(entry.name))continue;const path=relative(root,file).replaceAll("\\","/");if(exceptions.some(x=>x.test("/"+path)))continue;let content;try{content=readFileSync(file,"utf8")}catch{continue}for(const [kind,re] of patterns){re.lastIndex=0;let match;let count=0;while((match=re.exec(content))&&count++<30){const line=content.slice(0,match.index).split("\n").length;hits.push({file:path,line,kind,excerpt:content.slice(Math.max(0,match.index-55),match.index+match[0].length+55).replace(/\s+/g," ").slice(0,150)});}}}}
scan(root);
console.log(JSON.stringify({findings:hits.length,results:hits},null,2));
// Findings require human review: third-party attribution and licenses may be mandatory.
