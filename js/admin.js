// Geet Bahar — Admin panel logic
//
// Two modes:
//  1. Local Demo Mode (default, works with zero setup): data lives in
//     localStorage, seeded from bundled sample content on first run.
//  2. Live Mode (once config.js has real API_BASE + GOOGLE_CLIENT_ID):
//     Google Sign-In gates access, all reads/writes hit the real Azure API.

const DEMO_KEYS = {
  siteConfig: 'gb_demo_site_config',
  pageContent: 'gb_demo_page_content',
  rates: 'gb_demo_rates',
  gallery: 'gb_demo_gallery',
  submissions: 'gb_demo_submissions',
  visitors: 'gb_demo_visitors',
  analytics: 'gb_demo_analytics'
};

const SEED = {
  siteConfig: {
    contact: { phone: "+91-87654 32100", email: "info@geetbahar.com", address: "Deoghar, Jharkhand, India" },
    hero: { title_hi: "गीत बहार संगीत समूह", title_en: "Geet Bahar Musical Group" },
    businessHours: { mon_fri: "10:00 AM – 6:00 PM", saturday: "10:00 AM – 4:00 PM", sunday: "Closed" },
    social: { facebook: "https://facebook.com/geetbahar", instagram: "https://instagram.com/geetbahar", youtube: "https://youtube.com/@geetbahar" }
  },
  pageContent: {
    about: {
      lead: "उत्तम कुमार के नेतृत्व में, संगीत और सामाजिक जागरूकता का संगम",
      sections: [
        { heading: "Our story", body: "Geet Bahar Musical Group was founded in Deoghar by Uttam Kumar to keep the region's orchestral and folk traditions performance-ready for both temple festivals and government platforms." },
        { heading: "Shravani Mela", body: "Every Shravan month, kanwariyas walk through the night toward Baidyanath Dham — Geet Bahar's orchestras have performed alongside that procession for years." },
        { heading: "Beyond the festival", body: "Outside the festival season, the same musicians and actors carry that stagecraft into Jan Sanchar programs and Nukkad Natak street theatre." }
      ]
    },
    services: {
      services: [
        { name: "Shravani Mela Orchestra", description: "Large-format classical and folk orchestra performed nightly through the Shravan month.", icon: "🎻" },
        { name: "Jan Sanchar Programs", description: "Government-approved mass communication performances for public squares.", icon: "📢" },
        { name: "Nukkad Natak", description: "Street theatre built for a crowd that wasn't planning to stop walking.", icon: "🎭" },
        { name: "Private Event Orchestra", description: "Weddings, inaugurations, and celebrations scored by the same musicians who play the Mela.", icon: "💍" },
        { name: "Performer Training", description: "Mentorship for young vocalists and instrumentalists in Deoghar.", icon: "🎓" },
        { name: "Full Event Production", description: "Sound, stage, and lighting handled end-to-end.", icon: "🎪" }
      ]
    },
    faq: [
      { question: "How do I book Geet Bahar for an event?", answer: "Submit an inquiry through the contact form, email info@geetbahar.com, or call directly. We respond within 24 hours." },
      { question: "What is the minimum duration for a performance?", answer: "Private events typically need 2–3 hours; government programs can be customized." }
    ]
  },
  rates: {
    private: { packages: [
      { name: "Standard", duration: "2 hours", basePrice: 15000, inclusions: ["Orchestra with lead vocals", "Sound system & microphones", "Basic stage lighting"] },
      { name: "Premium", duration: "3 hours", basePrice: 25000, inclusions: ["Full orchestra + folk dancers", "Stage backdrop & decoration", "Event coordination on-site"] },
      { name: "Deluxe", duration: "4+ hours", basePrice: 40000, inclusions: ["Extended ensemble + guest artists", "Dedicated event manager", "Custom setlist consultation"] }
    ]},
    government: {
      baseRates: {
        janSanchar: { description: "Jan Sanchar Program", rate: 5000, unit: "per program" },
        nukadNatak: { description: "Nukkad Natak Program", rate: 3000, unit: "per program" }
      },
      notes: "Government rates for Jan Sanchar and Nukkad Natak follow empanelled rates with the Government of Jharkhand. Volume rates available for multi-district drives — contact us for a written quote."
    }
  },
  gallery: window.SAMPLE_GALLERY || { photos: [], videos: [] },
  submissions: [
    { id: 'seed-1', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91-98765 43210', eventType: 'wedding', eventDate: '2026-12-15', message: 'Interested in a 3-hour orchestra for our wedding.', submittedAt: '2026-07-01T14:30:00Z', status: 'new' }
  ],
  visitors: [
    { visitorId: 'v-001', city: 'Deoghar', state: 'Jharkhand', country: 'India', visitCount: 3, lastVisit: '2026-07-15T10:00:00Z' },
    { visitorId: 'v-002', city: 'Ranchi', state: 'Jharkhand', country: 'India', visitCount: 1, lastVisit: '2026-07-14T09:20:00Z' },
    { visitorId: 'v-003', city: 'Patna', state: 'Bihar', country: 'India', visitCount: 2, lastVisit: '2026-07-16T18:05:00Z' }
  ],
  analytics: {
    byDay: { '2026-07-12': 14, '2026-07-13': 19, '2026-07-14': 11, '2026-07-15': 23, '2026-07-16': 17, '2026-07-17': 26, '2026-07-18': 9 },
    byPath: { '/': 84, '/#gallery': 22, '/#rates': 18, '/#contact': 15 }
  }
};

let isDemo = false;
let authToken = null;

function demoGet(key) {
  const raw = localStorage.getItem(DEMO_KEYS[key]);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(DEMO_KEYS[key], JSON.stringify(SEED[key]));
  return SEED[key];
}
function demoSet(key, value) {
  localStorage.setItem(DEMO_KEYS[key], JSON.stringify(value));
}

// ── Entry points ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (!window.IS_BACKEND_CONFIGURED) {
    // No real backend configured — hide Google button, point straight to demo.
    document.getElementById('google-signin-area').style.display = 'none';
    document.getElementById('signin-subtitle').textContent =
      'No backend is configured yet. Use Local Demo Mode to preview and test the admin panel.';
  } else {
    initGoogleSignIn();
  }

  setupTabs();
  document.getElementById('upload-zone').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', handleFileUpload);
  setupImageUploadWidget('heroMain');
  setupImageUploadWidget('heroSecondary');
  setupImageUploadWidget('aboutPhoto');
});

