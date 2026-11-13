const CACHE_NAME = "knightfall-shell-v34";
const APP_SHELL = [
  "/",
  "/offline.html",
  "/personal-bots-offline.html",
  "/personal-bots-offline.js",
  "/theme.css",
  "/homepage.css",
  "/design-system.css",
  "/section-overhaul.css",
  "/section-directory.css",
  "/visual-refresh.css",
  "/knightfall-unified-theme.css",
  "/neon-global.css",
  "/gravewave-consistency.css",
  "/nav.js",
  "/message-live.js",
  "/moonology.html",
  "/moonology.css",
  "/moonology.mjs",
  "/date-journal.mjs",
  "/shadow-work.html",
  "/shadow-work.css",
  "/shadow-work.mjs",
  "/shadow-prompts.mjs",
  "/moon-strip.css",
  "/moon-widget.mjs",
  "/lunar-phases.mjs",
  "/vendor/astronomy-engine-2.1.19.min.js",
  "/gravewave-takeover.css",
  "/gravewave-takeover.js",
  "/assets/devil-tools/neon-nuisances/moxie.svg",
  "/assets/devil-tools/neon-nuisances/gravebyte.svg",
  "/icons/chaos-cartridge.svg",
  "/icons/chaos-cartridge-maskable.svg",
  "/branding/chaos-cartridge-logo.svg"
];

self.addEventListener("install", event => {
  // A single optional asset failing over a mobile connection must not prevent
  // the push service worker from installing. cache.addAll rejected the entire
  // install when any one of these resources failed to download.
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    const results=await Promise.allSettled(APP_SHELL.map(resource=>cache.add(resource)));
    const failures=results.filter(result=>result.status==="rejected").length;
    if(failures)console.warn("offline_shell_partial_cache",failures);
  }));
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => /^(?:knightfall|ashfall)-shell-/.test(key) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

// Web Push works when the site is backgrounded or closed, where the browser supports it.
function safeNotificationPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /%5c|%2f/i.test(value) || /[\\\\\x00-\x1f]/.test(value)) return "/notifications.html";
  try {
    const parsed = new URL(value, self.location.origin);
    if (parsed.origin !== self.location.origin) return "/notifications.html";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/notifications.html";
  }
}


function notificationRecordId(value) {
  const id=Number(value);
  return Number.isSafeInteger(id)&&id>0?id:null;
}

async function acknowledgeNotification(id) {
  if(!id)return;
  try{
    const response=await fetch("https://api.ash-fall.com/api/notifications/"+id,{
      method:"PATCH",credentials:"include",cache:"no-store"
    });
    if(!response.ok)return;
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows)client.postMessage({type:"KF_NOTIFICATIONS_CHANGED"});
  }catch(error){console.warn("notification_read_ack_unavailable",String(error));}
}

