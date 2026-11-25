/* Progressive enhancement for the static prototype. */
(() => {
  "use strict";

  const normalize = (value) => String(value || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();

  function setupMenu() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function setupFilters(section) {
    const search = section.querySelector("[data-search]");
    const selectors = Array.from(section.querySelectorAll("[data-filter]"));
    const tabs = Array.from(section.querySelectorAll("[data-filter-key][data-filter-value]"));
    const tabKeys = Array.from(new Set(tabs.map((tab) => tab.dataset.filterKey)));
    const selectedTabs = {};
    const items = Array.from(section.querySelectorAll("[data-item]"));
    const count = section.querySelector("[data-result-count]");
    const emptyState = section.querySelector("[data-empty-results]");
    const reset = section.querySelector("[data-reset-filters]");
    const params = new URLSearchParams(window.location.search);

    if (search && params.has("q")) search.value = params.get("q");
    selectors.forEach((control) => {
      const candidate = params.get(control.dataset.filter);
      if (candidate === null) return;
      const option = Array.from(control.options || []).find((entry) => normalize(entry.value) === normalize(candidate));
      if (option) control.value = option.value;
    });
    tabKeys.forEach((key) => {
      const candidate = normalize(params.get(key));
      const matchingTab = tabs.find((tab) => tab.dataset.filterKey === key && normalize(tab.dataset.filterValue) === candidate);
      selectedTabs[key] = matchingTab ? matchingTab.dataset.filterValue : "";
    });

    const indexed = items.map((item) => ({
      element: item,
      searchText: normalize(item.dataset.searchText || item.textContent),
    }));

    function updateUrl() {
      if (!tabs.length) return;
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      url.searchParams.delete("year");
      ["category", "status", "affiliation"].forEach((key) => {
        if (!tabKeys.includes(key)) url.searchParams.delete(key);
      });
      tabKeys.forEach((key) => {
        if (selectedTabs[key]) url.searchParams.set(key, selectedTabs[key]);
        else url.searchParams.delete(key);
      });
      try {
        window.history.replaceState(window.history.state, "", url);
      } catch (_) {
        // Filtering also works when a browser restricts history for local files.
      }
    }

    function applyFilters() {
      const query = normalize(search ? search.value : "");
      const terms = query.split(" ").filter(Boolean);
      const selected = selectors.map((control) => ({
        key: control.dataset.filter,
        value: normalize(control.value),
      })).concat(tabKeys.map((key) => ({ key, value: normalize(selectedTabs[key]) })))
        .filter((filter) => filter.value && filter.value !== "all");

      let visible = 0;
      indexed.forEach(({ element, searchText }) => {
        const matchesSearch = terms.every((term) => searchText.includes(term));
        const matchesFilters = selected.every(({ key, value }) => normalize(element.dataset[key]) === value);
        const matches = matchesSearch && matchesFilters;
        element.hidden = !matches;
        if (matches) visible += 1;
      });
      if (count) count.textContent = `${visible} / ${items.length} items`;
      if (emptyState) emptyState.hidden = visible !== 0;
      tabs.forEach((tab) => {
        const key = tab.dataset.filterKey;
        const value = normalize(tab.dataset.filterValue);
        tab.setAttribute("aria-pressed", String(value === normalize(selectedTabs[key])));
        const tabCount = tab.querySelector(".filter-tab-count");
        if (!tabCount) return;
        const otherFilters = selected.filter((filter) => filter.key !== key);
        const matchingItems = indexed.filter(({ element, searchText }) =>
          terms.every((term) => searchText.includes(term)) &&
          otherFilters.every((filter) => normalize(element.dataset[filter.key]) === filter.value) &&
          (!value || value === "all" || normalize(element.dataset[key]) === value)
        );
        tabCount.textContent = String(matchingItems.length);
      });
      updateUrl();
    }

    if (search) search.addEventListener("input", applyFilters);
    selectors.forEach((control) => control.addEventListener("change", applyFilters));
    tabs.forEach((tab) => tab.addEventListener("click", (event) => {
      event.preventDefault();
      selectedTabs[tab.dataset.filterKey] = tab.dataset.filterValue;
      applyFilters();
    }));
    if (reset) reset.addEventListener("click", (event) => {
      event.preventDefault();
      if (search) search.value = "";
      selectors.forEach((control) => {
        const all = Array.from(control.options || []).find((option) => !option.value || normalize(option.value) === "all");
        control.value = all ? all.value : "";
      });
      tabKeys.forEach((key) => { selectedTabs[key] = ""; });
      applyFilters();
      if (search) search.focus();
    });
    section.querySelectorAll("form").forEach((form) => form.addEventListener("submit", (event) => event.preventDefault()));
    applyFilters();
  }

  function initialize() {
    setupMenu();
    document.querySelectorAll("[data-filter-list]").forEach(setupFilters);
    document.documentElement.classList.add("js");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
