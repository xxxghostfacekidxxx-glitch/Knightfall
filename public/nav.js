(() => {
  // Offline/local previews must not fetch a real member session, production
  // site settings, or notification counts. Live Ash-Fall retains all API behavior.
  const cloudAccountAvailable = ["ash-fall.com", "www.ash-fall.com"].includes(String(location.hostname || "").toLowerCase());
  // Avoid running decorative ticker animations while the document is hidden.
  const syncPageVisibility=()=>{document.documentElement.dataset.kfPageHidden=String(document.hidden);};
  document.addEventListener("visibilitychange",syncPageVisibility);
  syncPageVisibility();
  // One fail-closed visibility contract for protected shortcuts. These are
  // presentation decisions only: every protected API still authorizes itself.
  let accessUser=null;
  const accessAllowed=(user,key)=>Boolean(user&&user.status==="active"&&
    (key==="member"||user.staff_access?.[key]===true));
  const applyAccess=(root=document)=>{
    const nodes=[...(root.matches?.("[data-kf-access]")?[root]:[]),...root.querySelectorAll("[data-kf-access]")];
    for(const el of nodes)el.hidden=!accessAllowed(accessUser,el.dataset.kfAccess);
  };
  window.KnightfallAccess=Object.freeze({can:key=>accessAllowed(accessUser,key),apply:applyAccess});
  const mainPwaKey="kf:main-pwa-installed";
  const standalonePwa=()=>Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches||
    window.matchMedia?.("(display-mode: fullscreen)")?.matches||navigator.standalone===true);
  const mainManifestActive=()=>!/\/(?:chaosphere|ruinwire)\.webmanifest(?:\?|$)/.test(
    document.querySelector('link[rel="manifest"]')?.getAttribute("href")||"");
  const mainPwaRecorded=()=>{try{return localStorage.getItem(mainPwaKey)==="1"}catch{return false}};
  const recordMainPwa=()=>{if(mainManifestActive())try{localStorage.setItem(mainPwaKey,"1")}catch{}};
  // Apply shared Knightfall chrome AFTER every page-specific and inline stylesheet.
  // The previous eager injection could run in <head> before later stylesheets
  // were parsed, allowing old neon/page CSS to override the approved theme.
  const mountApprovedTheme = () => {
    // One canonical CSS cascade, never the same six stylesheets injected twice.
    // Move the existing root sheet behind page-specific CSS, without cloning it.
    const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')];
    const themes = sheets.filter(link => {
      try { return new URL(link.href, document.baseURI).pathname === "/theme.css"; }
      catch { return false; }
    });
    const link = themes.shift() || document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.kfCanonicalTheme = "true";
    const target = "/theme.css";
    if (link.getAttribute("href") !== target) link.href = target;
    // The canonical root imports tokens, shared chrome, presets and Requiem
    // in that order. Appending only this link prevents double application.
    const orderedStyles = document.head.querySelectorAll('style,link[rel="stylesheet"]');
    const lastStyle = orderedStyles[orderedStyles.length-1];
    if (lastStyle !== link || !link.isConnected) document.head.appendChild(link);
    for (const duplicate of themes) duplicate.remove();
    // The root is the sole owner of these layers. Retire old manually linked
    // copies as well as historical injector tags, but never page-local styles.
    const canonicalLayers = new Set([
      "/design-system.css","/visual-refresh.css","/knightfall-section-foundations.css",
      "/knightfall-gothic-chrome.css","/knightfall-illustrated-realms.css",
      "/knightfall-unified-theme.css","/theme-crew.css","/theme-crew-dashboard.css",
      "/knightfall-requiem.css","/realm-theme-engine.css","/global-design-controls.css",
      "/egyptian-eclipse-theme.css","/knightfall-art-theme-variables.css",
      "/knightfall-art-theme-template.css","/home-responsive.css"
    ]);
    const retireDuplicateLayers=()=>{
      for(const old of document.querySelectorAll('link[rel="stylesheet"]')){
        if(old===link)continue;
        try{
          const url=new URL(old.href,document.baseURI);
          if(url.origin===location.origin&&canonicalLayers.has(url.pathname))old.remove();
        }catch{}
      }
      for(const old of document.querySelectorAll('link[data-visual-refresh],link[data-section-overhaul],link[data-knightfall-unified-theme],link[data-knightfall-artwork],link[data-knightfall-cathedral-v2],link[data-theme-crew]')){
        if(old!==link)old.remove();
      }
    };
    // Do not remove an existing fallback before the canonical CSS is ready.
    if(link.sheet)retireDuplicateLayers();
    else link.addEventListener("load",retireDuplicateLayers,{once:true});
  };
  // Loaded separately so both navigation-enabled and navigationless chrome stay isolated.
  const mountCrewRuntime = () => {
    if(document.querySelector('script[data-kf-theme-crew-runtime],script[src^="/theme-crew-runtime.js"]'))return;
    const script=document.createElement("script");
    script.src="/theme-crew-runtime.js";
    script.dataset.kfThemeCrewRuntime="true";
    script.defer=true;
    document.head.appendChild(script);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {mountApprovedTheme();mountCrewRuntime()}, {once:true});
  } else {
    mountApprovedTheme();
    mountCrewRuntime();
  }

  // Original section illustrations: site chrome only, not gameplay or personal themes.
  const mountRealmArtwork = () => {
    const path = location.pathname.toLowerCase();
    if (/^\/(?:arcade\/hosted\/|casino\/|games\/)/.test(path)) return;
    let realm = "general";
    // Canonical Pages URLs omit .html. A shared hyphen/dot/slash boundary
    // covers /admin, /admin.html, /admin-foo and /mascot-pets alike.
    if (path === "/" || path === "/index.html") realm = "home";
    else if (/^\/(?:community|homepage|thread|create-thread|forums|madhouse)(?:-|[./]|$)/.test(path)) realm = "madhouse";
    else if (/^\/(?:chaos-cartridge|chaos-lab|arcade|arcade-vault|casino|card-room)(?:-|[./]|$)/.test(path)) realm = "arcade";
    else if (/^\/(?:devil-tools|dev-toolkit|creator|open-source-arsenal|cinderwild|cinderwind|personal-bots|bots|chatbots)(?:-|[./]|$)/.test(path)) realm = "foundry";
    else if (/^\/(?:messages|chaosphere|ruinwire|social|friends|notifications|miss-chaos|bot)(?:-|[./]|$)/.test(path)) realm = "messages";
    else if (/^\/(?:moonology|shadow-work|astrology|birth-chart|cosmic|celestial-sanctum)(?:-|[./]|$)/.test(path)) realm = "moon";
    else if (/^\/music(?:-|[./]|$)/.test(path)) realm = "music";
    else if (/^\/(?:shops|shop-builder|cinder-shop|my-shop|store|support|billing|stripe-invoicing)(?:-|[./]|$)/.test(path)) realm = "market";
    else if (/^\/(?:members|profile|account|auth|login|register)(?:-|[./]|$)/.test(path)) realm = "members";
    else if (/^\/(?:admin|eye-of-chaos|eye-of-horus|god|moderation|theme-crew)(?:-|[./]|$)/.test(path)) realm = "god";
    else if (/^\/(?:mascot|pet|companion)(?:-|[./]|$)/.test(path)) realm = "pets";
    else if (/^\/(?:die-ary|memo-pad|vault|diary)(?:-|[./]|$)/.test(path)) realm = "diary";
    const main = document.querySelector("main");
    if (!main) return;
    document.body.dataset.kfRealm = realm;
    // New first-party hub heroes own their saved artwork and responsive paint.
    // Do not attach the legacy high-specificity [data-kf-art-hero] overlay.
    if (document.body.classList.contains("kf-hub-page")) return;
    if (realm === "home") return; // Homepage has its own illustrated cathedral hero.
    // Keep actual games untouched even when a game lives at a root-level URL.
    if (realm === "general" && main.querySelector("canvas, [data-game-canvas]")) {
      document.body.classList.add("kf-gameplay-page");
      return;
    }
    const selectors = {
      madhouse: ".community-directory > .hero, .forum-hero, main > .hero",
      arcade: ".arcade-directory > .cartridge-hero, .lab > .hero, main > .hero",
      foundry: ".bots-shell > .bots-hero, .directory-shell > .directory-hero, main > .hero, .foundry-hero, .creator-hero, .kf-hub-chatbots > .kf-hub-hero",
      messages: ".messages-shell > .messages-hero, .rw-install-hero, .social-hero, .notifications-hero, .friends-hero",
      moon: ".moon-shell > .moon-intro, .moon-hero, .kf-hub-celestial > .kf-hub-hero",
      music: ".kf-hub-music > .kf-hub-hero",
      market: ".directory-shell > .directory-hero, .market-hero, .builder-hero, main > .hero",
      members: ".members-page > .members-hero, .profile-hero, .account-hero",
      god: ".admin-shell > .hero, .chaos-shell > .chaos-hero, .eye-shell > .eye-hero, main > .hero",
      pets: ".sanctuary-shell > .sanctuary-header, .room-intro, .trials-hero, .mascot-hero",
      diary: ".diary-shell > .diary-hero, .memo-hero, .vault-hero",
      general: "main > .hero, main > .page-hero"
    };
    const hero = document.querySelector(selectors[realm]);
    if (hero && main.contains(hero)) hero.dataset.kfArtHero = realm;
    else main.dataset.kfArtBackdrop = realm; // Subtle backdrop on utility pages.
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mountRealmArtwork, {once:true});
  else mountRealmArtwork();

  // Chaos Cartridge CRT / signal-corruption skin, only on arcade routes.
  if (location.pathname.startsWith("/arcade/hosted/")) {
    if (document.body) document.body.classList.add("chaos-glitch-arcade");
    else document.addEventListener("DOMContentLoaded", () => document.body.classList.add("chaos-glitch-arcade"), {once:true});
    if (!document.querySelector('link[data-chaos-glitch]')) {
      const glitch = document.createElement("link");
      glitch.rel = "stylesheet";
      glitch.href = "/chaos-glitch.css?v=20261026-glitch2";
      glitch.dataset.chaosGlitch = "true";
      document.head.append(glitch);
    }
  }
  // Shared donation footer. Payment destination is configured on the support page.
  const mountSupportFooter = () => {
    // One dedication link per footer, including home pages with custom footer markup.
    const existing=document.getElementById("ashfall-support-footer")||document.querySelector("footer.site-footer");
    if(existing){
      const links=existing.querySelector(".footer-links")||existing;
      for(const [href,label] of [["/privacy.html","Privacy"],["/account-deletion.html","Delete account"]]){
        if(!links.querySelector('a[href="'+href+'"]')){
          const a=document.createElement("a");a.href=href;a.textContent=label;a.className="kf-legal-link";
          links.append(a);
        }
      }
      for(const [href,label] of [["/contact.html","Contact Us"],["/report-issue.html","Report Issues"]]){
        if(!links.querySelector('a[href="'+href+'"]')){const a=document.createElement("a");a.href=href;a.textContent=label;a.className="kf-support-link";links.append(a);}
      }
      if(!links.querySelector('a[href="/remembering-josh.html"]')){
        const dedication=document.createElement("a");dedication.href="/remembering-josh.html";
        dedication.className="kf-dedication-link";dedication.textContent="Dedication · Josh “Crush” Van Patten";
        links.append(dedication);
      }
      return;
    }
    const footer=document.createElement("footer");
    footer.id="ashfall-support-footer";
    footer.setAttribute("aria-label","Knightfall support and dedication");
    footer.innerHTML='<a href="/support.html">Support Knightfall</a> <a href="/user-agreement.html">Terms &amp; Policies</a> <a href="/privacy.html">Privacy</a> <a href="/account-deletion.html">Delete account</a> <a href="/contact.html">Contact Us</a> <a href="/report-issue.html">Report Issues</a> <a class="kf-dedication-link" href="/remembering-josh.html">Dedication · Josh “Crush” Van Patten</a>';
    const css=document.createElement("style");
    css.textContent='#ashfall-support-footer{box-sizing:border-box;width:100%;margin-top:3rem;padding:1.3rem 1rem;text-align:center;background:#17191c;border-top:1px solid #a48a75;color:#d7c8bc;font:500 14px/1.7 system-ui,sans-serif}#ashfall-support-footer a{display:inline-block;margin-left:.6rem;color:#d1b48b;font-weight:800;text-decoration:underline;text-underline-offset:3px}#ashfall-support-footer a:focus-visible{outline:2px solid #d1b48b;outline-offset:4px}@media(max-width:520px){#ashfall-support-footer a{display:block;margin:.4rem auto 0}}';
    document.head.append(css);
    document.body.append(footer);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",mountSupportFooter,{once:true});
  else mountSupportFooter();
  // Chaosphere owns message views; legacy Ruinwire routes stay supported.
  const isChaosphere = ["/chaosphere","/chaosphere.html","/ruinwire","/ruinwire.html","/messages","/messages.html"].includes(location.pathname);
  const iconLinks = isChaosphere ? [
    { rel: "icon", href: "/icons/chaosphere.svg", type: "image/svg+xml" },
    { rel: "shortcut icon", href: "/icons/chaosphere.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", href: "/icons/knightfall-crest-512.png?v=20261114" }
  ] : [
    { rel: "icon", href: "/icons/knightfall-crest-192.png?v=20261114", type: "image/png" },
    { rel: "shortcut icon", href: "/icons/knightfall-crest-192.png?v=20261114", type: "image/png" },
    { rel: "apple-touch-icon", href: "/icons/knightfall-crest-512.png?v=20261114" }
  ];
  iconLinks.forEach(spec => {
    let link = document.head.querySelector('link[rel="' + spec.rel + '"]');
    if (!link) { link = document.createElement("link"); link.rel = spec.rel; document.head.append(link); }
    link.href = spec.href;
    if (spec.type) link.type = spec.type;
  });
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/manifest.webmanifest";
    document.head.append(manifest);
  }
  let themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) { themeColor = document.createElement("meta"); themeColor.name = "theme-color"; document.head.append(themeColor); }
  themeColor.content = "#0d1013";
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {}), { once: true });
  }

  // An update is announced, never forced in the middle of a chat or game.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    let updateToast = null;
    const showUpdate = registration => {
      const snoozed=()=>{try{return Date.now()<Number(localStorage.getItem("kf:update-snooze-until")||0)}catch{return false}};
      if (!registration.waiting || !navigator.serviceWorker.controller || updateToast || snoozed()) return;
      if (!document.getElementById("kf-app-update-style")) {
        const style = document.createElement("style");
        style.id = "kf-app-update-style";
        style.textContent = '.kf-app-update{position:fixed;z-index:2147483000;bottom:max(1rem,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(92vw,540px);display:flex;align-items:center;justify-content:center;gap:.7rem;flex-wrap:wrap;padding:.85rem 1rem;border:1px solid #ae8b79;border-radius:14px;background:#211e22f5;color:#efe1d2;box-shadow:0 8px 36px #000a;font:600 14px/1.45 system-ui,sans-serif}.kf-app-update span{flex:1 1 210px}.kf-app-update button{min-height:40px;padding:.5rem .8rem;border-radius:8px;border:1px solid #c5a57c;background:#9b4758;color:#fff3e4;font:700 14px system-ui;cursor:pointer}.kf-app-update button:last-child{background:transparent;color:#efe1d2}.kf-app-update button:focus-visible{outline:2px solid #c5a57c;outline-offset:2px}@media(max-width:400px){.kf-app-update{bottom:max(.4rem,env(safe-area-inset-bottom));gap:.45rem}}';
        document.head.append(style);
      }
      updateToast = document.createElement("aside");
      updateToast.className = "kf-app-update";
      updateToast.setAttribute("role", "status");
      const message = document.createElement("span");
      message.textContent = "Knightfall update ready. Apply it when you are finished here.";
      const apply = document.createElement("button");
      apply.type = "button"; apply.textContent = "Update";
      const later = document.createElement("button");
      later.type = "button"; later.textContent = "Later";
      apply.addEventListener("click", () => {
        apply.disabled = true; apply.textContent = "Updating…";
        registration.waiting?.postMessage({type:"SKIP_WAITING"});
      });
      later.addEventListener("click", () => {
        try{localStorage.setItem("kf:update-snooze-until",String(Date.now()+6*60*60*1000))}catch{}
        updateToast.remove(); updateToast = null;
      });
      updateToast.append(message, apply, later);
      document.body.append(updateToast);
    };
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) showUpdate(registration);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") showUpdate(registration);
        });
      });
      let lastUpdateCheck=Date.now(),updatePending=false;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible" || updatePending || Date.now()-lastUpdateCheck<300000) return;
        updatePending=true;lastUpdateCheck=Date.now();
        registration.update().catch(() => {}).finally(()=>{updatePending=false;});
      });
    }).catch(() => {});
    let updateActivated = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (updateActivated) return;
      updateActivated = true;
      if (updateToast) location.reload();
    });
  }

  // A dynamically inserted <head> script can execute before document.body exists.
  // Mount the floating assistant after DOMContentLoaded on every navigation-enabled route.
  const mountMissChaos = () => {
    if (document.getElementById("miss-chaos-presence") || document.querySelector('script[data-miss-chaos-presence]')) return;
    const companion = document.createElement("script");
    companion.src = "/miss-chaos-presence.js?v=20261127-havoc3";
    companion.dataset.missChaosPresence = "true";
    companion.onerror = () => console.warn("Miss Chaos floating tools could not be loaded.");
    document.body.append(companion);
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mountMissChaos, {once:true});
  else mountMissChaos();

  // Defer navigation mounting for PWA pages that load the shared script early.
  const initializeNavigation = () => {
  let header = document.querySelector(".kf-header");
  if (!header) {
    header = document.createElement("header");
    header.className = "kf-header";
    document.body.prepend(header);
  }
  // A stale/partial mount must never leave the site without navigation.
  if (header.dataset.kfNavMounted === "true" && header.querySelector("#kf-primary-nav") && header.querySelector(".kf-nav-toggle")) return;
  header.dataset.kfNavMounted = "true";
  header.setAttribute("aria-label", "Ash-Fall site navigation");
  // CSS for the shared header lives in knightfall-unified-theme.css.
  // The former four injected emergency/recovery layers forced retired neon colors
  // with !important and overrode the approved site-wide identity.
  if (header.parentElement !== document.body) document.body.prepend(header);
  // Keep the keyboard skip link while leaving all appearance to shared CSS.
  const mainContent=document.querySelector("main");
  if (mainContent && !document.querySelector(".kf-skip-link")) {
    if (!mainContent.id) mainContent.id="main-content";
    const skip=document.createElement("a");
    skip.className="kf-skip-link";skip.href="#"+mainContent.id;
    skip.textContent="Skip to content";header.before(skip);
  }
  // Keep the shared navigation pinned even on pages with scrolling/overflow wrappers.
  if(!header.dataset.kfFixedObserver){
    header.dataset.kfFixedObserver="true";
    let headerFrame=null,lastHeight=-1;
    const syncHeight=()=>{
      headerFrame=null;
      const height=Math.ceil(header.getBoundingClientRect().height);
      if(height!==lastHeight){
        lastHeight=height;
        document.documentElement.style.setProperty("--kf-header-height",height+"px");
      }
      scheduleMenuBounds();
    };
    const scheduleHeight=()=>{if(headerFrame===null)headerFrame=requestAnimationFrame(syncHeight);};
    if(typeof ResizeObserver==="function")new ResizeObserver(scheduleHeight).observe(header);
    window.addEventListener("resize",scheduleHeight,{passive:true});
    scheduleHeight();
  }
  header.innerHTML = `
    <a class="kf-brand" href="/" aria-label="Knightfall home"><span>KNIGHT</span><b>FALL</b></a>
    <a href="/install.html" class="kf-install-pill" aria-label="Install Knightfall on your device">⬇ <span>Install</span></a>
    <button class="kf-nav-toggle" type="button" aria-expanded="false" aria-controls="kf-primary-nav" aria-label="Open navigation">☰ <span>Menu</span></button>
    <nav id="kf-primary-nav" class="kf-nav" aria-label="Primary navigation">
      <details class="kf-nav-group">
        <summary>Community <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a href="/community.html">Forums</a>
          <a href="/members.html">Member Directory</a>
          <a href="/social.html">Groups &amp; Activity</a>
        </div>
      </details>
      <a class="kf-nav-primary" href="/chaos-cartridge.html">Arcade</a>
      <a class="kf-nav-primary kf-foundry-link" href="/devil-tools.html" hidden>Foundry</a>
      <details class="kf-nav-group kf-worlds-group">
        <summary>Explore <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a href="/celestial-sanctum.html">☾ Celestial Sanctum</a>
          <a href="/the-veil.html">𓂀 The Veil · Mythology &amp; Occult</a>
          <a href="/philosophy.html">Philosophy</a>
          <a href="/languages.html">Languages &amp; Sound Studio</a>
          <a href="/music.html">♫ Music · Serrated Signal</a>
          <a href="/chatbots.html">✳ Chatbots · Chaos Collective</a>
        </div>
      </details>
      <a class="kf-nav-primary kf-messages-shortcut" href="/messages.html" hidden>Chaosphere</a>
      <a class="kf-nav-primary kf-handoff-link" href="/ai-handoff.html" hidden>🔥 Between the Flames</a>
      <a class="kf-nav-primary kf-eye-chaos-link" href="/eye-of-chaos.html" hidden>𓂀 Eye of Chaos</a>
      <details class="kf-nav-group kf-profile-group" hidden>
        <summary>My Account <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a href="/friends.html">Friends</a>
          <a class="kf-notify" href="/notifications.html">Notifications <span class="kf-notify-badge" hidden>0</span></a>
          <a class="kf-account-link" href="/account.html">Settings &amp; Tools</a>
          <a class="kf-account-handoff-link" href="/ai-handoff.html" hidden>♡ Between the Flames · Shared To-Do</a>
        </div>
      </details>
      <details class="kf-nav-group kf-staff-group" hidden>
        <summary>Staff <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a class="kf-admin-link" href="/admin.html" hidden>Admin Dashboard</a>
          <a class="kf-staff-eye-chaos-link" href="/eye-of-chaos.html" hidden>𓂀 Eye of Chaos · Bot Command</a>
          <a class="kf-mod-link" href="/moderation.html" hidden>Moderation</a>
          <a class="kf-god-eye-link" href="/eye-of-horus.html" hidden>𓂀 Eye of Horus</a>
        </div>
      </details>
      <a class="kf-nav-primary kf-sign-in-link" href="/auth.html">Sign In</a>
    </nav>
    <a class="kf-admin-quick-link" href="/admin.html" hidden aria-label="Administrator dashboard">Admin</a>
    <a class="kf-lunar-strip" href="/moonology.html">
      <span class="kf-lunar-disks" aria-hidden="true"></span>
      <span class="kf-lunar-label">Moonology</span>
    </a>`;
  if (!document.querySelector('link[data-moon-strip]')) {
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = '/moon-strip.css';
    sheet.dataset.moonStrip = 'true';
    document.head.append(sheet);
  }
  import('/moon-widget.mjs?v=20261126-perf4').then(({mountMoonStrip}) => mountMoonStrip(header.querySelector('.kf-lunar-strip'))).catch(() => {});

  const nav = header.querySelector(".kf-nav");
  // Pages serves both extensionless routes and their original .html links.
  const normalizedPath = path => path.replace(/\/$/, "").replace(/\.html$/, "").replace(/^\/index$/, "") || "/";
  function markCurrentPage() {
    const currentPath = normalizedPath(location.pathname);
    // The brand is the sole global route to home. Avoid a duplicate Explore link.
    const brand = header.querySelector(".kf-brand");
    if (brand) {
      if (currentPath === "/") brand.setAttribute("aria-current", "page");
      else brand.removeAttribute("aria-current");
    }
    const sectionAliases = new Map([
      ["/profile-edit", "/profile"],
      ["/thread", "/community"],
      ["/community-topic", "/community"],
      ["/create-thread", "/community"],
      ["/moonology", "/celestial-sanctum"],
      ["/shadow-work", "/celestial-sanctum"],
      ["/egyptian-mythology-archive", "/the-veil"],
      ["/egyptian-civilization", "/the-veil"],
      ["/kemet-royal-archives", "/the-veil"],
      ["/kemet-house-of-life", "/the-veil"],
      ["/kemet-temple-archives", "/the-veil"],
      ["/kemet-museum", "/the-veil"],
      ["/kemet-research-library", "/the-veil"],
      ["/theban-translator", "/languages"],
      ["/nietzsche", "/philosophy"],
      ["/force-realms", "/the-veil"],
      ["/jedi-temple", "/the-veil"],
      ["/sith-order", "/the-veil"],
      ["/force-academy", "/the-veil"],
      ["/force-library", "/the-veil"],
      ["/force-council", "/the-veil"],
      ["/force-advanced-studies", "/the-veil"],
      ["/sanctuary-realm", "/the-veil"],
      ["/sanctum-of-inferno", "/the-veil"],
      ["/bots", "/chatbots"],
      ["/personal-bots", "/chatbots"],
      ["/miss-chaos", "/chatbots"]
    ]);
    const sectionPath = sectionAliases.get(currentPath) ||
      (currentPath.startsWith("/arcade/") || currentPath.startsWith("/arcade-") ? "/chaos-cartridge" : currentPath);
    nav.querySelectorAll('a[href^="/"]').forEach(link => {
      const destination = new URL(link.href);
      const samePage = normalizedPath(destination.pathname) === sectionPath;
      if (samePage && (!destination.hash || destination.hash === location.hash || sectionPath === "/")) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }
  markCurrentPage();
  nav.querySelectorAll(".kf-nav-group").forEach(group => {
    group.addEventListener("toggle", () => {
      if (group.open) nav.querySelectorAll(".kf-nav-group").forEach(other => { if (other !== group) other.open = false; });
      syncMenuState();
    });
  });
  const installLink=header.querySelector(".kf-install-pill");
  const syncInstallLink=()=>{
    const hidden=standalonePwa()||mainPwaRecorded();
    installLink.hidden=hidden;
    installLink.style.display=hidden?"none":"";
    if(hidden)installLink.setAttribute("aria-hidden","true");
    else installLink.removeAttribute("aria-hidden");
  };
  syncInstallLink();
  window.addEventListener("appinstalled",()=>{recordMainPwa();syncInstallLink()});
  window.addEventListener("beforeinstallprompt",()=>{
    if(!mainManifestActive())return;
    // An install prompt does not prove the app was uninstalled on another browser surface.
    // Preserve positive installation evidence instead of resurrecting the install link.
    syncInstallLink();
  });
  window.addEventListener("storage",event=>{if(event.key===mainPwaKey)syncInstallLink()});
  if(typeof navigator.getInstalledRelatedApps==="function"&&mainManifestActive()){
    navigator.getInstalledRelatedApps().then(apps=>{
      if(Array.isArray(apps)&&apps.some(app=>app?.platform==="webapp"&&
        /\/manifest\.webmanifest(?:\?|$)/.test(String(app.url||"")))){
        recordMainPwa();syncInstallLink();
      }
    }).catch(()=>{});
  }
  const toggle = header.querySelector(".kf-nav-toggle");
  const profileGroup = nav.querySelector(".kf-profile-group");
  const badge = nav.querySelector(".kf-notify-badge");
  const closeGroups = () => {
    nav.querySelectorAll(".kf-nav-group[open]").forEach(group => group.open = false);
  };
  const mobileNavViewport = window.matchMedia("(max-width: 1080px)");
  let menuFrame=null;
  function menuRoom(top,bottom){return Math.max(0,Math.floor(bottom-top-8));}
  function scheduleMenuBounds(){
    if(menuFrame!==null||header.dataset.kfMenuActive!=="true")return;
    menuFrame=requestAnimationFrame(()=>{
      menuFrame=null;
      if(header.dataset.kfMenuActive!=="true")return;
      const visual=window.visualViewport;
      const bottom=visual?(visual.offsetTop||0)+visual.height:window.innerHeight;
      if(nav.classList.contains("open")){
        const top=header.getBoundingClientRect().bottom;
        nav.style.setProperty("--kf-drawer-room",menuRoom(top,bottom)+"px");
      }else{
        const group=nav.querySelector(".kf-nav-group[open]");
        if(group){
          const top=group.querySelector("summary").getBoundingClientRect().bottom+5;
          group.style.setProperty("--kf-dropdown-room",menuRoom(top,bottom)+"px");
        }
      }
    });
  }
  function syncMenuState(){
    const active=nav.classList.contains("open")||!!nav.querySelector(".kf-nav-group[open]");
    header.dataset.kfMenuActive=String(active);
    if(active)scheduleMenuBounds();
  }
  window.addEventListener("resize",scheduleMenuBounds,{passive:true});
  window.visualViewport?.addEventListener("resize",scheduleMenuBounds,{passive:true});
  window.visualViewport?.addEventListener("scroll",scheduleMenuBounds,{passive:true});
  function setDrawer(open) {
    const visible = Boolean(open && mobileNavViewport.matches);
    nav.classList.toggle("open", visible);
    document.body.classList.toggle("kf-navigation-open", visible);
    toggle.setAttribute("aria-expanded", String(visible));
    toggle.setAttribute("aria-label", visible ? "Close navigation" : "Open navigation");
    if (!visible) closeGroups();
    syncMenuState();
    // Do not move desktop focus to the hidden mobile toggle.
    if (!visible && mobileNavViewport.matches && nav.contains(document.activeElement)) toggle.focus({preventScroll:true});
  }
  toggle.addEventListener("click", () => setDrawer(!nav.classList.contains("open")));
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const openGroup = nav.querySelector(".kf-nav-group[open]");
    if (openGroup) {
      openGroup.open = false;
      syncMenuState();
      openGroup.querySelector("summary").focus();
    } else if (nav.classList.contains("open")) {
      setDrawer(false);
      toggle.focus();
    }
  });
  document.addEventListener("pointerdown", event => {
    if (!header.contains(event.target)) setDrawer(false);
  });
  // Older iOS Safari versions only support MediaQueryList.addListener.
  // A missing addEventListener must not abort navigation initialization.
  if (typeof mobileNavViewport.addEventListener === "function") {
    mobileNavViewport.addEventListener("change", () => setDrawer(false));
  } else if (typeof mobileNavViewport.addListener === "function") {
    mobileNavViewport.addListener(() => setDrawer(false));
  }
  window.addEventListener("popstate", () => setDrawer(false));
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) setDrawer(false);
  });

  let notificationRefreshVersion=0, notificationPending=false, notificationLastStart=0, memberAuthenticated=false;
  function refreshNotifications() {
    if (!cloudAccountAvailable) return;
    if (!memberAuthenticated || document.hidden || navigator.onLine===false || notificationPending || Date.now()-notificationLastStart<1500) return;
    notificationPending=true;
    notificationLastStart=Date.now();
    const requestVersion=++notificationRefreshVersion;
    fetch("https://api.ash-fall.com/api/notifications?unread=true&limit=1", {credentials:"include",cache:"no-store"})
      .then(r => { if (r.status===401 || r.status===403) return null; if (!r.ok) throw new Error("Auth temporarily unavailable: "+r.status); const type=r.headers.get("content-type")||""; if (!type.toLowerCase().includes("json")) throw new Error("Auth endpoint returned non-JSON"); return r.json(); })
      .then(d => {
        if (!d || !badge || requestVersion!==notificationRefreshVersion) return;
        const count = Number(d.unread_count || 0);
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.hidden = count === 0;
      }).catch(() => {}).finally(() => {notificationPending=false;});
  }

  // Read receipts, other browser tabs, and push clicks must refresh the badge.
  window.addEventListener("kf:notifications-changed", refreshNotifications);
  window.addEventListener("storage", event => {
    if (event.key === "kf:notifications-changed") refreshNotifications();
  });
  window.addEventListener("focus", refreshNotifications);
  window.addEventListener("pageshow", refreshNotifications);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshNotifications();
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", event => {
    if (event.data?.type === "KF_NOTIFICATIONS_CHANGED") refreshNotifications();
  });

  (cloudAccountAvailable ? fetch("https://api.ash-fall.com/api/site-settings", {credentials:"include",cache:"no-store"}) : Promise.resolve(null))
    .then(r => r?.ok ? r.json() : null)
    .then(d => {
      const siteSettings = d?.settings;
      if (!siteSettings) return;
      if (siteSettings.feature_miss_chaos === "false") document.querySelector("[data-miss-chaos-directory]")?.setAttribute("hidden", "");
      // Single shared, accessible ticker with independent leadership lines.
      const tickerRows=[
        ["ANNOUNCEMENT",siteSettings.announcements_enabled==="true"?(siteSettings.announcement_title||"Knightfall")+" · "+(siteSettings.announcement_body||""):"",null],
        ["OSIRIS",siteSettings.ticker_osiris||"","osiris"],
        ["ISIS",siteSettings.ticker_isis||"","isis"]
      ];
      {
        const ticker=document.createElement("aside");
        ticker.id="kf-shared-announcement";ticker.className="kf-leadership-ticker";
        ticker.setAttribute("aria-label","Knightfall announcements");
        for(const [label,message,owner] of tickerRows){
          const row=document.createElement("div");row.className="kf-ticker-row";if(owner)row.dataset.tickerOwner=owner;if(!message.trim())row.hidden=true;
          const tag=document.createElement("strong");tag.className="kf-ticker-label";tag.textContent=label;
          const viewport=document.createElement("div");viewport.className="kf-ticker-viewport";
          const track=document.createElement("div");track.className="kf-ticker-track";
          const span=document.createElement("span");span.textContent=message;track.append(span);viewport.append(track);row.append(tag,viewport);ticker.append(row);
        }
        ticker.hidden=!ticker.querySelector(".kf-ticker-row:not([hidden])");
        header.append(ticker);
        scheduleMenuBounds();
        window.dispatchEvent(new Event("kf:ticker-ready"));
      }
      if (siteSettings.maintenance_mode === "true") {
        const banner = document.createElement("aside");
        banner.className = "kf-maintenance";
        banner.textContent = "Knightfall is in maintenance mode. Administrator access remains available.";
        banner.id="kf-shared-maintenance";
        banner.classList.add("kf-shared-maintenance");
        header.append(banner);
      }
    }).catch(() => {});

  (cloudAccountAvailable ? fetch("https://api.ash-fall.com/api/auth/me", {credentials:"include",cache:"no-store"}) : Promise.resolve(null))
    .then(r => r?.ok ? r.json() : null)
    .then(d => {
      const user = d?.user;
      accessUser=user||null;applyAccess();
      if (!accessAllowed(user,"member")) return;
      memberAuthenticated=true;
      // One shared WebSocket signal for inbox bubbles, with polling fallback.
      if (!["/messages", "/messages.html"].includes(location.pathname)) {
        let chatLoadFailures=0;
        const startChatHeads=()=>{
          if(chatLoadFailures>=3)return;
          if (!document.querySelector('link[data-kf-chat-bubbles]')) {
            const sheet=document.createElement("link");
            sheet.rel="stylesheet";sheet.href="/chat-bubbles.css?v=20261125-apotheosis4";
            sheet.dataset.kfChatBubbles="true";document.head.append(sheet);
          }
          if(!window.ChaosphereImp&&!document.querySelector('script[data-kf-chaosphere-imp]')){
            const mascot=document.createElement("script");
            mascot.src="/chaosphere-imp.js?v=20261124-original-emojis2";
            mascot.dataset.kfChaosphereImp="true";
            document.body.append(mascot);
          }
          if (!document.querySelector('script[data-kf-chat-bubbles]')) {
            const bubbles=document.createElement("script");
            bubbles.src="/chat-bubbles.js?v=20261126-perf4";
            bubbles.dataset.kfChatBubbles="true";
            bubbles.dataset.userId=String(user.id);
            bubbles.onerror=()=>{bubbles.remove();chatLoadFailures++;if(chatLoadFailures<3)setTimeout(startChatHeads,3000*chatLoadFailures);};
            document.body.append(bubbles);
          }
        };
        startChatHeads(); // Mount independently of optional realtime transport.
        if(window.KnightfallLive)startChatHeads();
        else {
          let liveScript=document.querySelector('script[data-kf-message-live]');
          if(!liveScript){
            liveScript=document.createElement("script");
            liveScript.src="/message-live.js?v=20261113-realtime1";
            liveScript.dataset.kfMessageLive="true";
            liveScript.onload=startChatHeads;
            liveScript.onerror=startChatHeads; // Polling still works if WebSockets are unavailable.
            document.body.append(liveScript);
          }else{
            liveScript.addEventListener("load",startChatHeads,{once:true});
            liveScript.addEventListener("error",startChatHeads,{once:true});
          }
        }
      }

      profileGroup.hidden = false;
      nav.querySelector(".kf-messages-shortcut").hidden = false;
      const identityLink=nav.querySelector(".kf-sign-in-link");
      if(identityLink){identityLink.hidden=false;identityLink.textContent="@"+String(user.username||"member");identityLink.href="/profile.html";identityLink.classList.add("kf-identity-link");identityLink.setAttribute("aria-label","View your profile, "+String(user.username||"member"));}
      document.querySelector("[data-home-sign-in]")?.setAttribute("hidden", "");
      const tickerOwner=accessAllowed(user,"can_eye_of_horus")?"osiris":user.staff_access?.rank_code==="isis"?"isis":null;
      if(tickerOwner){
        const mountTickerEditor=()=>{
          const ticker=document.querySelector("#kf-shared-announcement");
          if(!ticker||ticker.querySelector("[data-ticker-edit]"))return;
          const editor=document.createElement("button");editor.type="button";editor.className="kf-ticker-edit";editor.dataset.tickerEdit=tickerOwner;editor.textContent="Edit "+tickerOwner.toUpperCase()+" ticker";
          editor.addEventListener("click",async()=>{
            const existing=ticker.querySelector('[data-ticker-owner="'+tickerOwner+'"] .kf-ticker-track span')?.textContent||"";
            const message=window.prompt("Your "+tickerOwner.toUpperCase()+" ticker line (240 characters max). Leave empty to hide:",existing);
            if(message===null)return;
            try{
              const response=await fetch("https://api.ash-fall.com/api/leadership-ticker",{method:"PATCH",credentials:"include",headers:{"content-type":"application/json"},body:JSON.stringify({message})});
              const result=await response.json().catch(()=>({}));
              if(!response.ok)throw Error(result.error||"Ticker save failed");
              location.reload();
            }catch(error){window.alert(error.message)}
          });
          ticker.append(editor);
          ticker.hidden=false;
          scheduleMenuBounds();
        };
        window.addEventListener("kf:ticker-ready",mountTickerEditor,{once:true});mountTickerEditor();
      }
      const role = String(user.role || "").trim().toLowerCase();
      const creatorAccess=accessAllowed(user,"can_create");
      const foundryLink=nav.querySelector(".kf-foundry-link");
      if(foundryLink)foundryLink.hidden=!creatorAccess;

      const admin = accessAllowed(user,"can_admin");
      const rights = user.staff_access || {};
      // Only trusted auth/me rank metadata changes these visible ceremonial titles.
      const royalRank=rights.rank_code==="osiris"?"Osiris":rights.rank_code==="isis"?"Isis":null;
      const staffHeading=nav.querySelector(".kf-staff-group > summary");
      if(staffHeading?.firstChild)staffHeading.firstChild.textContent=royalRank?"𓂀 "+royalRank+" Command ":"Staff ";
      const accountHeading=nav.querySelector(".kf-profile-group > summary");
      if(accountHeading?.firstChild)accountHeading.firstChild.textContent=royalRank?"My Account · "+royalRank+" ":"My Account ";
      const quickAdmin=header.querySelector(".kf-admin-quick-link");
      if(quickAdmin)quickAdmin.textContent=royalRank||"Admin";
      const canModerate = accessAllowed(user,"can_moderate");
      const staff = canModerate;
      nav.querySelector(".kf-mod-link").hidden = !canModerate;
      nav.querySelector(".kf-god-eye-link").hidden = !accessAllowed(user,"can_eye_of_horus");
      nav.querySelector(".kf-staff-group").hidden = !staff;
      nav.querySelector(".kf-admin-link").hidden = !admin;
      // Keep private links discoverable to the two confirmed collaborating accounts.
      // Backend sessions and collaboration grants still enforce actual access.
      const sharedHandoff = accessAllowed(user,"can_handoff");
      nav.querySelector(".kf-handoff-link").hidden = !sharedHandoff;
      nav.querySelector(".kf-account-handoff-link").hidden = !sharedHandoff;
      nav.querySelector(".kf-eye-chaos-link").hidden = !accessAllowed(user,"can_eye_of_chaos");
      nav.querySelector(".kf-staff-eye-chaos-link").hidden = !accessAllowed(user,"can_eye_of_chaos");
      header.querySelector(".kf-admin-quick-link").hidden=!admin;
      const myProfile=nav.querySelector(".kf-my-profile-link");
      if(myProfile)myProfile.href="/profile.html?username="+encodeURIComponent(user.username);
      refreshNotifications();
      setInterval(refreshNotifications, 45000);
      let activityPending=false, activityLastStart=0;
      const pingActivity = () => {
        if(document.hidden || navigator.onLine===false || activityPending || Date.now()-activityLastStart<115000)return;
        activityPending=true;activityLastStart=Date.now();
        return fetch("https://api.ash-fall.com/api/activity/ping", {method:"POST",credentials:"include"})
          .catch(() => {}).finally(()=>{activityPending=false;});
      };
      pingActivity();
      setInterval(pingActivity, 120000);
      document.addEventListener("visibilitychange",()=>{if(!document.hidden)pingActivity();});
    }).catch(() => {});
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeNavigation, {once:true});
  else initializeNavigation();
})();
