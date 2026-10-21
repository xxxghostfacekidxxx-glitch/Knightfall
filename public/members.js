(() => {
  "use strict";
  const API = "https://api.ash-fall.com";
  const root = document.querySelector("#members");
  const search = document.querySelector("#search");
  const presenceFilter = document.querySelector("#presence-filter");
  const sortFilter = document.querySelector("#sort-filter");
  const status = document.querySelector("#directory-status");
  const count = document.querySelector("#member-count");
  const onlineCount = document.querySelector("#online-count");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
  const isOnline = user => Boolean(user.last_seen_at && Date.now() - new Date(user.last_seen_at).getTime() < 300000);
  let users = [];
  let requestNumber = 0;
  let timer;

  function memberCard(user) {
    const online = isOnline(user);
    const displayName = user.display_name || user.username || "Unknown member";
    const initials = displayName.trim().slice(0, 1).toUpperCase() || "?";
    const avatar = user.avatar_url
      ? '<img class="member-avatar-image" src="' + esc(user.avatar_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
      : '<span class="member-avatar-fallback" aria-hidden="true">' + esc(initials) + '</span>';
    const bio = String(user.bio || "").trim();
    return '<article class="member-card">' +
      '<a class="member-main" href="/profile.html?username=' + encodeURIComponent(user.username || "") + '" aria-label="View ' + esc(displayName) + '’s profile">' +
        '<span class="member-avatar ' + (online ? "is-online" : "") + '">' + avatar + '</span>' +
        '<span class="member-copy"><strong>' + esc(displayName) + '</strong><span class="member-handle">@' + esc(user.username || "unknown") + '</span>' +
        (bio ? '<span class="member-bio">' + esc(bio) + '</span>' : '<span class="member-bio member-bio-empty">Keeping their lore mysterious.</span>') +
        '<span class="member-meta"><span class="presence-dot ' + (online ? "online" : "") + '"></span>' + (online ? "Recently active" : "Away") + '<span class="meta-divider">·</span>' + esc(user.role || "member") + '</span>' +
      '</span></a>' +
      '<div class="member-card-footer"><span><strong>' + Number(user.followers || 0) + '</strong> followers</span><a href="/profile.html?username=' + encodeURIComponent(user.username || "") + '">View profile <span aria-hidden="true">↗</span></a></div>' +
    '</article>';
  }

  function visibleUsers() {
    let list = [...users];
    const presence = presenceFilter.value;
    if (presence === "online") list = list.filter(isOnline);
    if (presence === "offline") list = list.filter(user => !isOnline(user));
    switch (sortFilter.value) {
      case "name": list.sort((a,b) => String(a.display_name || a.username).localeCompare(String(b.display_name || b.username))); break;
      case "followers": list.sort((a,b) => Number(b.followers || 0) - Number(a.followers || 0)); break;
      case "newest": list.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
      default: list.sort((a,b) => Number(isOnline(b)) - Number(isOnline(a)) || new Date(b.last_seen_at || 0) - new Date(a.last_seen_at || 0));
    }
    return list;
  }

  function render() {
    const list = visibleUsers();
    count.textContent = String(list.length);
    onlineCount.textContent = String(users.filter(isOnline).length);
    root.setAttribute("aria-busy", "false");
    if (!list.length) {
      root.innerHTML = '<div class="directory-empty"><span aria-hidden="true">☻</span><h2>No matching weirdos.</h2><p>Try a different search or loosen the filters. The void is not usually this empty.</p><button type="button" id="clear-filters">Clear filters</button></div>';
      document.querySelector("#clear-filters").addEventListener("click", () => {
        search.value = ""; presenceFilter.value = "all"; sortFilter.value = "active"; load();
      });
      status.textContent = users.length ? "No members match these filters." : "No members found yet.";
      return;
    }
    root.innerHTML = list.map(memberCard).join("");
    status.textContent = "Showing " + list.length + " " + (list.length === 1 ? "member" : "members") + ".";
  }

  async function load() {
    const currentRequest = ++requestNumber;
    root.setAttribute("aria-busy", "true");
    status.textContent = "Searching the inhabitants…";
    try {
      const query = encodeURIComponent(search.value.trim());
      const response = await fetch(API + "/api/discover?q=" + query + "&limit=50", { credentials:"include", cache:"no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Member directory returned " + response.status + ".");
      if (currentRequest !== requestNumber) return;
      users = Array.isArray(data.users) ? data.users : [];
      render();
    } catch (error) {
      if (currentRequest !== requestNumber) return;
      root.setAttribute("aria-busy", "false");
      root.innerHTML = '<div class="directory-empty"><span aria-hidden="true">⚠</span><h2>The directory is being difficult.</h2><p>' + esc(error.message || "Unable to load members.") + '</p><button type="button" id="retry-members">Try again</button></div>';
      status.textContent = "Could not load members.";
      document.querySelector("#retry-members").addEventListener("click", load);
    }
  }

  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(load, 220);
  });
  presenceFilter.addEventListener("change", render);
  sortFilter.addEventListener("change", render);
  load();
})();