function enterDemoMode() {
  isDemo = true;
  document.getElementById('signin-screen').style.display = 'none';
  document.getElementById('admin-shell').style.display = 'block';
  document.getElementById('demo-banner').style.display = 'block';
  document.getElementById('admin-email').textContent = 'demo@local (not signed in)';
  renderAllTabs();
}

function exitDemoMode() {
  isDemo = false;
  document.getElementById('admin-shell').style.display = 'none';
  document.getElementById('signin-screen').style.display = 'flex';
}

function signOut() {
  localStorage.removeItem('authToken');
  authToken = null;
  location.reload();
}

// ── Google Sign-In (only runs when a real backend is configured) ───────

function initGoogleSignIn() {
  const existing = localStorage.getItem('authToken');
  if (existing) {
    authToken = existing;
    showAdminShell(parseJwtEmail(existing));
    return;
  }
  if (!window.google) {
    // Google script may not have loaded (e.g. offline) — fall back gracefully.
    document.getElementById('signin-subtitle').textContent =
      'Could not load Google Sign-In. You can still use Local Demo Mode below.';
    return;
  }
  google.accounts.id.initialize({
    client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential
  });
  google.accounts.id.renderButton(document.getElementById('google-signin-btn'), { theme: 'outline', size: 'large' });
}

function handleGoogleCredential(response) {
  authToken = response.credential;
  localStorage.setItem('authToken', authToken);
  showAdminShell(parseJwtEmail(authToken));
}

function parseJwtEmail(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || 'signed in';
  } catch { return 'signed in'; }
}

function showAdminShell(email) {
  isDemo = false;
  document.getElementById('signin-screen').style.display = 'none';
  document.getElementById('admin-shell').style.display = 'block';
  document.getElementById('demo-banner').style.display = 'none';
  document.getElementById('admin-email').textContent = email;
  renderAllTabs();
}

// ── Tabs ─────────────────────────────────────────────────────────────

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

async function renderAllTabs() {
  await loadSiteInfoForm();
  await loadAboutForm();
  await loadRatesForm();
  await loadGallery();
  await loadSubmissions();
  await loadAnalytics();
}

// ── Content & Rates editors ─────────────────────────────────────────────

