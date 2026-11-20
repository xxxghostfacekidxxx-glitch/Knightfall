/* Textract Lab: deterministic, browser-only document inspection, comparison and exports. */
import {normalizeTextractText} from "./chaos-textract-core.mjs";
const MAX_RESULT_ROWS=3500;
const MAX_DIFF_LINES=6000;
export function sectionizeTextract(text){
 const source=normalizeTextractText(text);
 if(!source)return [];
 const lines=source.split("\n");
 const sections=[];let current={heading:"Document",lines:[]};
 const push=()=>{if(current.lines.length)sections.push({heading:current.heading,text:current.lines.join("\n")});};
 for(const line of lines){
  const match=line.match(/^(Page\s+\d+|Slide\s+\d+|sheet\d+)(?:\s*)$/i);
  if(match){push();current={heading:match[1],lines:[]};}
  else current.lines.push(line);
 }
 push();return sections;
}
export function textStats(text){
 const raw=normalizeTextractText(text);
 return {characters:raw.length,words:(raw.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length,
  lines:raw?raw.split("\n").length:0,sections:sectionizeTextract(raw).length};
}
export function findTextMatches(text,query,limit=100){
 const source=String(text||""),needle=String(query||"").trim().slice(0,120);
 if(!needle)return [];
 const lower=source.toLocaleLowerCase(),key=needle.toLocaleLowerCase(),found=[];
 let start=0;
 while(found.length<Math.min(250,Math.max(1,limit))){
  const index=lower.indexOf(key,start);
  if(index<0)break;
  found.push({index,snippet:source.slice(Math.max(0,index-55),Math.min(source.length,index+needle.length+75)).replace(/\s+/g," ").trim()});
  start=index+Math.max(1,key.length);
 }
 return found;
}
export function extractTextLines(text,limit=MAX_RESULT_ROWS){
 const sections=sectionizeTextract(text);
 const rows=[];
 for(const section of sections){
  const lines=section.text.split("\n");
  for(let i=0;i<lines.length;i++){
   const value=lines[i].trim();
   if(!value)continue;
   rows.push({section:section.heading,line:i+1,text:value});
   if(rows.length>=limit)return rows;
  }
 }
 return rows;
}
export function extractKeyValues(text,limit=350){
 const rows=extractTextLines(text),data=[];
 for(const row of rows){
  const match=row.text.match(/^([^:=|]{2,70}?)\s*[:=]\s*(.{1,500})$/);
  if(!match)continue;
  const key=match[1].trim(),value=match[2].trim();
  if(!/\p{L}/u.test(key)||!value)continue;
  data.push({...row,key,value});
  if(data.length>=limit)break;
 }
 return data;
}
function quoteCsvCell(value){
 let text=String(value??"");
 // Guard spreadsheet formula execution when user opens the CSV in Excel/Sheets.
 if(/^[\s]*[=+\-@]/.test(text))text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
export function makeTextractCsv(text,mode="lines"){
 const fields=mode==="fields"?["section","line","key","value"]:["section","line","text"];
 const rows=mode==="fields"?extractKeyValues(text):extractTextLines(text);
 return [fields.map(quoteCsvCell).join(","),...rows.map(row=>fields.map(field=>quoteCsvCell(row[field])).join(","))].join("\r\n")+"\r\n";
}
export function makeTextractJson(filename,text){
 const raw=normalizeTextractText(text),meta=textStats(raw);
 return JSON.stringify({schema:"knightfall.textract.v1",filename:String(filename||"document").slice(0,128),
  note:"OCR data may contain recognition errors. Check the original.",
  stats:meta,sections:sectionizeTextract(raw),fields:extractKeyValues(raw).map(({section,line,key,value})=>({section,line,key,value}))},null,2);
}
function frequencyOf(lines){
 const counts=new Map();
 for(const line of lines){const key=line.trim();if(key)counts.set(key,(counts.get(key)||0)+1);}
 return counts;
}
export function compareTextractTexts(previous,current,{maxDifferences=300}={}){
 const a=normalizeTextractText(previous),b=normalizeTextractText(current);
 const aLines=a.split("\n").slice(0,MAX_DIFF_LINES),bLines=b.split("\n").slice(0,MAX_DIFF_LINES);
 const oldFreq=frequencyOf(aLines),newFreq=frequencyOf(bLines);
 const removed=[],added=[];
 for(const [text,count] of oldFreq)for(let n=0;n<count-(newFreq.get(text)||0)&&removed.length<maxDifferences;n++)removed.push(text);
 for(const [text,count] of newFreq)for(let n=0;n<count-(oldFreq.get(text)||0)&&added.length<maxDifferences;n++)added.push(text);
 const sameLines=removed.length===0&&added.length===0;
 return {identical:a===b,reordered:! (a===b)&&sameLines,
  previous:textStats(a),current:textStats(b),removed,added,
  truncated:a.split("\n").length>MAX_DIFF_LINES||b.split("\n").length>MAX_DIFF_LINES||
    removed.length>=maxDifferences||added.length>=maxDifferences};
}
export function formatTextractComparison(comparison){
 const summary=comparison.identical?"No textual changes detected.":comparison.reordered?
  "Same line content, but the order or spacing changed.":"Changes detected between the two extracted documents.";
 return [summary,"Previous: "+comparison.previous.words+" words. Current: "+comparison.current.words+" words.",
  comparison.truncated?"Only a bounded comparison is displayed.":"",
  ...comparison.removed.map(s=>"- "+s),...comparison.added.map(s=>"+ "+s)].filter(Boolean).join("\n");
}
