"use strict";

function initializeMenu() {
  const menu = document.querySelector(".menu");
  const nav = document.querySelector("#primary-nav");

  function closeMenu() {
    menu.setAttribute("aria-expanded", "false");
  }

  menu.hidden = false;
  menu.addEventListener("click", () => {
    menu.setAttribute("aria-expanded", String(menu.getAttribute("aria-expanded") !== "true"));
  });
  nav.addEventListener("click", closeMenu);
  window.matchMedia("(max-width: 900px)").addEventListener("change", closeMenu);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menu.focus();
    }
  });
}

function observeReadingRows() {
  const rows = document.querySelectorAll(".area-list li, .news-list li, .people-section .person-card");
  if (!rows.length || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("entered");
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: "0px 0px -5% 0px" });
  for (const row of rows) {
    observer.observe(row);
  }
}

function initializePublicationMotion(reducedMotion) {
  const controls = document.querySelector(".publications-page .filter-options");
  if (!controls) return;
  const list = document.querySelector(".publication-list");
  let selected;
  let animations = [];

  function stopAnimations() {
    for (const animation of animations) animation.cancel();
    animations = [];
  }

  function showSelection(animate) {
    // The button's filter handler has already updated the accessible selection and visible rows.
    const next = controls.querySelector('[aria-pressed="true"]');
    if (next === selected) return;
    selected = next;
    stopAnimations();
    if (!animate || reducedMotion.matches || !Element.prototype.animate) return;
    const visible = list.querySelectorAll(".publication-item:not([hidden])");
    const firstRows = Array.from(visible).slice(0, 3);
    animations = firstRows.map((row, index) => row.animate([
      { opacity: 0.68, transform: "translateY(6px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 260, delay: index * 35, easing: "ease-out", fill: "backwards" }));
  }

  controls.addEventListener("click", () => showSelection(true));
  reducedMotion.addEventListener("change", stopAnimations);
  // The shared filters populate their initial URL state before this listener.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => showSelection(false), { once: true });
  } else {
    showSelection(false);
  }
}

function progressFraction(value) {
  return Math.max(0, Math.min(1, value));
}

function nearestHighlight(rows, headerHeight) {
  const readingLine = window.innerHeight * 0.52;
  let nearest = null;
  let distance = Infinity;
  for (const row of rows) {
    const box = row.getBoundingClientRect();
    const delta = Math.abs(box.top + box.height / 2 - readingLine);
    if (box.bottom > headerHeight && box.top < window.innerHeight && delta < distance) {
      nearest = row;
      distance = delta;
    }
  }
  return nearest;
}

function initializeHomeMotion() {
  const campus = document.querySelector(".campus-stage img");
  if (!campus) return null;

  const hero = campus.closest(".hero");
  const blossom = document.querySelector(".contact-art img");
  const newsRows = document.querySelectorAll(".news-list li");
  const smallScreen = window.matchMedia("(max-width: 680px)");
  let currentRow = null;

  function updateHome(headerHeight, reduceMotion) {
    const nextRow = nearestHighlight(newsRows, headerHeight);
    if (nextRow !== currentRow) {
      currentRow?.classList.remove("in-view");
      nextRow?.classList.add("in-view");
      currentRow = nextRow;
    }
    if (reduceMotion) return;
    const bounds = hero.getBoundingClientRect();
    const leavingHero = progressFraction(-bounds.top / bounds.height);
    const contactTop = blossom.parentElement.getBoundingClientRect().top;
    const blossomProgress = progressFraction((window.innerHeight - contactTop) / (window.innerHeight * 0.72));
    const drift = smallScreen.matches ? 25 : 65;

    hero.style.setProperty("--campus-offset", (-leavingHero * drift).toFixed(1) + "px");
    hero.style.setProperty("--ground-offset", (leavingHero * drift * 0.56).toFixed(1) + "px");
    blossom.style.setProperty("--blossom-angle", (blossomProgress * 6 - 3).toFixed(2) + "deg");
  }

  if (new URLSearchParams(window.location.search).get("ecc") === "original") {
    campus.src = new URL("ecc-original-linework.webp", campus.src).href;
    campus.alt = "Line drawing of two roofs framing the glass-lined central walkway of the Ewha Campus Complex.";
  }
  return updateHome;
}

function initializeReadingProgress(header, updateHome, reducedMotion) {
  let frame = 0;

  function draw() {
    frame = 0;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty("--reading-progress", total > 0 ? progressFraction(window.scrollY / total) : 0);
    if (updateHome) updateHome(header.offsetHeight, reducedMotion.matches);
  }

  function queueDrawing() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  window.addEventListener("scroll", queueDrawing, { passive: true });
  window.addEventListener("resize", queueDrawing);
  window.addEventListener("load", queueDrawing);
  reducedMotion.addEventListener("change", queueDrawing);
  if ("ResizeObserver" in window) {
    // Filtering the publication list can change the scroll range without a scroll event.
    new ResizeObserver(queueDrawing).observe(document.querySelector("main"));
  }
  draw();
}

function initializeDesign() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  initializeMenu();
  observeReadingRows();
  initializePublicationMotion(reducedMotion);
  const updateHome = initializeHomeMotion();
  initializeReadingProgress(document.querySelector(".masthead"), updateHome, reducedMotion);
}

initializeDesign();