async function safeApiGet(type, fallback) {
  try { return await apiCall(type, 'GET', null, authToken); }
  catch { return fallback; }
}

// ── Site info form (contact, hero, hours, social) ───────────────────────

async function loadSiteInfoForm() {
  const data = isDemo ? demoGet('siteConfig') : await safeApiGet('config', SEED.siteConfig);
  document.getElementById('f-phone').value = data.contact?.phone || '';
  document.getElementById('f-email').value = data.contact?.email || '';
  document.getElementById('f-address').value = data.contact?.address || '';
  document.getElementById('f-hero-hi').value = data.hero?.title_hi || '';
  document.getElementById('f-hero-en').value = data.hero?.title_en || '';
  document.getElementById('f-hours-weekday').value = data.businessHours?.mon_fri || '';
  document.getElementById('f-hours-sat').value = data.businessHours?.saturday || '';
  document.getElementById('f-hours-sun').value = data.businessHours?.sunday || '';
  document.getElementById('f-social-fb').value = data.social?.facebook || '';
  document.getElementById('f-social-ig').value = data.social?.instagram || '';
  document.getElementById('f-social-yt').value = data.social?.youtube || '';

  imageState.heroMain = data.hero?.heroImage || null;
  imageState.heroSecondary = data.hero?.heroImageSecondary || null;
  renderImageWidget('heroMain');
  renderImageWidget('heroSecondary');
}

function collectSiteInfoForm() {
  return {
    contact: {
      phone: document.getElementById('f-phone').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      address: document.getElementById('f-address').value.trim()
    },
    hero: {
      title_hi: document.getElementById('f-hero-hi').value.trim(),
      title_en: document.getElementById('f-hero-en').value.trim(),
      heroImage: imageState.heroMain,
      heroImageSecondary: imageState.heroSecondary
    },
    businessHours: {
      mon_fri: document.getElementById('f-hours-weekday').value.trim(),
      saturday: document.getElementById('f-hours-sat').value.trim(),
      sunday: document.getElementById('f-hours-sun').value.trim()
    },
    social: {
      facebook: document.getElementById('f-social-fb').value.trim(),
      instagram: document.getElementById('f-social-ig').value.trim(),
      youtube: document.getElementById('f-social-yt').value.trim()
    }
  };
}

async function saveSiteInfo() {
  const statusIds = ['site-info-status-top', 'site-info-status'];
  const data = collectSiteInfoForm();
  if (isDemo) {
    demoSet('siteConfig', data);
    flashStatus(statusIds, '✓ Saved locally (demo mode).');
    return;
  }
  try {
    await apiCall('config', 'POST', data, authToken);
    flashStatus(statusIds, '✓ Saved.');
  } catch (e) {
    flashStatus(statusIds, '✗ Save failed — check your connection and try again.', true);
  }
}

// ── About / Services / FAQ form (repeatable rows) ───────────────────────

async function loadAboutForm() {
  const data = isDemo ? demoGet('pageContent') : await safeApiGet('content', SEED.pageContent);
  document.getElementById('f-about-lead').value = data.about?.lead || '';

  imageState.aboutPhoto = data.about?.photo || null;
  renderImageWidget('aboutPhoto');

  const paraList = document.getElementById('about-paragraphs-list');
  paraList.innerHTML = '';
  (data.about?.sections || []).forEach(p => paraList.appendChild(buildParagraphRow(p.heading, p.body)));

  const svcList = document.getElementById('services-list');
  svcList.innerHTML = '';
  (data.services?.services || []).forEach(s => svcList.appendChild(buildServiceRow(s.name, s.description, s.icon)));

  const faqList = document.getElementById('faq-list');
  faqList.innerHTML = '';
  (data.faq || []).forEach(f => faqList.appendChild(buildFaqRow(f.question, f.answer)));
}

function buildParagraphRow(heading = '', body = '') {
  const div = document.createElement('div');
  div.className = 'repeatable-item';
  div.innerHTML = `
    <button type="button" class="btn-remove-row" onclick="this.closest('.repeatable-item').remove()">✕</button>
    <div class="field"><label class="field-mini-label">Heading</label><input type="text" class="p-heading" value="${escAttr(heading)}"></div>
    <div class="field" style="margin-top:10px;"><label class="field-mini-label">Body</label><textarea class="p-body">${escapeHtmlAdmin(body)}</textarea></div>
  `;
  return div;
}

