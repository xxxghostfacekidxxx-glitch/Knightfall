/* Community standings for Chaos Cartridge. All scores come from the authenticated/public arcade API. */
(() => {
  "use strict";
  const root = document.getElementById("arcade-leaderboards");
  if (!root) return;

  const byId = id => document.getElementById(id);
  const select = byId("arcade-lb-game");
  const refresh = byId("arcade-lb-refresh");
  const status = byId("arcade-lb-status");
  const podium = byId("arcade-lb-podium");
  const duel = byId("arcade-lb-duel");
  const champions = byId("arcade-lb-champions");
  const summary = byId("arcade-lb-summary");
  const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const formatScore = value => number.format(Math.max(0, Number(value) || 0));
  const validKey = key => typeof key === "string" && /^[a-z0-9-]{1,90}$/.test(key);
  const catalog = new Map();
  document.querySelectorAll("#game-shelf [data-game-id]").forEach(card => {
    const id = card.getAttribute("data-game-id");
    if (!validKey(id)) return;
    const href = card.querySelector(".flat-actions a[href]")?.getAttribute("href") || "";
    const data = {
      title: card.querySelector("h2,h3")?.textContent?.trim() || id,
      href: href.startsWith("/") && !href.startsWith("//") ? href : ""
    };
    catalog.set(id, data);
    if (!id.startsWith("cabinet-")) catalog.set("cabinet-" + id, data);
  });

  let boards = [];
  let signedIn = false;
  let lastLoaded = 0;
  let loading = false;

  function info(key) {
    return catalog.get(key) ||
      { title: key.replace(/^cabinet-/, "").split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "), href: "" };
  }
  function name(row) {
    return row?.display_name?.trim() || row?.username?.trim() || "Arcade player";
  }
  function dateLabel(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Record held";
  }
  function gameLink(board, label) {
    const target = info(board.key);
    return target.href
      ? '<a class="arcade-lb-play" href="' + escapeHtml(target.href) + '">' + escapeHtml(label || "Challenge this score") + " ↗</a>"
      : '<a class="arcade-lb-play" href="/chaos-cartridge.html#game-shelf">Find a game ↗</a>';
  }
  function buildBoards(entries) {
    const map = new Map();
    for (const raw of entries) {
      if (!raw || !validKey(raw.game_key)) continue;
      const position = Number(raw.place);
      const score = Number(raw.best_score);
      const players = Number(raw.player_count);
      if (!Number.isSafeInteger(position) || position < 1 ||
          !Number.isSafeInteger(score) || score < 0 ||
          !Number.isSafeInteger(players) || players < position) continue;
      let board = map.get(raw.game_key);
      if (!board) {
        board = { key: raw.game_key, players, top: [], mine: null, updated: String(raw.last_played_at || "") };
        map.set(raw.game_key, board);
      }
      const row = {
        place: position, score, players,
        username: String(raw.username || ""), display_name: String(raw.display_name || ""),
        achieved_at: String(raw.achieved_at || ""), isMine: Boolean(Number(raw.is_mine))
      };
      if (position <= 3 && !board.top.some(x => x.place === position)) board.top.push(row);
      if (row.isMine) board.mine = row;
      board.players = Math.max(board.players, players);
    }
    return [...map.values()].map(board => {
      board.top.sort((a, b) => a.place - b.place);
      return board;
    }).filter(board => board.top.some(row => row.place === 1))
      .sort((a, b) => b.players - a.players || b.updated.localeCompare(a.updated) ||
        info(a.key).title.localeCompare(info(b.key).title));
  }
  function boardRow(row, className) {
    return '<li class="arcade-lb-entry ' + (className || "") + (row.isMine ? " is-you" : "") + '">' +
      '<span class="arcade-lb-position" aria-label="Rank ' + row.place + '">' +
      (row.place === 1 ? "🏆" : row.place === 2 ? "🥈" : row.place === 3 ? "🥉" : "#" + row.place) + "</span>" +
      '<span class="arcade-lb-person"><strong>' + escapeHtml(name(row)) +
      (row.isMine ? ' <span class="arcade-lb-you">YOU</span>' : "") + "</strong>" +
      '<small>#' + row.place + " of " + row.players + " · " + formatScore(row.score) + " points</small></span>" +
      '<strong class="arcade-lb-score">' + formatScore(row.score) + "</strong></li>";
  }
  function renderBoard(key) {
    const board = boards.find(b => b.key === key) || boards[0];
    if (!board) return;
    const leader = board.top[0];
    const mine = board.mine;
    const title = info(board.key).title;
    byId("arcade-lb-board-title").textContent = title;
    byId("arcade-lb-board-desc").textContent = board.players + (board.players === 1 ? " ranked player" : " ranked players") +
      " · Highest submitted score wins this board.";
    podium.innerHTML = '<ol class="arcade-lb-entries">' +
      board.top.map(row => boardRow(row, row.place === 1 ? "is-champion" : "")).join("") +
      (mine && mine.place > 3 ? boardRow(mine, "is-pinned") : "") + "</ol>";
    if (!signedIn) {
      duel.innerHTML = '<p class="arcade-lb-eyebrow">YOUR CHALLENGE</p><h4>Got what it takes?</h4>' +
        '<p>Community record: <strong>' + formatScore(leader.score) + "</strong>. Sign in to save your scores and see your rank.</p>" +
        '<a class="arcade-lb-play" href="/auth.html?next=%2Fchaos-cartridge.html">Sign in to compete ↗</a>';
    } else if (!mine) {
      duel.innerHTML = '<p class="arcade-lb-eyebrow">YOUR CHALLENGE</p><h4>Your turn to make history.</h4>' +
        '<p>You have no submitted score for this game yet. The community record is <strong>' +
        formatScore(leader.score) + "</strong>.</p>" + gameLink(board, "Play for a rank");
    } else {
      const gap = Math.max(0, leader.score - mine.score);
      const percentage = leader.score > 0 ? Math.max(0, Math.min(100, mine.score / leader.score * 100)) : 100;
      const crowned = mine.place === 1;
      duel.innerHTML = '<p class="arcade-lb-eyebrow">YOU VS THE COMMUNITY</p>' +
        '<h4>' + (crowned ? "👑 You hold the crown!" : "Rank #" + mine.place + " of " + board.players) + "</h4>" +
        '<div class="arcade-lb-duel-values"><div><span>Your personal best</span><strong>' +
        formatScore(mine.score) + '</strong></div><div><span>Community record</span><strong>' +
        formatScore(leader.score) + "</strong></div></div>" +
        '<div class="arcade-lb-meter" role="progressbar" aria-label="Your best score compared with the community record" ' +
        'aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(percentage) +
        '"><span style="width:' + percentage.toFixed(1) + '%"></span></div>' +
        '<p>' + (crowned
          ? "Nobody has beaten your top score on this board. Defend it!"
          : gap === 0
            ? "You tied the top score. An earlier record holds the tiebreak."
            : formatScore(gap) + " points behind the record. Go take a shot.") + "</p>" +
        gameLink(board, crowned ? "Defend your record" : "Challenge the record");
    }
  }
  function renderChampions() {
    const winners = boards.filter(board => board.top[0]).map(board => ({
      board, row: board.top[0]
    })).sort((a, b) =>
      (Date.parse(b.row.achieved_at) || 0) - (Date.parse(a.row.achieved_at) || 0)
    ).slice(0, 4);
    champions.innerHTML = winners.map(({ board, row }) => {
      const isRecent = Date.now() - Date.parse(row.achieved_at) < 7 * 86400000 &&
        Date.now() >= Date.parse(row.achieved_at);
      return '<li class="arcade-lb-celebration"><span class="arcade-lb-celebrate-icon" aria-hidden="true">' +
        (isRecent ? "✨" : "👑") + '</span><span><strong>' + escapeHtml(name(row)) +
        "</strong> owns the <b>" + escapeHtml(info(board.key).title) +
        '</b> record <small>' + formatScore(row.score) + " points · " + dateLabel(row.achieved_at) +
        (isRecent ? " · NEW CROWN" : "") + "</small></span></li>";
    }).join("") || '<li class="arcade-lb-empty">Nobody has claimed a record yet.</li>';
  }
  function render() {
    const current = select.value;
    const mine = boards.filter(board => Boolean(board.mine));
    const firsts = mine.filter(board => board.mine.place === 1).length;
    const standings = boards.reduce((total, board) => total + board.players, 0);
    byId("arcade-lb-records").textContent = number.format(standings);
    byId("arcade-lb-games").textContent = number.format(boards.length);
    byId("arcade-lb-yours").textContent = signedIn ? mine.length + " ranked · " + firsts + " crowns" : "Sign in";
    select.replaceChildren(...boards.map(board => {
      const option = document.createElement("option");
      option.value = board.key;
      option.textContent = info(board.key).title + (board.mine ? " · your #" + board.mine.place : "");
      return option;
    }));
    const desired = new URLSearchParams(location.search).get("board");
    select.value = boards.some(board => board.key === current) ? current :
      boards.some(board => board.key === desired) ? desired : boards[0].key;
    renderBoard(select.value);
    renderChampions();
    root.classList.add("arcade-lb-loaded");
    status.textContent = "Community standings loaded. " + boards.length + " games with submitted records.";
  }
  async function load() {
    if (loading) return;
    loading = true;
    refresh.disabled = true;
    status.textContent = "Refreshing community records…";
    try {
      const response = await fetch("https://api.ash-fall.com/api/arcade/leaderboards", {
        credentials: "include", cache: "no-store", headers: { "accept": "application/json" }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Score service unavailable.");
      if (!Array.isArray(payload.entries)) throw new Error("Invalid leaderboard response.");
      signedIn = payload.viewer_signed_in === true;
      boards = buildBoards(payload.entries);
      if (!boards.length) {
        root.classList.remove("arcade-lb-loaded");
        status.textContent = "No community scores yet. The first record is still waiting to be claimed.";
        summary.hidden = false;
        byId("arcade-lb-records").textContent = "0";
        byId("arcade-lb-games").textContent = "0";
        byId("arcade-lb-yours").textContent = signedIn ? "0 ranked" : "Sign in";
        champions.innerHTML = '<li class="arcade-lb-empty">The hall of fame is yours to open.</li>';
      } else {
        summary.hidden = false;
        render();
      }
      lastLoaded = Date.now();
    } catch (error) {
      status.textContent = "Leaderboards are unavailable right now. Games remain playable. " + error.message;
    } finally {
      loading = false;
      refresh.disabled = false;
    }
  }
  select.addEventListener("change", () => {
    renderBoard(select.value);
    const url = new URL(location.href);
    url.searchParams.set("board", select.value);
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  });
  refresh.addEventListener("click", load);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && lastLoaded && Date.now() - lastLoaded > 120000) load();
  });
  load();
})();
