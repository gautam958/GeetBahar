// Geet Bahar — Global app initialization

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadLanguage();
  buildTaalNav();
  setupScrollSpy();
});

// ── Theme ──────────────────────────────────────────────────────────────

function loadTheme() {
  const saved = sessionStorage.getItem('theme') || APP_CONFIG.DEFAULT_THEME;
  setTheme(saved);
}

function setTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  sessionStorage.setItem('theme', name);
  const sel = document.getElementById('theme-select');
  if (sel) sel.value = name;
}

function changeTheme(name) { setTheme(name); }

// ── Language ───────────────────────────────────────────────────────────

function loadLanguage() {
  const saved = sessionStorage.getItem('language') || APP_CONFIG.DEFAULT_LANGUAGE;
  setLanguage(saved);
}

function setLanguage(code) {
  if (!['hi', 'en'].includes(code)) code = APP_CONFIG.DEFAULT_LANGUAGE;
  document.documentElement.lang = code;
  sessionStorage.setItem('language', code);
  document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === code);
  });
  applyTranslations(code);
}

function changeLanguage(code) { setLanguage(code); }

function applyTranslations(lang) {
  const dict = (window.I18N_DATA && window.I18N_DATA[lang]) || {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = resolveKey(dict, key);
    if (val === undefined) return; // leave baked-in fallback text untouched
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
}

function resolveKey(dict, key) {
  return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), dict);
}

// ── Taal-strip scroll navigation (signature element) ─────────────────────

function buildTaalNav() {
  const nav = document.getElementById('taal-nav');
  if (!nav) return;
  const sections = document.querySelectorAll('main .section, .hero, #contact');
  const ids = ['top', 'about', 'services', 'gallery', 'rates', 'contact'];
  ids.forEach((id, i) => {
    const btn = document.createElement('button');
    btn.dataset.target = id;
    btn.setAttribute('aria-label', id);
    btn.addEventListener('click', () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
    if (i === 0) btn.classList.add('active');
    nav.appendChild(btn);
  });
}

function setupScrollSpy() {
  const ids = ['top', 'about', 'services', 'gallery', 'rates', 'contact'];
  const buttons = document.querySelectorAll('#taal-nav button');
  if (!buttons.length) return;

  window.addEventListener('scroll', () => {
    const pos = window.scrollY + window.innerHeight / 3;
    let current = ids[0];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= pos) current = id;
    });
    buttons.forEach(b => b.classList.toggle('active', b.dataset.target === current));
  }, { passive: true });
}

window.addEventListener('error', e => console.error('App error:', e.error));