function buildServiceRow(name = '', description = '', icon = '') {
  const div = document.createElement('div');
  div.className = 'repeatable-item';
  div.innerHTML = `
    <button type="button" class="btn-remove-row" onclick="this.closest('.repeatable-item').remove()">✕</button>
    <div class="row-fields cols-3">
      <div class="field"><label class="field-mini-label">Icon (emoji)</label><input type="text" class="s-icon" value="${escAttr(icon)}"></div>
      <div class="field" style="grid-column: span 2;"><label class="field-mini-label">Name</label><input type="text" class="s-name" value="${escAttr(name)}"></div>
    </div>
    <div class="field" style="margin-top:10px;"><label class="field-mini-label">Description</label><textarea class="s-desc">${escapeHtmlAdmin(description)}</textarea></div>
  `;
  return div;
}

function buildFaqRow(question = '', answer = '') {
  const div = document.createElement('div');
  div.className = 'repeatable-item';
  div.innerHTML = `
    <button type="button" class="btn-remove-row" onclick="this.closest('.repeatable-item').remove()">✕</button>
    <div class="field"><label class="field-mini-label">Question</label><input type="text" class="f-question" value="${escAttr(question)}"></div>
    <div class="field" style="margin-top:10px;"><label class="field-mini-label">Answer</label><textarea class="f-answer">${escapeHtmlAdmin(answer)}</textarea></div>
  `;
  return div;
}

function addAboutParagraph() { document.getElementById('about-paragraphs-list').appendChild(buildParagraphRow()); }
function addServiceRow() { document.getElementById('services-list').appendChild(buildServiceRow()); }
function addFaqRow() { document.getElementById('faq-list').appendChild(buildFaqRow()); }

function collectAboutForm() {
  const sections = [...document.querySelectorAll('#about-paragraphs-list .repeatable-item')].map(row => ({
    heading: row.querySelector('.p-heading').value.trim(),
    body: row.querySelector('.p-body').value.trim()
  }));
  const services = [...document.querySelectorAll('#services-list .repeatable-item')].map(row => ({
    name: row.querySelector('.s-name').value.trim(),
    description: row.querySelector('.s-desc').value.trim(),
    icon: row.querySelector('.s-icon').value.trim()
  }));
  const faq = [...document.querySelectorAll('#faq-list .repeatable-item')].map(row => ({
    question: row.querySelector('.f-question').value.trim(),
    answer: row.querySelector('.f-answer').value.trim()
  }));
  return {
    about: { lead: document.getElementById('f-about-lead').value.trim(), sections, photo: imageState.aboutPhoto },
    services: { services },
    faq
  };
}

async function saveAboutContent() {
  const statusIds = ['about-status-top', 'about-status'];
  const data = collectAboutForm();
  if (isDemo) {
    demoSet('pageContent', data);
    flashStatus(statusIds, '✓ Saved locally (demo mode).');
    return;
  }
  try {
    await apiCall('content', 'POST', data, authToken);
    flashStatus(statusIds, '✓ Saved.');
  } catch (e) {
    flashStatus(statusIds, '✗ Save failed — check your connection and try again.', true);
  }
}

// ── Rates form (repeatable packages) ────────────────────────────────────

async function loadRatesForm() {
  const data = isDemo ? demoGet('rates') : await safeApiGet('rates', SEED.rates);
  const list = document.getElementById('packages-list');
  list.innerHTML = '';
  (data.private?.packages || []).forEach(p => list.appendChild(buildPackageRow(p.name, p.duration, p.basePrice, p.inclusions)));

  document.getElementById('f-govt-jansanchar').value = data.government?.baseRates?.janSanchar?.rate ?? '';
  document.getElementById('f-govt-nukkad').value = data.government?.baseRates?.nukadNatak?.rate ?? '';
  document.getElementById('f-govt-note').value = data.government?.notes || '';
}

