import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {prepareApprovedApply} from "./chaos-approved-apply.mjs";
test("owner apply checks exact digest, source SHA and pinned recipe; validation never writes",()=>{
 const root=mkdtempSync(join(tmpdir(),"kf-apply-"));
 try{
  mkdirSync(join(root,"public"));
  const path="public/chaos-crucible-core.mjs",file=join(root,path),original="export const value=1;\n",candidate="export const value=2;\n",sha="a".repeat(40);
  writeFileSync(file,original);
  const input={path,base_sha:sha,candidate_base64:Buffer.from(candidate).toString("base64"),candidate_sha256:createHash("sha256").update(candidate).digest("hex")};
  const context={root,checkoutSha:sha,actor:"owner",owner:"owner",confirmation:"APPLY TO MAIN"};
  assert.throws(()=>prepareApprovedApply(input,{...context,actor:"other"}),/authorization/);
  assert.throws(()=>prepareApprovedApply(input,{...context,confirmation:"yes"}),/authorization/);
  assert.throws(()=>prepareApprovedApply(input,{...context,checkoutSha:"b".repeat(40)}),/base SHA/);
  assert.throws(()=>prepareApprovedApply({...input,candidate_sha256:"f".repeat(64)},context),/mismatch/);
  assert.ok(prepareApprovedApply(input,context).tests.length);
  assert.equal(readFileSync(file,"utf8"),original);
 }finally{rmSync(root,{recursive:true,force:true});}
});
