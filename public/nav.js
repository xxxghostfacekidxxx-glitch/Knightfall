(() => {
  // Shared Gravewave theme and original artwork, loaded once on all nav-enabled pages.
  if (!document.querySelector('link[data-gravewave-theme]')) {
    const theme=document.createElement('link');theme.rel='stylesheet';theme.href='/neon-global.css?v=20261026-neonfix2';theme.dataset.gravewaveTheme='true';document.head.append(theme);
  }
  if (!document.querySelector('script[data-gravewave-decor]')) {
    const decor=document.createElement('script');decor.src='/gravewave-decor.js?v=20261026-neonfix2';decor.defer=true;decor.dataset.gravewaveDecor='true';document.head.append(decor);
  }
  // Full-site Gravewave signal interference and original mascot decorations.
  if (!document.querySelector('link[data-gravewave-takeover]')) {
    const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/gravewave-takeover.css?v=20261026-mascot2';sheet.dataset.gravewaveTakeover='true';document.head.append(sheet);
  }
  if (!document.querySelector('script[data-gravewave-takeover],script[src*="/gravewave-takeover.js"]')) {
    const art=document.createElement('script');art.src='/gravewave-takeover.js?v=20261026-mascot2';art.defer=true;art.dataset.gravewaveTakeover='true';document.head.append(art);
  }
  // Chaos Cartridge CRT / signal-corruption skin, only on arcade routes.
  if (location.pathname.startsWith("/arcade") || location.pathname.startsWith("/chaos-cartridge")) {
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
  // The shop preview is available to all members, without enabling checkout.
  const mountShopLink = () => {
    if (document.getElementById("ashfall-shop-link") || location.pathname==="/cinder-shop.html") return;
    const link=document.createElement("a");
    link.id="ashfall-shop-link";link.href="/cinder-shop.html";link.textContent="🔥 Cinder Shop";
    link.style.cssText="display:inline-block;margin:.5rem 0 0;color:#c6ff45;font-weight:700;text-decoration:underline;text-underline-offset:3px";
    const footer=document.getElementById("ashfall-support-footer");
    if(footer)footer.append(document.createElement("br"),link);
  };
  // Shared donation footer. Payment destination is configured on the support page.
  const mountSupportFooter = () => {
    if (document.getElementById("ashfall-support-footer")) return;
    const footer = document.createElement("footer");
    footer.id = "ashfall-support-footer";
    footer.setAttribute("aria-label", "Support Ash-Fall");
    footer.innerHTML = '<span>Enjoying the chaos? Help keep Ash-Fall running.</span> <a href="/support.html">❤️ Support Ash-Fall</a>';
    const css = document.createElement("style");
    css.textContent = '#ashfall-support-footer{box-sizing:border-box;width:100%;margin-top:3rem;padding:1.3rem 1rem;text-align:center;background:#110f12;border-top:1px solid #ff55d8;color:#cfc4bb;font:500 14px/1.7 system-ui,sans-serif}#ashfall-support-footer a{display:inline-block;margin-left:.6rem;color:#c6ff45;font-weight:800;text-decoration:underline;text-underline-offset:3px}#ashfall-support-footer a:focus-visible{outline:2px solid #c6ff45;outline-offset:4px}@media(max-width:520px){#ashfall-support-footer a{display:block;margin:.4rem auto 0}}';
    document.head.append(css);
    document.body.append(footer);
    mountShopLink();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",mountSupportFooter,{once:true});
  else mountSupportFooter();
  // Original Devil Tools SVG atlas: small, decorative stamps across shared pages.
  // Use the existing first-party asset; never insert SVG markup from user content.
  const mountDevilToolsStamps = () => {
    const atlas = "/assets/arcade/chaos-sprite-atlas.svg";
    const stamp = (name, index) => {
      const node = document.createElement("span");
      node.className = "kf-devil-stamp kf-devil-stamp-" + name;
      node.style.setProperty("--kf-sprite-x", (index % 12) * 100 / 11 + "%");
      node.style.setProperty("--kf-sprite-y", index < 12 ? "0%" : "100%");
      node.style.backgroundImage = 'url("' + atlas + '")';
      node.setAttribute("aria-hidden", "true");
      return node;
    };
    const footer = document.getElementById("ashfall-support-footer");
    if (footer && !footer.querySelector(".kf-devil-footer-stamps")) {
      const collection = document.createElement("span");
      collection.className = "kf-devil-footer-stamps";
      collection.setAttribute("aria-hidden", "true");
      collection.append(stamp("flame", 20), stamp("skull", 1), stamp("crown", 11));
      footer.prepend(collection);
    }
    const main = document.querySelector("main");
    const title = main?.querySelector("h1");
    if (!title || main.querySelector(".kf-devil-title-stamps")) return;
    const path = location.pathname;
    // Keep account, private content, moderation, and editor screens distraction-free.
    if (/\/(?:admin|moderation|account|profile|messages|vault|adult|dating|friends|notifications|devil-tools|die-ary|create-|edit-)/i.test(path)) return;
    const collection = document.createElement("span");
    collection.className = "kf-devil-title-stamps";
    collection.setAttribute("aria-hidden", "true");
    const indexes = /arcade|chaos-cartridge|game/i.test(path) ? [2, 6, 11] :
      /community|madhouse|social/i.test(path) ? [1, 10, 18] :
      /shop|support/i.test(path) ? [4, 20, 16] : [20, 1, 11];
    indexes.forEach((index, i) => collection.append(stamp("title-" + i, index)));
    title.after(collection);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountDevilToolsStamps, { once: true });
  else mountDevilToolsStamps();
  // Shared PWA setup and global Chaos Cartridge favicon.
  const iconLinks = [
    { rel: "icon", href: "/icons/chaos-cartridge.svg?v=20261026-brand1", type: "image/svg+xml" },
    { rel: "shortcut icon", href: "/icons/chaos-cartridge.svg?v=20261026-brand1", type: "image/svg+xml" },
    { rel: "apple-touch-icon", href: "/icons/chaos-cartridge.svg?v=20261026-brand1" }
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
  themeColor.content = "#080808";
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {}), { once: true });
  }

  // An update is announced, never forced in the middle of a chat or game.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    let updateToast = null;
    const showUpdate = registration => {
      if (!registration.waiting || !navigator.serviceWorker.controller || updateToast) return;
      if (!document.getElementById("kf-app-update-style")) {
        const style = document.createElement("style");
        style.id = "kf-app-update-style";
        style.textContent = '.kf-app-update{position:fixed;z-index:2147483000;bottom:max(1rem,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(92vw,540px);display:flex;align-items:center;justify-content:center;gap:.7rem;flex-wrap:wrap;padding:.85rem 1rem;border:1px solid #ff55d8;border-radius:14px;background:#140d20f5;color:#f9f3ff;box-shadow:0 8px 36px #000a;font:600 14px/1.45 system-ui,sans-serif}.kf-app-update span{flex:1 1 210px}.kf-app-update button{min-height:40px;padding:.5rem .8rem;border-radius:8px;border:1px solid #ff55d8;background:#ff55d8;color:#15071b;font:700 14px system-ui;cursor:pointer}.kf-app-update button:last-child{background:transparent;color:#f9f3ff}.kf-app-update button:focus-visible{outline:2px solid #a8ff3e;outline-offset:2px}@media(max-width:400px){.kf-app-update{bottom:max(.4rem,env(safe-area-inset-bottom));gap:.45rem}}';
        document.head.append(style);
      }
      updateToast = document.createElement("aside");
      updateToast.className = "kf-app-update";
      updateToast.setAttribute("role", "status");
      const message = document.createElement("span");
      message.textContent = "Ash-Fall update ready. Install it when you're done here.";
      const apply = document.createElement("button");
      apply.type = "button"; apply.textContent = "Update";
      const later = document.createElement("button");
      later.type = "button"; later.textContent = "Later";
      apply.addEventListener("click", () => {
        apply.disabled = true; apply.textContent = "Updating…";
        registration.waiting?.postMessage({type:"SKIP_WAITING"});
      });
      later.addEventListener("click", () => { updateToast.remove(); updateToast = null; });
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
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {});
      });
    }).catch(() => {});
    let updateActivated = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (updateActivated) return;
      updateActivated = true;
      if (updateToast) location.reload();
    });
  }

  // Persistent Miss Chaos companion loads before the shared header guard so pages without a nav still get her.
  if (!document.querySelector('script[data-miss-chaos-presence]')) {
    const companion = document.createElement("script");
    companion.src = "/miss-chaos-presence.js?v=20261026-presence5";
    companion.dataset.missChaosPresence = "true";
    document.head.append(companion);
  }

  const header = document.querySelector(".kf-header");
  if (!header) return;
  // Shared keyboard shortcut to bypass the site-wide navigation.
  const mainContent=document.querySelector("main");
  if(mainContent && !document.querySelector(".kf-skip-link")){
    if(!mainContent.id) mainContent.id="main-content";
    const skip=document.createElement("a");
    skip.className="kf-skip-link";
    skip.href="#"+mainContent.id;
    skip.textContent="Skip to content";
    header.before(skip);
  }
  header.innerHTML = `
    <a class="kf-brand" href="/index.html" aria-label="Ash-Fall home"><span>ASH</span><b>-FALL</b></a>
    <button class="kf-nav-toggle" type="button" aria-expanded="false" aria-controls="kf-primary-nav" aria-label="Open navigation">☰ <span>Menu</span></button>
    <nav id="kf-primary-nav" class="kf-nav" aria-label="Primary navigation">
      <a class="kf-nav-primary" href="/homepage.html">Explore</a>
      <a class="kf-nav-primary" href="/community.html">Forums</a>
      <a class="kf-nav-primary" href="/chaos-cartridge.html">Arcade</a>
      <a class="kf-nav-primary kf-messages-shortcut" href="/messages.html" hidden>Messages</a>
      <details class="kf-nav-group">
        <summary>Discover <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a href="/bots.html">Public Bots</a>
          <a href="/shops.html">Shops</a>
          <a href="/miss-chaos.html">Miss Chaos</a>
          <a href="/open-source-arsenal.html">Open Source</a>
          <a href="/social.html">Groups &amp; Activity</a>
          <a href="/members.html">Find Members</a>
          <a href="/adults.html">Adults Only (18+)</a>
          <a href="/dating.html">Dating Realm (18+)</a>
        </div>
      </details>
      <details class="kf-nav-group kf-profile-group" hidden>
        <summary>My Account <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu kf-profile-menu">
          <a class="kf-profile-link" href="/profile-edit.html">Edit Profile</a>
          <a href="/die-ary.html">Die-ary</a>
          <a href="/friends.html">Friends</a>
          <a class="kf-personal-bots-link" href="/personal-bots.html">Personal Bots</a>
          <a class="kf-vault-link" href="/vault.html">Private Vault</a>
          <a href="/my-shop.html">My Shop</a>
          <a class="kf-account-link" href="/account.html">Account Settings</a>
          <a href="/support.html">Support Ash-Fall</a>
          <a href="/user-agreement.html">Terms &amp; Policies</a>
          <a class="kf-notify" href="/notifications.html">Notifications <span class="kf-notify-badge" hidden>0</span></a>
          <a class="kf-admin-link" href="/admin.html" hidden>Admin Dashboard</a>
          <a class="kf-mod-link" href="/moderation.html" hidden>Moderation</a>
          <a class="kf-recovery-link" href="/moderation-accounts.html" hidden>Account Recovery</a>
          <a class="kf-my-profile-link" href="/profile.html">My Profile</a>
        </div>
      </details>
      <a class="kf-nav-primary kf-sign-in-link" href="/index.html">Sign In</a>
      <button class="kf-install-app" type="button" aria-label="Install Ash-Fall app">⬇ <span>Install App</span></button>
    </nav>`;

  const nav = header.querySelector(".kf-nav");
  // Keep orientation clear across the many sections of Ash-Fall.
  const normalizedPath = path => {
    const clean = path.replace(/\\/$/, "") || "/";
    return clean === "/" ? "/index.html" : clean;
  };
  const currentPath = normalizedPath(location.pathname);
  nav.querySelectorAll('a[href^="/"]').forEach(link => {
    const destination = normalizedPath(new URL(link.getAttribute("href"), location.origin).pathname);
    if (destination === currentPath) link.setAttribute("aria-current", "page");
  });
  // Indicate which grouped section contains the current page.
  nav.querySelectorAll(".kf-nav-group").forEach(group => {
    if (group.querySelector('a[aria-current="page"]')) {
      group.querySelector("summary")?.classList.add("kf-nav-section-current");
    }
  });
  nav.querySelectorAll(".kf-nav-group").forEach(group => {
    group.addEventListener("toggle", () => {
      if (group.open) nav.querySelectorAll(".kf-nav-group").forEach(other => { if (other !== group) other.open = false; });
    });
  });
  let siteSettings = null, currentUser = null, authResolved = false;
  // Auth and feature settings arrive independently. Wait for both before removing
  // profile links, otherwise a slow auth response can hide privileged navigation.
  function applyProfileVisibility() {
    if (!authResolved || siteSettings?.feature_profiles !== "false") return;
    if (currentUser && ["admin", "god"].includes(currentUser.role)) return;
    nav.querySelector(".kf-members-link")?.remove();
    nav.querySelectorAll(".kf-profile-link,.kf-my-profile-link").forEach(link => link.remove());
  }
  const toggle = header.querySelector(".kf-nav-toggle");
  const installButton = header.querySelector(".kf-install-app");
  const profileGroup = nav.querySelector(".kf-profile-group");
  const badge = nav.querySelector(".kf-notify-badge");
  let installPrompt = null;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault(); installPrompt = event;
    if (installButton) { installButton.hidden = false; installButton.innerHTML = "⬇ <span>Install Ash-Fall</span>"; }
  });
  installButton?.addEventListener("click", async () => {
    if (!installPrompt) {
      alert("To install Ash-Fall, open your browser menu (⋮ on Android/Chrome or Share on iPhone), then choose Install app or Add to Home Screen. If Ash-Fall is already installed, open it from your home screen.");
      return;
    }
    installPrompt.prompt();
    const choice = await installPrompt.userChoice.catch(() => null);
    installPrompt = null;
    if (choice?.outcome === "accepted") installButton.innerHTML = "✓ <span>Install requested</span>";
  });
  window.addEventListener("appinstalled", () => { installPrompt = null; if (installButton) { installButton.innerHTML = "✓ <span>App Installed</span>"; installButton.setAttribute("aria-label","Ash-Fall is installed"); } });
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
    nav.classList.toggle("open", !open);
  });
  // Keep the mobile menu navigable by keyboard and dismissible without hunting for the tiny toggle.
  const closeMobileMenu = () => {
    if (!nav.classList.contains("open")) return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    nav.querySelectorAll(".kf-nav-group[open]").forEach(group => group.removeAttribute("open"));
  };
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (nav.classList.contains("open")) {
      closeMobileMenu();
      toggle.focus();
    } else {
      const openGroup = nav.querySelector(".kf-nav-group[open]");
      if (openGroup) { openGroup.removeAttribute("open"); openGroup.querySelector("summary")?.focus(); }
    }
  });
  document.addEventListener("pointerdown", event => {
    if (!header.contains(event.target)) {
      closeMobileMenu();
      nav.querySelectorAll(".kf-nav-group[open]").forEach(group => group.open = false);
    }
  });
  // Close the drawer when keyboard focus leaves the entire header.
  header.addEventListener("focusout", () => {
    queueMicrotask(() => {
      if (!header.contains(document.activeElement)) {
        closeMobileMenu();
        nav.querySelectorAll(".kf-nav-group[open]").forEach(group => group.open = false);
      }
    });
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) closeMobileMenu();
  });
  window.addEventListener("popstate", closeMobileMenu);
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.querySelectorAll(".kf-nav-group").forEach(group => group.removeAttribute("open"));
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  function refreshNotifications() {
    fetch("https://api.ash-fall.com/api/notifications?unread=true&limit=1", {credentials:"include",cache:"no-store"})
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d || !badge) return;
        const count = Number(d.unread_count || 0);
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.hidden = count === 0;
      }).catch(() => {});
  }

  fetch("https://api.ash-fall.com/api/site-settings", {credentials:"include",cache:"no-store"})
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      siteSettings = d?.settings || null;
      if (!siteSettings) return;
      if (siteSettings.feature_miss_chaos === "false") nav.querySelector('a[href="/miss-chaos.html"]')?.remove();
      applyProfileVisibility();
      if (siteSettings.announcements_enabled === "true" && (siteSettings.announcement_title || siteSettings.announcement_body)) {
        const banner = document.createElement("aside");
        banner.className = "kf-announcement";
        const heading = document.createElement("strong");
        heading.textContent = siteSettings.announcement_title || "Knightfall";
        const message = document.createElement("span");
        message.textContent = siteSettings.announcement_body || "";
        banner.append(heading, message);
        document.body.prepend(banner);
      }
      if (siteSettings.maintenance_mode === "true") {
        const banner = document.createElement("aside");
        banner.className = "kf-maintenance";
        banner.textContent = "Knightfall is in maintenance mode. Administrator access remains available.";
        document.body.prepend(banner);
      }
    }).catch(() => {});

  fetch("https://api.ash-fall.com/api/auth/me", {credentials:"include",cache:"no-store"})
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d?.user) {
        authResolved = true;
        applyProfileVisibility();
        // Signed-out visitors still see the grouped destinations, but not private tools.
        nav.querySelector(".kf-personal-bots-link")?.remove();
        nav.querySelector(".kf-messages-shortcut")?.remove();
        nav.querySelector(".kf-vault-link")?.remove();
        nav.querySelector(".kf-my-profile-link")?.remove();
        return;
      }
      profileGroup.hidden = false;
      const messageShortcut=nav.querySelector(".kf-messages-shortcut");
      if(messageShortcut) messageShortcut.hidden=false;
      nav.querySelector(".kf-sign-in-link")?.remove();
      currentUser = d.user;
      authResolved = true;
      applyProfileVisibility();
      const user = currentUser;
      if (user.status === "suspended" || user.status === "banned") nav.querySelector(".kf-personal-bots-link")?.remove();
      if (!(["admin","god"].includes(user.role) && user.username === "knightfall")) nav.querySelector(".kf-vault-link")?.remove();
      if (["admin","god"].includes(user.role)) {
        const adminLink = nav.querySelector(".kf-admin-link");
        if (adminLink) adminLink.hidden = false;
      }
      if (["admin","moderator","god"].includes(user.role)) {
        const modLink = nav.querySelector(".kf-mod-link");
        const recoveryLink = nav.querySelector(".kf-recovery-link");
        if (modLink) modLink.hidden = false;
        if (recoveryLink) recoveryLink.hidden = false;
      }
      const myProfile = nav.querySelector(".kf-my-profile-link");
      if (myProfile) myProfile.href = "/profile.html?username=" + encodeURIComponent(user.username);
      refreshNotifications();
      setInterval(refreshNotifications, 45000);
      const pingActivity = () => fetch("https://api.ash-fall.com/api/activity/ping", {method:"POST",credentials:"include"}).catch(() => {});
      pingActivity();
      setInterval(pingActivity, 120000);
    }).catch(() => {
      authResolved = true;
      applyProfileVisibility();
      nav.querySelector(".kf-personal-bots-link")?.remove();
      nav.querySelector(".kf-messages-shortcut")?.remove();
      nav.querySelector(".kf-vault-link")?.remove();
      nav.querySelector(".kf-my-profile-link")?.remove();
    });
})();