/* Knightfall install self-check: public configuration only, no account/private APIs. */
(() => {
  "use strict";
  const button=document.getElementById("kf-install-check-run");
  const output=document.getElementById("kf-install-check-results");
  const summary=document.getElementById("kf-install-check-summary");
  const copy=document.getElementById("kf-install-check-copy");
  if(!button||!output||!summary||!copy)return;

  const origin=window.location.origin;
  let lastResults=[];
  const readJson=async path=>{
    const response=await fetch(path,{cache:"no-store",credentials:"omit"});
    if(!response.ok)return null;
    const type=response.headers.get("content-type")||"";
    if(!/\bjson\b/i.test(type))return null;
    return response.json();
  };
  const result=(name,state,detail)=>({name,state,detail});
  const installed=()=>!!window.matchMedia?.("(display-mode: standalone)")?.matches||
    !!window.matchMedia?.("(display-mode: fullscreen)")?.matches||navigator.standalone===true;
  const checkers=[
    {name:"Connection",run:async()=>navigator.onLine===false?
      result("Connection","attention","This device is offline. Reconnect to check the live site."):
      result("Connection","ok","The device reports a network connection. This does not prove the API is reachable.")},
    {name:"App display",run:async()=>installed()?
      result("App display","ok","This browser reports installed or fullscreen display mode."):
      result("App display","info","Running in a normal browser tab. Installation may still be available.")},
    {name:"Service worker",run:async()=>{
      if(!("serviceWorker" in navigator))return result("Service worker","attention","This browser does not support service workers.");
      const registration=await navigator.serviceWorker.getRegistration("/");
      if(!registration)return result("Service worker","attention","Knightfall's offline and push worker is not registered yet.");
      if(registration.active)return result("Service worker","ok","An active service worker is registered. Push delivery still needs phone testing.");
      return result("Service worker","info","A service worker is installing or waiting to activate.");
    }},
    {name:"Notifications",run:async()=>{
      if(!("Notification" in window)||!("PushManager" in window))return result("Notifications","info","Push notifications are unavailable in this browser context.");
      const permission=Notification.permission;
      if(permission==="granted")return result("Notifications","ok","Browser permission is granted. Background delivery has not been tested.");
      if(permission==="denied")return result("Notifications","attention","Browser permission is blocked. Review this site's notification permissions.");
      return result("Notifications","info","Permission has not been requested. You can enable notifications after sign-in.");
    }},
    {name:"Web app manifest",run:async()=>{
      const manifest=await readJson("/manifest.webmanifest");
      if(!manifest)return result("Web app manifest","attention","The public manifest could not be fetched.");
      const icons=Array.isArray(manifest.icons)?manifest.icons:[];
      const has192=icons.some(i=>String(i.sizes||"").includes("192x192"));
      const has512=icons.some(i=>String(i.sizes||"").includes("512x512"));
      return has192&&has512&&String(manifest.start_url||"").startsWith("/")?
        result("Web app manifest","ok","Manifest and both launcher icon sizes are declared. Browser installability still depends on device support."):
        result("Web app manifest","attention","The manifest is missing a local start URL or a launcher icon size.");
    }},
    {name:"Public Android release",run:async()=>{
      const data=await readJson("/android-release.json");
      if(!data)return result("Public Android release","attention","APK publication status could not be checked.");
      const ready=data.status==="released"&&data.signedReleaseVerified===true&&
        data.applicationId==="com.ashfall.knightfall"&&/^[a-f0-9]{64}$/i.test(String(data.apkSha256||""));
      return ready?
        result("Public Android release","info","The site advertises a signed APK. Use the official download and independently check its SHA-256."):
        result("Public Android release","info","A public release-signed APK has not been announced. The web app is the supported install route.");
    }},
    {name:"Android domain statement",run:async()=>{
      const statements=await readJson("/.well-known/assetlinks.json");
      const isKnightfall=Array.isArray(statements)&&statements.some(entry=>
        entry?.target?.namespace==="android_app"&&
        entry.target.package_name==="com.ashfall.knightfall"&&
        Array.isArray(entry.target.sha256_cert_fingerprints)&&
        entry.target.sha256_cert_fingerprints.some(v=>/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/i.test(String(v))));
      return isKnightfall?
        result("Android domain statement","info","A correctly formatted Knightfall Digital Asset Links statement is published. This does not verify an installed APK certificate."):
        result("Android domain statement","info","Android signing/domain association is pending. PWA installation does not require it.");
    }}
  ];
  const render=items=>{
    output.replaceChildren();
    for(const item of items){
      const li=document.createElement("li");
      li.className="kf-install-check-"+item.state;
      const title=document.createElement("strong");title.textContent=item.name+": ";
      const state=document.createElement("span");
      state.textContent=({ok:"Available",attention:"Check needed",info:"Information"})[item.state]||"Information";
      const detail=document.createElement("p");detail.textContent=item.detail;
      li.append(title,state,detail);output.append(li);
    }
  };
  const report=()=>{
    const lines=["Knightfall public install self-check",
      "Site: "+origin,"Date: "+new Date().toISOString(),
      ...lastResults.map(x=>x.name+" ["+x.state+"]: "+x.detail),
      "No account credentials were read. Browser state is not proof of real-phone functionality."];
    return lines.join("\n");
  };
  button.addEventListener("click",async()=>{
    button.disabled=true;summary.textContent="Checking public app and browser configuration…";
    const settled=await Promise.all(checkers.map(async x=>{
      try{return await x.run()}catch{return result(x.name,"attention","This check could not finish. Verify network access or try again.");}
    }));
    lastResults=settled;render(settled);
    button.disabled=false;copy.hidden=false;
    const concerns=settled.filter(x=>x.state==="attention").length;
    summary.textContent=concerns?concerns+" check(s) need attention. The detailed results are below.":
      "Checks completed. These checks do not replace a real Android device test.";
  });
  copy.addEventListener("click",async()=>{
    if(!lastResults.length)return;
    try{await navigator.clipboard.writeText(report());summary.textContent="Public install diagnostic report copied.";}
    catch{summary.textContent="Clipboard unavailable. Select and copy the results below.";}
  });
})();