function buildPackageRow(name = '', duration = '', basePrice = '', inclusions = []) {
  const div = document.createElement('div');
  div.className = 'repeatable-item';
  const inclusionsText = Array.isArray(inclusions) ? inclusions.join('\n') : (inclusions || '');
  div.innerHTML = `
    <button type="button" class="btn-remove-row" onclick="this.closest('.repeatable-item').remove()">✕</button>
    <div class="row-fields cols-3">
      <div class="field"><label class="field-mini-label">Package name</label><input type="text" class="pkg-name" value="${escAttr(name)}"></div>
      <div class="field"><label class="field-mini-label">Duration</label><input type="text" class="pkg-duration" value="${escAttr(duration)}"></div>
      <div class="field"><label class="field-mini-label">Price (₹)</label><input type="number" class="pkg-price" value="${escAttr(String(basePrice))}"></div>
    </div>
    <div class="field" style="margin-top:10px;">
      <label class="field-mini-label">What's included (one per line)</label>
      <textarea class="pkg-inclusions">${escapeHtmlAdmin(inclusionsText)}</textarea>
    </div>
  `;
  return div;
}

function addPackageRow() { document.getElementById('packages-list').appendChild(buildPackageRow()); }

function collectRatesForm() {
  const packages = [...document.querySelectorAll('#packages-list .repeatable-item')].map(row => ({
    name: row.querySelector('.pkg-name').value.trim(),
    duration: row.querySelector('.pkg-duration').value.trim(),
    basePrice: Number(row.querySelector('.pkg-price').value) || 0,
    inclusions: row.querySelector('.pkg-inclusions').value.split('\n').map(s => s.trim()).filter(Boolean)
  }));
  return {
    private: { packages },
    government: {
      baseRates: {
        janSanchar: { description: "Jan Sanchar Program", rate: Number(document.getElementById('f-govt-jansanchar').value) || 0, unit: "per program" },
        nukadNatak: { description: "Nukkad Natak Program", rate: Number(document.getElementById('f-govt-nukkad').value) || 0, unit: "per program" }
      },
      notes: document.getElementById('f-govt-note').value.trim()
    }
  };
}

async function saveRatesForm() {
  const statusIds = ['rates-status-top', 'rates-status'];
  const data = collectRatesForm();
  if (isDemo) {
    demoSet('rates', data);
    flashStatus(statusIds, '✓ Saved locally (demo mode).');
    return;
  }
  try {
    await apiCall('rates', 'POST', data, authToken);
    flashStatus(statusIds, '✓ Saved.');
  } catch (e) {
    flashStatus(statusIds, '✗ Save failed — check your connection and try again.', true);
  }
}

// ── Shared helpers ───────────────────────────────────────────────────────

function flashStatus(elOrElId, msg, isError = false) {
  const ids = typeof elOrElId === 'string' ? [elOrElId] : elOrElId;
  ids.forEach(id => {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'var(--vermilion)' : '';
  });
}

