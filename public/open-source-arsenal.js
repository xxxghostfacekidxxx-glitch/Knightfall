(() => {
  const search = document.getElementById("project-search");
  const cards = [...document.querySelectorAll(".project-card")];
  const buttons = [...document.querySelectorAll(".filter-button")];
  const count = document.getElementById("result-count");
  const empty = document.getElementById("no-results");
  let category = "all";
  const update = () => {
    const query = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const matchesCategory = category === "all" || card.dataset.category === category;
      const matchesQuery = !query || (card.dataset.search + " " + card.textContent).toLowerCase().includes(query);
      const show = matchesCategory && matchesQuery;
      card.hidden = !show;
      if (show) visible++;
    });
    if (count) count.textContent = visible + (visible === 1 ? " project" : " projects");
    if (empty) empty.hidden = visible !== 0;
  };
  search?.addEventListener("input", update);
  buttons.forEach(button => button.addEventListener("click", () => {
    category = button.dataset.filter || "all";
    buttons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    update();
  }));
  update();
})();