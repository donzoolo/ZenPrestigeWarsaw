// === VERSION (from version.js) ===
const VERSION = window.VERSION || "v0.0.0";

// === DOM ===
const panelsContainer = document.getElementById('panels-container');
const pageTitle = document.getElementById('page-title');
const searchInput = document.getElementById('search');
const noResults = document.getElementById('no-results');
const flags = document.querySelectorAll('.flag-btn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const themeToggle = document.getElementById('theme-toggle');
const contactTitle = document.getElementById('contact-title');
const contactText = document.getElementById('contact-text');

// === STATE ===
let content = {};
let currentLang = 'en';
let allPanels = [];
let currentTheme = localStorage.getItem('theme') || 'light';
let newWorker, isUpdating = false;

// === TRANSLATIONS ===
const translations = {
  title: { en: "Welcome", pl: "Witamy", de: "Willkommen" },
  searchPlaceholder: { en: "Search…", pl: "Szukaj…", de: "Suchen…" },
  noResults: { en: "No results.", pl: "Brak wyników.", de: "Keine Ergebnisse." },
  contact: { en: "Contact Us", pl: "Kontakt", de: "Kontakt" },
  contactText: { en: "Wi-Fi and check-in details provided at arrival.", pl: "Dane Wi-Fi i meldunek przy przyjeździe.", de: "WLAN und Check-in bei Ankunft." }
};

// === LOAD CONTENT ===
async function loadContent() {
  try {
    const res = await fetch(`content.json?v=${VERSION}`);
    if (!res.ok) throw new Error();
    content = await res.json();
  } catch {
    const cached = await caches.match('content.json');
    content = cached ? await cached.json() : { en: [] };
  }
  allPanels = content[currentLang] || content.en || [];
  renderPanels(allPanels);
  updateUI();
}

function updateUI() {
  pageTitle.textContent = content.titles?.[currentLang] || translations.title[currentLang];
  searchInput.placeholder = translations.searchPlaceholder[currentLang];
  noResults.textContent = translations.noResults[currentLang];
  contactTitle.textContent = translations.contact[currentLang];
  contactText.textContent = translations.contactText[currentLang];
}

// === RENDER PANELS ===
function renderPanels(list) {
  panelsContainer.innerHTML = '';
  if (!list.length) { noResults.style.display = 'block'; return; }
  noResults.style.display = 'none';

  list.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'panel visible';
    div.innerHTML = `
      <div class="panel-title" id="title-${i}" tabindex="0" role="button" aria-expanded="false">
        ${p.title}
      </div>
      <div class="panel-content" aria-hidden="true">
        <div class="panel-text">${p.html}</div>
      </div>
    `;
    panelsContainer.appendChild(div);

    const title = div.querySelector('.panel-title');
    const content = div.querySelector('.panel-content');

    const toggle = () => {
      const active = div.classList.toggle('active');
      title.setAttribute('aria-expanded', active);
      content.setAttribute('aria-hidden', !active);
      savePanelState();
    };

    title.addEventListener('click', toggle);
    title.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  loadPanelState();
}

// === PANEL STATE ===
function savePanelState() {
  const state = Array.from(document.querySelectorAll('.panel')).map(p => p.classList.contains('active'));
  localStorage.setItem('panelState', JSON.stringify(state));
}

function loadPanelState() {
  const state = JSON.parse(localStorage.getItem('panelState') || '[]');
  document.querySelectorAll('.panel').forEach((p, i) => {
    if (state[i]) p.classList.add('active');
  });
}

// === SEARCH & LANG ===
function filterPanels(q) {
  if (!q.trim()) return renderPanels(allPanels);
  const lower = q.toLowerCase();
  const matches = allPanels.filter(p => p.title.toLowerCase().includes(lower) || p.html.toLowerCase().includes(lower));
  renderPanels(matches);
}

flags.forEach(f => f.addEventListener('click', () => {
  currentLang = f.dataset.lang;
  flags.forEach(x => x.setAttribute('aria-selected', x === f));
  allPanels = content[currentLang] || content.en;
  updateUI();
  filterPanels(searchInput.value);
}));

searchInput.addEventListener('input', () => filterPanels(searchInput.value));
lightbox.addEventListener('click', () => lightbox.classList.remove('active'));

// === THEME ===
function applyTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggle.innerHTML = currentTheme === 'light' ? '<i class="ti ti-moon"></i>' : '<i class="ti ti-sun"></i>';
}
themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  applyTheme();
});

// === SERVICE WORKER ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(`sw.js?v=${VERSION}`)
    .then(reg => {
      reg.update();
      reg.onupdatefound = () => {
        newWorker = reg.installing;
        newWorker.onstatechange = () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !isUpdating) {
            document.getElementById('update-banner').style.display = 'block';
          }
        };
      };
    });
}

function updatePWA() {
  if (newWorker && !isUpdating) {
    isUpdating = true;
    document.getElementById('update-banner').style.display = 'none';
    newWorker.postMessage({ action: 'skipWaiting' });
  }
}

navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (isUpdating) window.location.reload();
});

// === LIGHTBOX ===
panelsContainer.addEventListener('click', e => {
  const img = e.target.closest('.thumb');
  if (img) {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || 'Enlarged image';
    lightbox.classList.add('active');
  }
});

// === INIT ===
applyTheme();
loadContent();