function escAttr(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ── Gallery ──────────────────────────────────────────────────────────

async function loadGallery() {
  const data = isDemo ? demoGet('gallery') : await safeApiGet('gallery', SEED.gallery);
  const grid = document.getElementById('admin-gallery-grid');
  const items = [...(data.photos || []).map(p => ({ ...p, kind: 'photo' })), ...(data.videos || []).map(v => ({ ...v, kind: 'video' }))];
  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--text-soft);">No items yet — upload one above.</p>';
    return;
  }
  grid.innerHTML = items.map((item, i) => `
    <div class="admin-gallery-card">
      <div style="width:100%;aspect-ratio:4/3;background:${item.color || 'var(--surface)'};display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-label);font-size:0.8rem;text-align:center;padding:10px;">
        ${item.kind === 'video' ? '▶ ' : ''}${escapeHtmlAdmin(item.title || 'Untitled')}
      </div>
      <div class="meta">
        <h4>${escapeHtmlAdmin(item.title || 'Untitled')}</h4>
        <small>${escapeHtmlAdmin(item.desc || '')}</small>
        <button class="btn-delete" onclick="deleteGalleryItem('${item.kind}', ${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

function escapeHtmlAdmin(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const kind = file.type.startsWith('video') ? 'videos' : 'photos';
  const title = file.name.replace(/\.[^.]+$/, '');

  if (isDemo) {
    const gallery = demoGet('gallery');
    gallery[kind] = gallery[kind] || [];
    const colors = ['#E8641C', '#8B1E3F', '#F2A93B', '#1B1F3B'];
    gallery[kind].unshift({ title, desc: 'Uploaded ' + new Date().toLocaleDateString(), color: colors[gallery[kind].length % colors.length] });
    demoSet('gallery', gallery);
    loadGallery();
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const media = await apiCall('media', 'POST', { filename: file.name, contentType: file.type, dataBase64: reader.result }, authToken);
      const gallery = await safeApiGet('gallery', SEED.gallery);
      const list = gallery[kind] || [];
      list.unshift({ title, filename: media.filename, description: '' });
      await apiCall('gallery', 'POST', { [kind]: list }, authToken);
      loadGallery();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
}

function deleteGalleryItem(kind, index) {
  const key = kind === 'video' ? 'videos' : 'photos';
  if (isDemo) {
    const gallery = demoGet('gallery');
    gallery[key].splice(index, 1);
    demoSet('gallery', gallery);
    loadGallery();
  } else {
    // Live mode deletion would call the DELETE endpoint with the item's real id.
    loadGallery();
  }
}

// ── Submissions / Inquiries ─────────────────────────────────────────────

let cachedSubmissions = [];

async function loadSubmissions() {
  cachedSubmissions = isDemo ? demoGet('submissions') : await safeApiGet('contact_submissions', SEED.submissions);
  if (!Array.isArray(cachedSubmissions)) cachedSubmissions = cachedSubmissions.submissions || [];
  renderSubmissions();
}

function renderSubmissions() {
  const filter = document.getElementById('status-filter').value;
  const grid = document.getElementById('submissions-grid');
  const items = cachedSubmissions.filter(s => filter === 'all' || s.status === filter);

  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--text-soft);">No inquiries match this filter.</p>';
    return;
  }

  grid.innerHTML = items.map(s => `
    <div class="submission-card">
      <div>
        <h4>${escapeHtmlAdmin(s.name)} — ${escapeHtmlAdmin(s.eventType || 'general')}</h4>
        <p>${escapeHtmlAdmin(s.phone || '')} ${s.email ? '· ' + escapeHtmlAdmin(s.email) : ''}</p>
        <p>${escapeHtmlAdmin(s.message || '')}</p>
        <p style="font-size:0.78rem;">${new Date(s.submittedAt).toLocaleString()}</p>
      </div>
      <select class="status-select" onchange="updateSubmissionStatus('${s.id}', this.value)">
        <option value="new" ${s.status === 'new' ? 'selected' : ''}>New</option>
        <option value="contacted" ${s.status === 'contacted' ? 'selected' : ''}>Contacted</option>
        <option value="resolved" ${s.status === 'resolved' ? 'selected' : ''}>Resolved</option>
      </select>
    </div>
  `).join('');
}

async function updateSubmissionStatus(id, status) {
  const item = cachedSubmissions.find(s => s.id === id);
  if (item) item.status = status;
  if (isDemo) {
    demoSet('submissions', cachedSubmissions);
  } else {
    try { await apiCall('contact_submissions', 'PATCH', null, authToken, `&id=${id}&status=${status}`); }
    catch { /* keep UI optimistic even if the request fails */ }
  }
}

// ── Analytics ────────────────────────────────────────────────────────

async function loadAnalytics() {
  const analytics = isDemo ? demoGet('analytics') : await safeApiGet('analytics', SEED.analytics);
  const visitors = isDemo ? demoGet('visitors') : await safeApiGet('visitors', SEED.visitors);

  const totalViews = Object.values(analytics.byDay || {}).reduce((a, b) => a + b, 0);
  const uniqueVisitors = visitors.length;
  const repeat = visitors.filter(v => v.visitCount > 1).length;

  document.getElementById('stat-views').textContent = totalViews;
  document.getElementById('stat-visitors').textContent = uniqueVisitors;
  document.getElementById('stat-new').textContent = uniqueVisitors - repeat;
  document.getElementById('stat-repeat').textContent = repeat;

  renderDailyChart(analytics.byDay || {});
  renderPagesChart(analytics.byPath || {});
  renderVisitorsTable(visitors);
}

let dailyChart, pagesChart;

// Chart.js loads from a CDN. If that request is blocked (offline testing,
// a restrictive network, an ad-blocker), fall back to a plain HTML bar list
// instead of letting the whole analytics tab crash.
function chartsAvailable() {
  return typeof Chart !== 'undefined';
}

function renderDailyChart(byDay) {
  const canvas = document.getElementById('chart-daily');
  if (!chartsAvailable()) { renderFallbackBars(canvas, byDay, '#E8641C'); return; }
  if (dailyChart) dailyChart.destroy();
  try {
    dailyChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: Object.keys(byDay),
        datasets: [{ data: Object.values(byDay), borderColor: '#E8641C', backgroundColor: 'rgba(232,100,28,0.15)', fill: true, tension: 0.35 }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  } catch (e) { renderFallbackBars(canvas, byDay, '#E8641C'); }
}

function renderPagesChart(byPath) {
  const canvas = document.getElementById('chart-pages');
  if (!chartsAvailable()) { renderFallbackBars(canvas, byPath, '#8B1E3F'); return; }
  if (pagesChart) pagesChart.destroy();
  try {
    pagesChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(byPath),
        datasets: [{ data: Object.values(byPath), backgroundColor: '#8B1E3F' }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  } catch (e) { renderFallbackBars(canvas, byPath, '#8B1E3F'); }
}

// Dependency-free bar list — used whenever Chart.js isn't available, so
// analytics still show real numbers instead of a broken tab.
function renderFallbackBars(canvas, data, color) {
  const max = Math.max(...Object.values(data), 1);
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
  wrapper.innerHTML = Object.entries(data).map(([label, val]) => `
    <div style="display:flex;align-items:center;gap:10px;font-family:var(--font-label);font-size:0.78rem;">
      <span style="width:90px;color:var(--text-soft);">${label}</span>
      <div style="flex:1;background:var(--border);border-radius:4px;overflow:hidden;height:14px;">
        <div style="width:${(val / max * 100).toFixed(0)}%;background:${color};height:100%;"></div>
      </div>
      <span style="width:30px;text-align:right;">${val}</span>
    </div>
  `).join('');
  canvas.replaceWith(wrapper);
  wrapper.id = canvas.id;
}

function renderVisitorsTable(visitors) {
  const tbody = document.querySelector('#visitors-table tbody');
  tbody.innerHTML = visitors.map(v => `
    <tr>
      <td>${escapeHtmlAdmin(v.city || '')}, ${escapeHtmlAdmin(v.state || v.country || '')}</td>
      <td>${v.visitCount}</td>
      <td>${new Date(v.lastVisit).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

// ── Image upload widgets (hero main, hero secondary, Uttam Kumar's photo)
//
// Each widget holds its current value in imageState[key] — a string ref
// that is either a data: URL (Local Demo Mode) or an uploaded filename
// (Live mode, resolved against the media endpoint on the public site).
// Selecting a file previews and stores it immediately; the actual save
// into config/content happens when the surrounding form's Save button is
// clicked, same as every other field in that form. ────────────────────

const imageState = { heroMain: null, heroSecondary: null, aboutPhoto: null };

function setupImageUploadWidget(key) {
  const zone = document.getElementById(`${key}-zone`);
  const input = document.getElementById(`${key}-input`);
  const removeBtn = document.getElementById(`${key}-remove`);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const ref = await uploadImageAndGetRef(file);
      imageState[key] = ref;
      renderImageWidget(key);
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    }
    input.value = ''; // allow re-selecting the same file later
  });
  removeBtn?.addEventListener('click', () => {
    imageState[key] = null;
    renderImageWidget(key);
  });
}