function messageConversationId(path) {
  const safe=safeNotificationPath(path);
  try {
    const url=new URL(safe,self.location.origin);
    if(url.pathname!=="/messages.html")return null;
    const raw=url.searchParams.get("conversation");
    if(!raw||!/^[1-9][0-9]*$/.test(raw))return null;
    const id=Number(raw);
    return Number.isSafeInteger(id)?id:null;
  }catch{return null;}
}

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { title: "Ash-Fall alert", body: "You have a new notification." }; }
  const title = String(payload.title || "Ash-Fall alert").slice(0, 120);
  const body = String(payload.body || "You have a new notification.").slice(0, 240);
  const path = safeNotificationPath(payload.url);
  const conversationId = messageConversationId(path);
  const tag = payload.tag ? String(payload.tag).slice(0, 100) : "ash-fall-alert";
  event.waitUntil((async () => {
    const testId=typeof payload.receipt_token==="string"&&/^[0-9a-f]{40}$/.test(payload.receipt_token)?payload.receipt_token:null;
    let stage="display-requested";
    try {
      // Raster-free notification for Android; message actions gracefully downgrade
      // when the browser cannot display Chromium's inline text reply control.
      const options={body,tag,renotify:false,data:{url:path,conversationId,notificationId:notificationRecordId(payload.notification_id)}};
      if(conversationId){
        try {
          await self.registration.showNotification(title,{
            ...options,actions:[{action:"reply",title:"Reply",type:"text",placeholder:"Write a reply…"}]
          });
        }catch{
          try {
            await self.registration.showNotification(title,{
              ...options,actions:[{action:"reply",title:"Reply"}]
            });
          }catch{
            await self.registration.showNotification(title,options);
          }
        }
      }else await self.registration.showNotification(title,options);
    }catch(error){
      stage="display-failed";
      console.warn("push_show_notification_failed",String(error));
    }
    if(testId){
      // Background acknowledgements work even when no app window is open. The
      // capability token is delivered only in the encrypted push payload.
      for(const step of ["received",stage]){
        try{
          await fetch("https://api.ash-fall.com/api/push/receipt",{
            method:"POST",headers:{"content-type":"application/json"},
            credentials:"omit",body:JSON.stringify({test_id:testId,stage:step})
          });
        }catch(error){console.warn("push_receipt_unavailable",String(error));}
      }
    }
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows)client.postMessage({type:"KF_PUSH_RECEIVED",tag,stage});
  })());
});
// Android/Chromium can rotate subscriptions while the app is not open.
// A browser-provided replacement is safe to register; a null replacement may
// represent a deliberate opt-out, so never silently subscribe again.
self.addEventListener("pushsubscriptionchange", event => {
  const sub=event.newSubscription;
  if(!sub)return;
  event.waitUntil((async()=>{
    try{
      const data=sub.toJSON();
      if(!data?.endpoint||!data?.keys?.p256dh||!data?.keys?.auth)return;
      const response=await fetch("https://api.ash-fall.com/api/push/subscriptions",{
        method:"POST",credentials:"include",cache:"no-store",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({subscription:data})
      });
      if(!response.ok)console.warn("push_subscription_rotation_not_registered",response.status);
    }catch(error){console.warn("push_subscription_rotation_unavailable",String(error))}
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const path=safeNotificationPath(event.notification.data?.url);
  const conversationId=messageConversationId(path);
  const notificationId=notificationRecordId(event.notification.data?.notificationId);
  const wantsReply=event.action==="reply";
  event.waitUntil((async()=>{
    await acknowledgeNotification(notificationId);
    if(wantsReply&&conversationId&&typeof event.reply==="string"&&event.reply.trim()){
      const body=event.reply.trim().slice(0,4000);
      try{
        const sent=await fetch("https://api.ash-fall.com/api/messages/conversations/"+conversationId,{
          method:"POST",credentials:"include",cache:"no-store",
          headers:{"content-type":"application/json"},body:JSON.stringify({body})
        });
        if(sent.ok)return; // The server enforces membership and blocked-message checks.
      }catch(error){console.warn("notification_reply_unavailable",String(error));}
      // Do not claim a failed inline reply was sent.
      try{
        await self.registration.showNotification("Reply not sent",{
          body:"Open your conversation to try again.",
          tag:"knightfall-reply-failed-"+conversationId,
          data:{url:"/messages.html?conversation="+conversationId,conversationId},
          actions:[{action:"reply",title:"Open chat"}]
        });
      }catch(error){console.warn("notification_reply_feedback_unavailable",String(error));}
    }
    const destination=new URL(path,self.location.origin);
    if(wantsReply&&conversationId)destination.searchParams.set("reply","1");
    const target=destination.href;
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    if(conversationId){
      const chat=windows.find(client=>{
        try{const url=new URL(client.url);return url.origin===self.location.origin&&url.pathname==="/messages.html";}catch{return false;}
      });
      if(chat){
        try{
          if(chat.url!==target&&typeof chat.navigate==="function"){
            const navigated=await chat.navigate(target);
            if(navigated)return navigated.focus();
          }else if(chat.url===target){
            chat.postMessage({type:"KF_OPEN_CONVERSATION",conversationId,reply:wantsReply});
            return chat.focus();
          }
        }catch(error){console.warn("notification_chat_navigation_unavailable",String(error));}
      }
    }
    const exact=windows.find(client=>client.url===target);
    if(exact)return exact.focus();
    return self.clients.openWindow(target);
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  const offlineBotAsset = url.pathname === "/personal-bots-offline.html" || url.pathname === "/personal-bots-offline.js";
  if (!offlineBotAsset && (url.pathname.startsWith("/profile") || url.pathname.startsWith("/miss-chaos") || url.pathname.startsWith("/adult") || url.pathname.startsWith("/dating") || url.pathname.startsWith("/account") || url.pathname.startsWith("/messages") || url.pathname.startsWith("/friends") || url.pathname.startsWith("/notifications") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/personal-bots") || url.pathname.startsWith("/vault"))) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      if (url.pathname === "/personal-bots-offline.html") {
        const localPage = await caches.match("/personal-bots-offline.html");
        if (localPage) return localPage;
      }
      if (url.pathname === "/" || url.pathname === "/index.html" || url.pathname === "/homepage" || url.pathname === "/homepage.html") {
        const home = await caches.match("/");
        if (home) return home;
      }
      const cached = await caches.match("/offline.html");
      return cached || new Response("You are offline. Reconnect to load Ash-Fall.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }));
    return;
  }
  if (APP_SHELL.includes(url.pathname) && !request.headers.has("Authorization")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        // Prefer fresh shared assets after deployments, but retain offline fallback.
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        throw error;
      }
    })());
  }
});
