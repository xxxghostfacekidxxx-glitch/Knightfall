#!/usr/bin/env node
/**
 * Knightfall / Devil Tools SVG inventory and quality audit.
 * Run: node scripts/devil-tools-svg-audit.mjs [--write-report] [--strict]
 * Dependency-free. Never rewrites artwork or accidentally scans vendor imports.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIRS = [
  'public/assets/devil-tools',
  'public/assets/arcade',
  'public/assets/monster-sprites',
  'public/assets/miss-chaos',
  'public/icons',
  'public/branding',
  'public/admin-offline',
  'public/arcade/hosted/crypt-pairs/sprites',
];
const flags = new Set(process.argv.slice(2));
const toPosix = p => p.split(path.sep).join('/');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

function walk(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const file = toPosix(path.join(rel, entry.name));
    if (entry.isDirectory()) out.push(...walk(file));
    else if (entry.isFile() && file.toLowerCase().endsWith('.svg')) out.push(file);
  }
  return out;
}
function analyze(file) {
  const svg = read(file);
  const problems = [];
  const notes = [];
  const title = svg.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  const description = svg.match(/<desc\b[^>]*>([\s\S]*?)<\/desc>/i)?.[1]?.trim() ?? null;
  const viewBox = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
  const paths = (svg.match(/<path\b/g) || []).length;
  const shapes = (svg.match(/<(path|rect|circle|ellipse|polygon|polyline|line)\b/g) || []).length;
  const gradients = (svg.match(/<(linearGradient|radialGradient)\b/g) || []).length;
  const animated = /@keyframes\b|<animate(?:Motion|Transform)?\b/i.test(svg);
  if (!/<svg\b/i.test(svg) || !/<\/svg\s*>\s*$/.test(svg)) problems.push('invalid-svg-root');
  if (!viewBox) problems.push('missing-viewbox');
  if (/<script\b|<foreignObject\b|\bon(?:load|error|click|mouseover)\s*=/i.test(svg)) problems.push('executable-xml');
  if (/\b(?:xlink:)?href\s*=\s*["'](?:https?:)?\/\//i.test(svg)) problems.push('external-dependency');
  if (!title) notes.push('missing-title');
  if (!description) notes.push('missing-desc');
  if (animated && !/prefers-reduced-motion/i.test(svg)) notes.push('motion-without-reduced-motion');
  if (shapes < 6) notes.push('simple-shape-count-review-visually');
  if (!gradients) notes.push('no-gradient-depth-review-visually');
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  if (new Set(ids).size !== ids.length) problems.push('duplicate-svg-ids');
  const category = file.includes('/icons/choices/') ? 'choice-icon'
    : file.startsWith('public/icons/') ? 'app-icon'
    : file.startsWith('public/branding/') ? 'branding'
    : file.startsWith('public/admin-offline/') ? 'admin-icon'
    : file.includes('/neon-nuisances/') ? 'mascot'
    : file.includes('/gravewave/') ? 'arcade-effect'
    : file.includes('/monster-sprites/') ? 'monster-sprite'
    : file.includes('/sprites/') ? 'game-mirror'
    : file.includes('/miss-chaos/') ? 'ai-art'
    : file.includes('/arcade/') ? 'arcade-art' : 'other';
  const hash = crypto.createHash('sha256').update(svg).digest('hex').slice(0, 20);
  const priorities = { 'arcade-effect': 2, 'monster-sprite': 3, 'choice-icon': 3, 'app-icon': 3, 'admin-icon': 3, 'mascot': 4, 'game-mirror': 5, 'arcade-art': 6, 'ai-art': 6, branding: 6, other: 7 };
  const priority = problems.length ? 0 : (notes.length ? priorities[category] : 9);
  return { file, category, priority, bytes: Buffer.byteLength(svg), hash, title, description, viewBox,
    shapes, paths, gradients, animated, problems, notes };
}

const files = [...new Set(SOURCE_DIRS.flatMap(walk))].sort();
const records = files.map(analyze).sort((a,b)=>a.priority-b.priority || a.file.localeCompare(b.file));
const byPath = new Map(records.map(r=>[r.file, r]));
const manifest = JSON.parse(read('public/assets/devil-tools/neon-nuisances/manifest.json'));
const references = [];
for (const mascot of manifest.characters) {
  for (const [variant, src] of [['master', mascot.svg], ...Object.entries(mascot.variants || {})]) {
    const local = 'public' + src.split('?')[0];
    if (!byPath.has(local) && !fs.existsSync(path.join(ROOT, local))) {
      references.push({ mascot: mascot.name, variant, path: local, problem: 'missing-asset' });
    }
  }
}
const mirrorRoot = 'public/arcade/hosted/crypt-pairs/sprites/';
const mirrors = records.filter(r=>r.file.startsWith(mirrorRoot)).map(r=>{
  const master='public/assets/devil-tools/neon-nuisances/'+path.basename(r.file);
  const canonical=byPath.get(master);
  return {game:r.file, canonical:canonical ? master : null,
    state:!canonical?'non-mascot':canonical.hash===r.hash?'synchronized':'OUTDATED-COPY'};
});
const summary = {
  scanRoots:SOURCE_DIRS, svgFiles:records.length,
  byCategory:Object.fromEntries([...new Set(records.map(r=>r.category))].map(cat=>[cat,records.filter(r=>r.category===cat).length])),
  blockers:records.filter(r=>r.problems.length).length,
  reviewCandidates:records.filter(r=>r.notes.length).length,
  outdatedMirrors:mirrors.filter(x=>x.state==='OUTDATED-COPY').length,
  missingManifestAssets:references.length,
};
const result={generatedAt:new Date().toISOString(),summary,missingAssets:references,mirrors,assets:records};
if (flags.has('--write-report')) {
  const dir=path.join(ROOT, 'reports');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'devil-tools-svg-audit.json'),JSON.stringify(result,null,2)+'\n');
  const lines=['# Devil Tools SVG Audit','',...Object.entries(summary).filter(([k])=>k!=='scanRoots'&&k!=='byCategory').map(([k,v])=>'- **'+k+'**: '+v),'',
  '## Asset categories', ...Object.entries(summary.byCategory).map(([k,v])=>'- '+k+': '+v),
  '','## Missing manifest files',...(references.length?references.map(r=>'- '+r.path):['None']),
  '','## Outdated sprite mirrors',...(mirrors.filter(r=>r.state==='OUTDATED-COPY').map(r=>'- '+r.game+' => '+r.canonical)),
  '','## Remaster queue','| File | Category | Shapes | Gradients | Findings |','|---|---|---:|---:|---|',
  ...records.map(r=>'| '+r.file+' | '+r.category+' | '+r.shapes+' | '+r.gradients+' | '+[...r.problems,...r.notes].join(', ')+' |')];
  fs.writeFileSync(path.join(dir,'devil-tools-svg-audit.md'),lines.join('\n')+'\n');
}
console.log(JSON.stringify({summary,missingAssets:references,staleMirrors:mirrors.filter(x=>x.state==='OUTDATED-COPY'),topPriority:records.slice(0,20).map(x=>({file:x.file,problems:x.problems,notes:x.notes}))},null,2));
if (flags.has('--strict') && (summary.blockers || summary.missingManifestAssets)) process.exitCode=1;
