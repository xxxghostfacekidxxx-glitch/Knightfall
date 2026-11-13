// Remove truly identical CSS rules within the same at-rule context.
// The later rule is retained so cascade precedence and deliberate overrides survive.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function dedupe(css) {
  const masked = css.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
  const frames = [], seen = new Map(), records = [];
  let start = 0, quote = null;
  for(let i=0;i<masked.length;i++){
    const c=masked[i];
    if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='{'){
      const selector=masked.slice(start,i).trim().replace(/\s+/g,' ');
      let headStart=start;while(headStart<i && /\s/.test(masked[headStart]))headStart++;
      frames.push({selector,headStart});
      start=i+1;continue;
    }
    if(c==='}'){
      const frame=frames.pop();if(!frame){start=i+1;continue;}
      const body=masked.slice(start,i).trim().replace(/\s+/g,' ').replace(/;$/,'');
      if(frame.selector && !frame.selector.startsWith('@') && !frames.some(f=>/^@(?:-\w+-)?keyframes/.test(f.selector))){
        const scope=frames.filter(f=>f.selector.startsWith('@')).map(f=>f.selector).join('||');
        const key=scope+'||'+frame.selector+'||'+body;
        if(body)records.push({key,start:frame.headStart,end:i+1});
      }
      start=i+1;
    }
  }
  for(const r of records){const group=seen.get(r.key)||[];group.push(r);seen.set(r.key,group);}
  const remove=[...seen.values()].flatMap(group=>group.slice(0,-1));
  let result=css;
  for(const r of remove.sort((a,b)=>b.start-a.start)) result=result.slice(0,r.start)+result.slice(r.end);
  return {text:result,duplicateCount:remove.length,ruleCount:records.length};
}

const isMain = process.argv[1] && import.meta.url === new URL('file://'+resolve(process.argv[1])).href;
if(isMain){
  const dir=resolve('public');
  const paths=process.argv.slice(2).filter(s=>!s.startsWith('--'));
  const candidates=paths.length?paths:readdirSync(dir).filter(name=>name.endsWith('.css')).map(name=>'public/'+name);
  let repeated=0,affected=0;
  for(const p of candidates){
    const current=readFileSync(p,'utf8'),result=dedupe(current);
    repeated+=result.duplicateCount;
    if(result.duplicateCount){affected++;console.log(p+': '+result.duplicateCount+' duplicate rules');if(process.argv.includes('--fix'))writeFileSync(p,result.text);}
  }
  console.log('Duplicate CSS rules: '+repeated+' across '+affected+' stylesheets.');
  if(repeated && process.argv.includes('--check'))process.exitCode=1;
}
