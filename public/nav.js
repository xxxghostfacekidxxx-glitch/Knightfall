(() => {
  // Shared PWA setup.
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

  const header = document.querySelector(".kf-header");
  if (!header) return;
  header.innerHTML = `
    <a class="kf-brand" href="/index.html" aria-label="Ash-Fall home"><span>ASH</span><b>-FALL</b></a>
    <button class="kf-nav-toggle" type="button" aria-expanded="false" aria-controls="kf-primary-nav" aria-label="Open navigation">☰ <span>Menu</span></button>
    <nav id="kf-primary-nav" class="kf-nav" aria-label="Primary navigation">
      <a class="kf-nav-primary" href="/homepage.html">Explore</a>
      <a class="kf-nav-primary" href="/community.html">The Madhouse</a>
      <a class="kf-nav-primary" href="/chaos-cartridge.html">Games</a>
      <details class="kf-nav-group">
        <summary>Creations <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a href="/bots.html">Public Bots</a>
          <a href="/shops.html">Shops &amp; Dropshipping</a>
          <a href="/miss-chaos.html">Miss Chaos</a>
          <a href="/open-source-arsenal.html">Open-Source Arsenal</a>
        </div>
      </details>
      <details class="kf-nav-group kf-profile-group">
        <summary>My Profile <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu kf-profile-menu">
          <a class="kf-profile-link" href="/die-ary.html">Die-ary</a>
          <a class="kf-members-link" href="/members.html">Members</a>
          <a href="/messages.html">Messages</a>
          <a href="/friends.html">Friends</a>
          <a class="kf-personal-bots-link" href="/personal-bots.html">Personal Bots</a>
          <a class="kf-vault-link" href="/vault.html">Private Vault</a>
          <a href="/my-shop.html">My Shop</a>
          <a class="kf-account-link" href="/account.html">Account</a>
          <a class="kf-notify" href="/notifications.html">Notifications <span class="kf-notify-badge" hidden>0</span></a>
          <a class="kf-admin-link" href="/admin.html" hidden>Admin Dashboard</a>
          <a class="kf-mod-link" href="/moderation.html" hidden>Moderation</a>
          <a class="kf-recovery-link" href="/moderation-accounts.html" hidden>Account Recovery</a>
          <a class="kf-my-profile-link" href="/profile.html">View My Public Profile</a>
        </div>
      </details>
      <button class="kf-install-app" type="button" hidden>Install App</button>
    </nav>`;

  let siteSettings = null, currentUser = null;
  const toggle = header.querySelector(".kf-nav-toggle");
  const nav = header.querySelector(".kf-nav");
  const installButton = header.querySelector(".kf-install-app");
  const profileGroup = nav.querySelector(".kf-profile-group");
  const badge = nav.querySelector(".kf-notify-badge");
  let installPrompt = null;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault(); installPrompt = event;
    if (installButton) installButton.hidden = false;
  });
  installButton?.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    installPrompt = null; installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => { installPrompt = null; if (installButton) installButton.hidden = true; });
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
    nav.classList.toggle("open", !open);
  });
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
      if (siteSettings.feature_profiles === "false") {
        nav.querySelector(".kf-members-link")?.remove();
        nav.querySelectorAll(".kf-profile-link,.kf-my-profile-link").forEach(link => link.remove());
      }
      if (siteSettings.announcements_enabled === "true" && (siteSettings.announcement_title || siteSettings.announcement_body)) {
        const escape = value => String(value || "").replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
        const banner = document.createElement("aside");
        banner.className = "kf-announcement";
        banner.innerHTML = "<strong>" + escape(siteSettings.announcement_title || "Knightfall") + "</strong><span>" + escape(siteSettings.announcement_body) + "</span>";
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
        // Signed-out visitors still see the grouped destinations, but not private tools.
        nav.querySelector(".kf-personal-bots-link")?.remove();
        nav.querySelector(".kf-vault-link")?.remove();
        nav.querySelector(".kf-my-profile-link")?.remove();
        return;
      }
      currentUser = d.user;
      const user = currentUser;
      if (siteSettings?.feature_profiles === "false" && user.role !== "admin") {
        nav.querySelector(".kf-members-link")?.remove();
        nav.querySelectorAll(".kf-profile-link,.kf-my-profile-link").forEach(link => link.remove());
      }
      if (user.status === "suspended" || user.status === "banned") nav.querySelector(".kf-personal-bots-link")?.remove();
      if (!(user.role === "admin" && user.username === "knightfall")) nav.querySelector(".kf-vault-link")?.remove();
      if (user.role === "admin") nav.querySelector(".kf-admin-link").hidden = false;
      if (["admin","moderator"].includes(user.role)) {
        nav.querySelector(".kf-mod-link").hidden = false;
        nav.querySelector(".kf-recovery-link").hidden = false;
      }
      const myProfile = nav.querySelector(".kf-my-profile-link");
      if (myProfile) myProfile.href = "/profile.html?username=" + encodeURIComponent(user.username);
      if (siteSettings?.feature_profiles === "false" && user.role !== "admin") {
        nav.querySelector(".kf-profile-link")?.remove();
        nav.querySelector(".kf-my-profile-link")?.remove();
      }
      refreshNotifications();
      setInterval(refreshNotifications, 45000);
      const pingActivity = () => fetch("https://api.ash-fall.com/api/activity/ping", {method:"POST",credentials:"include"}).catch(() => {});
      pingActivity();
      setInterval(pingActivity, 120000);
    }).catch(() => {
      nav.querySelector(".kf-personal-bots-link")?.remove();
      nav.querySelector(".kf-vault-link")?.remove();
      nav.querySelector(".kf-my-profile-link")?.remove();
    });
})();