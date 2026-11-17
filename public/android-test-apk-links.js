/* Find current, short-lived internal APK test artifacts from the official GitHub repo.
 * This never claims a debug-signed APK is the permanent production release.
 * A GitHub login and ZIP extraction may be required to retrieve CI artifacts.
 */
(() => {
  "use strict";
  const REPO="xxxghostfacekidxxx-glitch/Knightfall";
  const workflows={
    "knightfall-android-debug-apk":"Knightfall Android test APK",
    "ruinwire-android-debug-apk":"Chaosphere Android debug test APK"
  };
  const api="https://api.github.com/repos/"+REPO;
  const requests={headers:{Accept:"application/vnd.github+json"}};
  async function getJson(url){
    const response=await fetch(url,{...requests,cache:"no-store",credentials:"omit"});
    if(!response.ok)throw Error(response.status===403?"GitHub rate limit or access restriction.":"GitHub could not retrieve the test builds.");
    return response.json();
  }
  async function latestPassedArtifact(name){
    const list=await getJson(api+"/actions/artifacts?name="+encodeURIComponent(name)+"&per_page=12");
    const items=Array.isArray(list.artifacts)?list.artifacts:[];
    for(const artifact of items){
      const runId=Number(artifact.workflow_run?.id);
      if(artifact.name!==name||artifact.expired||!Number.isSafeInteger(runId)||runId<=0)continue;
      const run=await getJson(api+"/actions/runs/"+runId);
      if(run.name!==workflows[name]||run.conclusion!=="success"||run.head_branch!=="main")continue;
      return {runId,artifactId:artifact.id,createdAt:artifact.created_at};
    }
    return null;
  }
  for(const button of document.querySelectorAll("[data-android-debug-find]")){
    const name=button.dataset.androidDebugFind;
    if(!Object.hasOwn(workflows,name))continue;
    const target=document.getElementById(button.dataset.targetLink||"");
    const status=document.getElementById(button.dataset.targetStatus||"");
    if(!target||!status)return;
    button.addEventListener("click",async()=>{
      button.disabled=true;
      status.textContent="Checking the latest passing Android test run…";
      target.hidden=true;
      try{
        const artifact=await latestPassedArtifact(name);
        if(!artifact){
          status.textContent="No current successful test APK artifact is available. Open the build history below.";
          return;
        }
        const url="https://github.com/"+REPO+"/actions/runs/"+artifact.runId+"/artifacts/"+artifact.artifactId;
        target.href=url;
        target.hidden=false;
        status.textContent="Internal test APK found. Open the GitHub artifact, sign in if requested, and extract the APK from the ZIP. This is debug-signed and must be uninstalled before installing the eventual release-signed app.";
      }catch(error){
        status.textContent=(error?.message||"Build lookup unavailable.")+" Use the GitHub build-history link below instead.";
      }finally{button.disabled=false;}
    });
  }
})();
