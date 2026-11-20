import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {sectionizeTextract,textStats,findTextMatches,extractKeyValues,
 extractPossibleTableRows,makeTextractCsv,makeTextractTableCsv,makeTextractJson,
 compareTextractTexts,formatTextractComparison} from "../public/chaos-textract-lab-core.mjs";
const src=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sample="Page 1\nName: Alex\nTotal: $13.40\nItem | Qty | Price\nBread | 2 | $4\n\nPage 2\nDate: 2026-11-20\nLine two";
test("document sections, word counts and search work offline",()=>{
 const sections=sectionizeTextract(sample);
 assert.equal(sections.length,2);
 assert.equal(sections[0].heading,"Page 1");
 assert.equal(sections[1].heading,"Page 2");
 assert.ok(textStats(sample).words>=10);
 assert.equal(findTextMatches(sample,"alex").length,1);
 assert.equal(findTextMatches(sample,"missing").length,0);
 assert.equal(findTextMatches(sample,"").length,0);
});
test("structured fields, table rows, CSV and JSON preserve provenance",()=>{
 const fields=extractKeyValues(sample);
 assert.ok(fields.some(row=>row.key==="Name"&&row.value==="Alex"&&row.section==="Page 1"));
 const tables=extractPossibleTableRows(sample);
 assert.ok(tables.some(row=>row.cells[0]==="Bread"));
 const lines=makeTextractCsv(sample),fieldCsv=makeTextractCsv(sample,"fields"),tableCsv=makeTextractTableCsv(sample);
 assert.match(lines,/"Page 1","1","Name: Alex"/);
 assert.match(fieldCsv,/"Name","Alex"/);
 assert.match(tableCsv,/"Bread","2"/);
 const data=JSON.parse(makeTextractJson("receipt.pdf",sample));
 assert.equal(data.schema,"knightfall.textract.v1");
 assert.equal(data.sections.length,2);
 assert.equal(data.filename,"receipt.pdf");
});
test("CSV neutralizes spreadsheet-formula injection",()=>{
 const csv=makeTextractCsv("Page 1\n=HYPERLINK(\"https://evil\")\n-99", "lines");
 assert.ok(csv.includes("'=HYPERLINK"),"formula must begin with an apostrophe");
 assert.ok(csv.includes("'-99"));
});
test("document compare reports additions, removals and reorders without uploads",()=>{
 const a="old\nName: Alex\nTotal: $13.40";
 const b="new\nName: Alex\nTotal: $14.40";
 const result=compareTextractTexts(a,b);
 assert.equal(result.identical,false);
 assert.ok(result.added.includes("new"));
 assert.ok(result.removed.includes("old"));
 assert.match(formatTextractComparison(result),/\+ Total: \$14\.40/);
 assert.equal(compareTextractTexts(a,a).identical,true);
 assert.equal(compareTextractTexts("a\nb","b\na").reordered,true);
});
test("Textract UI loads a first-party lab module and offers explicit user controls",()=>{
 const page=src("public/chaos-textract.html"),ui=src("public/chaos-textract.mjs");
 const lab=src("public/chaos-textract-lab-core.mjs");
 for(const id of ["textract-search","textract-export-json","textract-export-csv",
  "textract-export-fields","textract-export-tables","textract-compare-file",
  "textract-compare","textract-compare-output","textract-compare-stop"]){
  assert.ok(page.includes('id="'+id+'"'),id);
 }
 assert.match(ui,/chaos-textract-lab-core\.mjs/);
 assert.match(ui,/renderInsights\(\)/);
 assert.match(ui,/compareTextractTexts\(/);
 assert.doesNotMatch(lab,/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|WebSocket/);
});
