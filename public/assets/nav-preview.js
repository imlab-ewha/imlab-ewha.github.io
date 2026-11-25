function initializeNavigationShortcuts() {
  const nav = document.querySelector('#site-nav, #primary-nav');
  if (!nav) return;

  const shortcuts = {
    people: [
      ['Director', 'yerim-choi/index.html', 'directorHref'],
      ['Graduate Students', '#graduate-students'],
      ['Alumni', 'alumni/index.html', 'alumniHref'],
    ],
    publications: [
      ['Journal', '?category=journal'],
      ['Conference', '?category=conference'],
      ['Patent & Software', '?category=patent-software'],
      ['Thesis', '?category=thesis'],
      ['Magazine / Book', '?category=magazine-book'],
    ],
    projects: [
      ['Current Projects', '?status=current'],
      ['Past Projects', '?status=past'],
    ],
    news: [
      ['Highlights', 'index.html'],
      ['Media Coverage', 'press/index.html'],
      ['Talks & Presentations', 'talks/index.html'],
      ['Gallery', 'gallery/index.html'],
    ],
    courses: [
      ['Current Semester', '#current-semester'],
      ['Archive', '#archive'],
      ['Previous Semesters', '#previous-semesters'],
    ],
  };

  const links = Array.from(nav.querySelectorAll('a[href]'));
  const entries = new Map();
  for (const link of links) {
    const path = new URL(link.href).pathname.replace(/\/(?:index\.html)?$/, '');
    const section = path.split('/').pop();
    if (shortcuts[section]) entries.set(link, shortcuts[section]);
  }
  if (!entries.size) return;

  const desktop = window.matchMedia('(min-width: 901px)');
  const hover = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const host = nav.parentElement;
  const panel = document.createElement('nav');

  let active = null;
  let closeTimer;
  let returningFocus = false;

  function placePanel() {
    if (!active) return;
    const rect = active.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const panelInset = parseFloat(getComputedStyle(panel).paddingLeft);
    const labelLeft = rect.left + parseFloat(getComputedStyle(active).paddingLeft);
    const left = Math.max(hostRect.left, Math.min(labelLeft - panelInset, hostRect.right - panel.offsetWidth));
    panel.style.left = (left - hostRect.left) + 'px';
    panel.style.setProperty('--menu-bridge', Math.max(0, hostRect.bottom - rect.bottom) + 'px');
  }

  function closePanel() {
    clearTimeout(closeTimer);
    if (active) active.setAttribute('aria-expanded', 'false');
    active = null;
    panel.hidden = true;
  }

  function openPanel(trigger) {
    if (!desktop.matches) return;
    clearTimeout(closeTimer);
    if (active === trigger) return;
    if (active) active.setAttribute('aria-expanded', 'false');
    active = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-label', trigger.textContent.trim() + ' shortcuts');
    panel.replaceChildren(...entries.get(trigger).map(([label, path, override]) => {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = (override && trigger.dataset[override]) || new URL(path, trigger.href).href;
      return link;
    }));
    panel.hidden = false;
    placePanel();
  }

  function leavePointer() {
    if (active?.matches(':focus-visible') || panel.contains(document.activeElement)) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closePanel, 190);
  }

  function updateMode() {
    closePanel();
    for (const link of entries.keys()) {
      if (desktop.matches) {
        link.setAttribute('aria-controls', panel.id);
        link.setAttribute('aria-expanded', 'false');
      } else {
        link.removeAttribute('aria-controls');
        link.removeAttribute('aria-expanded');
      }
    }
  }

  host.classList.add('nav-preview-host');
  panel.id = 'nav-preview';
  panel.className = 'nav-preview';
  panel.hidden = true;
  nav.after(panel);

  for (const trigger of links) {
    trigger.addEventListener('pointerenter', event => {
      if (!hover.matches || event.pointerType === 'touch') return;
      if (!entries.has(trigger)) {
        // Return keyboard focus before hiding a focused shortcut.
        if (panel.contains(document.activeElement)) active?.focus({ preventScroll: true });
        closePanel();
      } else if (!panel.contains(document.activeElement)) {
        openPanel(trigger);
      }
    });
    if (!entries.has(trigger)) continue;
    trigger.addEventListener('pointerleave', leavePointer);
    trigger.addEventListener('focus', () => {
      if (!returningFocus && trigger.matches(':focus-visible')) openPanel(trigger);
    });
    trigger.addEventListener('keydown', event => {
      if (!desktop.matches || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey && active === trigger)) {
        event.preventDefault();
        openPanel(trigger);
        panel.firstElementChild.focus();
      }
    });
  }

  panel.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  panel.addEventListener('pointerleave', leavePointer);
  panel.addEventListener('click', () => closePanel());
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !active) return;
    if (event.shiftKey && document.activeElement === panel.firstElementChild) {
      event.preventDefault();
      active.focus();
    } else if (!event.shiftKey && document.activeElement === panel.lastElementChild) {
      const next = links[links.indexOf(active) + 1];
      if (next) {
        event.preventDefault();
        next.focus();
      }
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      const trigger = active;
      returningFocus = true;
      closePanel();
      trigger.focus({ preventScroll: true });
      returningFocus = false;
    }
  });
  document.addEventListener('focusin', event => {
    if (active && !entries.has(event.target) && !panel.contains(event.target)) closePanel();
  });
  document.addEventListener('pointerdown', event => {
    if (active && !nav.contains(event.target) && !panel.contains(event.target)) closePanel();
  });
  desktop.addEventListener('change', updateMode);
  window.addEventListener('resize', placePanel);
  updateMode();
}

initializeNavigationShortcuts();
