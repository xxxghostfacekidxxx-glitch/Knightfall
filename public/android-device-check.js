/* Device QA is manual. Never claim a browser or emulator test replaces phone acceptance. */
(() => {
  "use strict";
  const form=document.getElementById("kf-android-test-form");
  if(!form)return;
  const status=document.getElementById("kf-qa-result");
  const checks=[...form.querySelectorAll('input[type="checkbox"][name]')];
  const storageKey="kf-android-physical-qa-v1";
  let checked={};
  try{
    const previous=JSON.parse(localStorage.getItem(storageKey)||"{}");
    if(previous && typeof previous==="object" && !Array.isArray(previous))checked=previous;
  }catch{}
  for(const item of checks)item.checked=checked[item.name]===true;
  const render=()=>{
    const completed=checks.filter(x=>x.checked).length;
    status.textContent=completed+"/"+checks.length+" real-device checks marked complete. "+(
      completed===checks.length
        ?"All items marked complete. Keep the release signed and verify test results before public distribution."
        :"Only checks you actually observed on an Android phone should be marked."
    );
  };
  const report=()=>{
    const lines=["Knightfall Android physical-device checklist","Date: "+new Date().toISOString().slice(0,10),
      "Build version: (enter installed APK version)","Android device/model: (enter manually)"];
    for(const item of checks){
      const label=item.closest("label")?.textContent?.trim()||item.name;
      lines.push((item.checked?"PASS":"NOT VERIFIED")+" · "+label);
    }
    lines.push("Note: manually selected checkboxes are not automated proof of test completion.");
    return lines.join("\n");
  };
  form.addEventListener("change",()=>{
    const state=Object.fromEntries(checks.map(x=>[x.name,x.checked]));
    try{localStorage.setItem(storageKey,JSON.stringify(state))}catch{}
    render();
  });
  document.getElementById("kf-qa-reset")?.addEventListener("click",()=>{
    checks.forEach(x=>x.checked=false);
    try{localStorage.removeItem(storageKey)}catch{}
    render();
  });
  document.getElementById("kf-qa-copy")?.addEventListener("click",async()=>{
    try{
      await navigator.clipboard.writeText(report());
      render();
      status.textContent+=" Report copied to clipboard.";
    }catch{
      status.textContent="Clipboard access was blocked. Copy the checklist manually from this page.";
    }
  });
  render();
})();
