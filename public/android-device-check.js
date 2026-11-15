/* Knightfall Android phone QA: version-bound manual notes, stored only on this device. */
(() => {
  "use strict";
  const form=document.getElementById("kf-android-test-form");
  if(!form)return;
  const status=document.getElementById("kf-qa-result");
  const checks=[...form.querySelectorAll('input[type="checkbox"][name]')];
  const fields={
    version:document.getElementById("kf-qa-build-version"),
    runId:document.getElementById("kf-qa-run-id"),
    sha:document.getElementById("kf-qa-apk-sha256"),
    device:document.getElementById("kf-qa-device")
  };
  if(Object.values(fields).some(x=>!x))return;
  const key="kf-android-physical-qa-v2";
  let saved={};
  try{const value=JSON.parse(localStorage.getItem(key)||"{}");if(value&&typeof value==="object"&&!Array.isArray(value))saved=value;}catch{}
  const read=v=>String(v??"").slice(0,90);
  fields.version.value=read(saved.version).slice(0,48);
  fields.runId.value=read(saved.runId).slice(0,20);
  fields.sha.value=read(saved.sha).slice(0,64);
  fields.device.value=read(saved.device).slice(0,90);
  for(const x of checks)x.checked=saved.checks?.[x.name]===true;

  const values=()=>({
    version:fields.version.value.trim(),
    runId:fields.runId.value.trim(),
    sha:fields.sha.value.trim().toLowerCase(),
    device:fields.device.value.trim(),
    checks:Object.fromEntries(checks.map(x=>[x.name,x.checked]))
  });
  const valid=v=>/^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.]+)?$/i.test(v.version)&&
    /^[1-9][0-9]*$/.test(v.runId)&&/^[a-f0-9]{64}$/.test(v.sha);
  const persist=()=>{try{localStorage.setItem(key,JSON.stringify(values()));}catch{}};
  const render=(reset=false)=>{
    const v=values(),completed=checks.filter(x=>x.checked).length;
    const known=valid(v);
    status.textContent=completed+"/"+checks.length+" phone checks recorded. "+(
      reset?"Build identity changed: old test checkmarks were cleared. ":
      known?"Exact build identity recorded. ":
      "Enter a valid version, successful run ID and 64-digit APK checksum. "
    )+(known&&completed===checks.length?
      "All items have been manually checked for this APK; review the report before release.":
      "Only mark tests you actually completed on the signed candidate.");
  };
  form.addEventListener("input",event=>{
    if(event.target?.type!=="text")return;
    if(event.target===fields.version||event.target===fields.runId||event.target===fields.sha){
      checks.forEach(x=>x.checked=false);
      persist();render(true);
    }else{persist();render();}
  });
  form.addEventListener("change",()=>{
    persist();render();
  });
  const report=()=>{
    const v=values();
    const lines=["Knightfall Android manual physical-device checklist","Date: "+new Date().toISOString().slice(0,10),
      "Version: "+(v.version||"NOT RECORDED"),
      "Signed candidate GitHub run ID: "+(v.runId||"NOT RECORDED"),
      "Installed APK SHA-256: "+(v.sha||"NOT RECORDED"),
      "Android phone model: "+(v.device||"NOT RECORDED"),
      "Build identity: "+(valid(v)?"FORMATTED (not cryptographically verified by this form)":"INCOMPLETE OR INVALID")];
    for(const x of checks){
      const label=x.closest("label")?.textContent?.trim()||x.name;
      lines.push((x.checked?"MANUALLY MARKED PASS":"NOT VERIFIED")+" · "+label);
    }
    lines.push("Manual records are not cryptographic proof of device testing. Verify the APK checksum against the signed CI artifact.");
    return lines.join("\n");
  };
  document.getElementById("kf-qa-reset")?.addEventListener("click",()=>{
    checks.forEach(x=>x.checked=false);
    for(const f of Object.values(fields))f.value="";
    try{localStorage.removeItem(key);}catch{}
    render();
  });
  document.getElementById("kf-qa-copy")?.addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(report());
      render();status.textContent+=" Report copied to clipboard.";
    }catch{status.textContent="Clipboard unavailable. Use the browser share/copy controls instead.";}
  });
  render();
})();