function renderImageWidget(key) {
  const preview = document.getElementById(`${key}-preview`);
  const empty = document.getElementById(`${key}-empty`);
  const removeBtn = document.getElementById(`${key}-remove`);
  const ref = imageState[key];
  if (ref) {
    preview.src = resolveAdminImageRef(ref);
    preview.style.display = 'block';
    if (empty) empty.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'block';
  } else {
    preview.style.display = 'none';
    preview.src = '';
    if (empty) empty.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
  }
}

// In demo mode the ref IS the data: URL, so it can be used directly as an
// <img> src. In live mode the ref is a filename that needs the media
// endpoint prefixed on to resolve to an actual URL.
function resolveAdminImageRef(ref) {
  if (!ref) return '';
  if (window.IS_BACKEND_CONFIGURED && !ref.startsWith('data:')) {
    return `${APP_CONFIG.API_BASE}&type=media&file=${encodeURIComponent(ref)}`;
  }
  return ref;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImageAndGetRef(file) {
  const dataUrl = await fileToDataUrl(file);
  if (!window.IS_BACKEND_CONFIGURED) {
    return dataUrl; // demo mode: the ref IS the data URL, stored as-is
  }
  const res = await apiCall('media', 'POST', { filename: file.name, contentType: file.type, dataBase64: dataUrl }, authToken);
  return res.filename; // live mode: store the filename, resolve to a URL on read
}
