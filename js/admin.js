// Geet Bahar — Admin panel logic
//
// Live mode only: Google Sign-In is required to reach the admin shell, and
// every read/write goes through the real Azure Function API. There is no
// content data cached client-side — gallery, text, rates, etc. always come
// fresh from the API, never from browser storage. The one exception is the
// login session itself, kept in sessionStorage (see the Google Sign-In
// section below) so a page refresh doesn't force signing in again — that's
// a login token, not site content, and it's gone the moment the tab closes.

let authToken = null;

// ── Entry point ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initGoogleSignIn();
  setupTabs();
  document.getElementById('upload-zone').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('file-input').addEventListener('change', handleFileUpload);
  setupImageUploadWidget('heroMain');
  setupImageUploadWidget('heroSecondary');
  setupImageUploadWidget('aboutPhoto');
});

function signOut() {
  authToken = null;
  sessionStorage.removeItem('authToken');
  location.reload();
}

// ── Google Sign-In ───────────────────────────────────────────────────
//
// The auth token is kept in sessionStorage — NOT localStorage — so it
// survives a page refresh (fixing "asks to log in again every single
// time I reload") but is gone the moment the browser tab/window closes.
// This is the one exception to "no client storage" in this app: without
// it, every refresh forces a fresh Google sign-in, which is real friction
// for actually using the admin panel day to day. It does not affect the
// bigger promise made earlier — that site *content* (gallery, text,
// rates, etc.) always comes from the live API with zero client-side
// caching — this is purely a login session, not content data.

function initGoogleSignIn() {
  const existing = sessionStorage.getItem('authToken');
  if (existing && !isJwtExpired(existing)) {
    authToken = existing;
    showAdminShell(parseJwtEmail(existing));
    return;
  }
  if (existing) sessionStorage.removeItem('authToken'); // expired — clear it

  if (!window.IS_GOOGLE_CLIENT_ID_SET) {
    document.getElementById('google-signin-area').style.display = 'none';
    document.getElementById('signin-subtitle').innerHTML =
      'Google sign-in isn\'t configured yet — add a real <code>GOOGLE_CLIENT_ID</code> in <code>js/config.js</code> ' +
      '(get one from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console</a>), ' +
      'then reload this page.';
    return;
  }

  // The Google script tag loads with async/defer, which does NOT guarantee
  // it has finished by the time DOMContentLoaded fires — this is especially
  // common on slower mobile connections. Poll for it briefly before
  // concluding it's actually blocked, instead of failing on the first check.
  waitForGoogleScript();
}

function waitForGoogleScript(attempt = 0) {
  if (window.google?.accounts?.id) {
    google.accounts.id.initialize({
      client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential
    });
    google.accounts.id.renderButton(document.getElementById('google-signin-btn'), { theme: 'outline', size: 'large' });
    return;
  }
  if (attempt < 20) { // up to ~10 seconds total, generous for slow mobile networks
    setTimeout(() => waitForGoogleScript(attempt + 1), 500);
    return;
  }
  document.getElementById('signin-subtitle').textContent =
    'Could not load Google Sign-In (the script may be blocked by your network). Please check your connection and reload.';
}

function handleGoogleCredential(response) {
  authToken = response.credential;
  sessionStorage.setItem('authToken', authToken);
  showAdminShell(parseJwtEmail(authToken));
}

function isJwtExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false; // no expiry claim — treat as still valid
    return Date.now() >= payload.exp * 1000;
  } catch { return true; } // unparseable — treat as expired/invalid
}

function parseJwtEmail(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || 'signed in';
  } catch { return 'signed in'; }
}

function showAdminShell(email) {
  document.getElementById('signin-screen').style.display = 'none';
  document.getElementById('admin-shell').style.display = 'block';
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

// ── Shared helpers ───────────────────────────────────────────────────

async function safeApiGet(type, fallback) {
  try {
    return await apiCall(type, 'GET', null, authToken);
  } catch (e) {
    console.error(`Failed to load "${type}":`, e.message);
    return { __error: e.message, ...fallback };
  }
}

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

function escapeHtmlAdmin(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Site info form (contact, hero, hours, social) ───────────────────

async function loadSiteInfoForm() {
  const data = await safeApiGet('config', {});
  if (data.__error) {
    flashStatus(['site-info-status-top'], '✗ Could not load — ' + data.__error, true);
  }
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

  imageState.heroMain = data.hero?.heroImage || '';
  imageState.heroSecondary = data.hero?.heroImageSecondary || '';
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
  const statusIds = ['site-info-status-top'];
  const data = collectSiteInfoForm();
  try {
    await apiCall('config', 'POST', data, authToken);
    flashStatus(statusIds, '✓ Saved.');
  } catch (e) {
    flashStatus(statusIds, '✗ Save failed — ' + e.message, true);
  }
}

// ── About / Services / FAQ form (repeatable rows) ───────────────────

async function loadAboutForm() {
  const data = await safeApiGet('content', {});
  if (data.__error) {
    flashStatus(['about-status-top'], '✗ Could not load — ' + data.__error, true);
  }
  document.getElementById('f-about-lead').value = data.about?.lead || '';

  imageState.aboutPhoto = data.about?.photo || '';
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
  const statusIds = ['about-status-top'];
  const data = collectAboutForm();
  try {
    await apiCall('content', 'POST', data, authToken);
    flashStatus(statusIds, '✓ Saved.');
  } catch (e) {
    flashStatus(statusIds, '✗ Save failed — ' + e.message, true);
  }
}

// ── Rates form (repeatable packages) ─────────────────────────────────

async function loadRatesForm() {
  const data = await safeApiGet('rates', {});
  if (data.__error) {
    flashStatus(['rates-status-top'], '✗ Could not load — ' + data.__error, true);
  }
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
  const statusIds = ['rates-status-top'];
  const data = collectRatesForm();
  try {
    await apiCall('rates', 'POST', data, authToken);
    flashStatus(statusIds, '✓ Saved.');
  } catch (e) {
    flashStatus(statusIds, '✗ Save failed — ' + e.message, true);
  }
}

// ── Gallery ──────────────────────────────────────────────────────────

let cachedGallery = { photos: [], videos: [] };

async function loadGallery() {
  const grid = document.getElementById('admin-gallery-grid');
  grid.innerHTML = '<div class="grid-loading"><div class="upload-spinner"></div><p>Loading gallery…</p></div>';
  let raw;
  try {
    raw = await apiCall('gallery', 'GET', null, authToken);
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--vermilion);">Could not load the gallery — ${escapeHtmlAdmin(e.message)}</p>`;
    return;
  }
  cachedGallery = flattenGalleryResponse(raw);
  const items = [
    ...(cachedGallery.photos || []).map(p => ({ ...p, kind: 'photo' })),
    ...(cachedGallery.videos || []).map(v => ({ ...v, kind: 'video' }))
  ];
  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--text-soft);">No items yet — upload one above.</p>';
    return;
  }
  grid.innerHTML = items.map(item => `
    <div class="admin-gallery-card">
      <div class="admin-gallery-thumb">
        <span class="admin-gallery-badge">${item.kind === 'video' ? '🎬 Video' : '🖼️ Photo'}</span>
        ${item.kind === 'video'
          ? `<video src="${resolveAdminImageRef(item.filename)}" muted playsinline webkit-playsinline preload="metadata" onerror="this.closest('.admin-gallery-thumb').classList.add('media-error')"></video>`
          : `<img src="${resolveAdminImageRef(item.filename)}" alt="${escAttr(item.title || '')}" onerror="this.closest('.admin-gallery-thumb').classList.add('media-error')">`}
        <div class="admin-gallery-error-note">Couldn't load — check this file's URL</div>
      </div>
      <div class="meta">
        <h4>${escapeHtmlAdmin(item.title || 'Untitled')}</h4>
        <small>${item.kind === 'video' ? 'Video' : 'Photo'}</small>
        <button class="btn-delete" onclick="deleteGalleryItem('${item.kind}', '${item.id}', this)">Delete</button>
      </div>
    </div>
  `).join('');
}

let currentUploadKind = 'photo';

function setUploadKind(kind) {
  currentUploadKind = kind;
  document.querySelectorAll('.upload-kind-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.kind === kind));
  document.getElementById('upload-kind-label-plural').textContent = kind === 'video' ? 'videos' : 'photos';
  document.getElementById('upload-format-hint').textContent = kind === 'video'
    ? 'MP4 or MOV, up to 10 MB each'
    : 'JPG or PNG, up to 10 MB each';
  document.getElementById('file-input').setAttribute('accept', kind === 'video'
    ? 'video/*,.mp4,.mov,.avi,.mkv,.webm'
    : 'image/*,.jpg,.jpeg,.png,.gif,.webp');
}

// The accept attribute above is only a hint to the OS file picker — most
// browsers still let someone choose "All Files" and pick anything
// regardless. This catches an obvious mismatch after the fact (by file
// extension, which is far more reliable than the browser's guessed MIME
// type — the whole reason this manual Photo/Video toggle exists at all)
// and asks for confirmation rather than silently filing it wrong.
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp'];
const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'];

function detectMismatch(filename, selectedKind) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (selectedKind === 'photo' && VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (selectedKind === 'video' && PHOTO_EXTENSIONS.includes(ext)) return 'photo';
  return null;
}

async function handleFileUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  // One confirmation covering every mismatched file, instead of a
  // separate popup per file — much less disruptive with several files
  // selected at once.
  const mismatched = files.filter(f => detectMismatch(f.name, currentUploadKind));
  if (mismatched.length) {
    const kindLabel = currentUploadKind === 'video' ? 'Video' : 'Photo';
    const names = mismatched.map(f => `• ${f.name}`).join('\n');
    const proceed = confirm(
      `${mismatched.length} file(s) don't look like they match "${kindLabel}", which is selected above:\n\n${names}\n\n` +
      `Click OK to upload everything as ${currentUploadKind === 'video' ? 'videos' : 'photos'} anyway, or Cancel to review your selection.`
    );
    if (!proceed) { e.target.value = ''; return; }
  }

  const kind = currentUploadKind === 'video' ? 'videos' : 'photos';
  const grid = document.getElementById('admin-gallery-grid');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const label = files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : 'Uploading…';
    setUploadZoneBusy(true, label);
    try {
      await uploadOneGalleryFile(file, kind);
    } catch (err) {
      grid.insertAdjacentHTML('afterbegin', `<p style="color:var(--vermilion);grid-column:1/-1;">Upload failed for "${escapeHtmlAdmin(file.name)}" — ${escapeHtmlAdmin(err.message)}</p>`);
    }
  }

  setUploadZoneBusy(false);
  await loadGallery();
  e.target.value = '';
}

function uploadOneGalleryFile(file, kind) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const title = file.name.replace(/\.[^.]+$/, '');
        const media = await apiCall('media', 'POST', { filename: file.name, contentType: file.type, dataBase64: reader.result }, authToken);
        const rawGallery = await apiCall('gallery', 'GET', null, authToken).catch(() => null);
        const clean = flattenGalleryResponse(rawGallery);
        const list = clean[kind] || [];
        list.unshift({ id: generateId(kind === 'videos' ? 'video' : 'photo'), title, filename: media.filename, description: '' });
        clean[kind] = list;
        // Always POST a clean, flat {photos, videos} object — never the
        // raw shape we just read — so this save can't add another layer
        // of nesting on top of whatever is already stored.
        await apiCall('gallery', 'POST', { photos: clean.photos, videos: clean.videos }, authToken);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

// Only the inner content wrapper is swapped for the spinner — the <input>
// element and the outer zone's click listener are never touched. An
// earlier version replaced the whole zone's innerHTML here, which
// destroyed and silently recreated the <input id="file-input"> element —
// the new element had no "change" listener attached (that was only ever
// bound once, at page load, to the original element), so selecting a
// second file after the first upload did nothing until a full page
// reload re-ran the setup code. That was the actual cause of "second
// upload doesn't work."
function setUploadZoneBusy(busy, label) {
  const zone = document.getElementById('upload-zone');
  const content = document.getElementById('upload-zone-content');
  if (!zone || !content) return;
  zone.classList.toggle('is-busy', busy);
  zone.style.pointerEvents = busy ? 'none' : '';
  if (busy) {
    if (!zone.dataset.originalHtml) zone.dataset.originalHtml = content.innerHTML;
    content.innerHTML = `<div class="upload-spinner"></div><p style="margin-top:12px;"><strong>${label}</strong></p>`;
  } else if (zone.dataset.originalHtml) {
    content.innerHTML = zone.dataset.originalHtml;
  }
}

async function deleteGalleryItem(kind, id, btn) {
  const key = kind === 'video' ? 'videos' : 'photos';
  const grid = document.getElementById('admin-gallery-grid');
  if (btn) { btn.disabled = true; btn.classList.add('is-busy'); btn.textContent = 'Deleting…'; }
  try {
    await apiCall('gallery', 'DELETE', null, authToken, `&id=${encodeURIComponent(id)}`);
    await loadGallery();
  } catch (err) {
    // Some deployments don't support DELETE the same way — fall back to
    // writing a clean gallery object (from the already-recovered/flattened
    // data) with this item removed.
    try {
      const clean = { photos: [...(cachedGallery.photos || [])], videos: [...(cachedGallery.videos || [])] };
      clean[key] = clean[key].filter(item => item.id !== id);
      await apiCall('gallery', 'POST', clean, authToken);
      await loadGallery();
    } catch (err2) {
      if (btn) { btn.disabled = false; btn.classList.remove('is-busy'); btn.textContent = 'Delete'; }
      grid.insertAdjacentHTML('afterbegin', `<p style="color:var(--vermilion);grid-column:1/-1;">Delete failed — ${escapeHtmlAdmin(err2.message)}</p>`);
    }
  }
}

// ── Submissions / Inquiries ──────────────────────────────────────────

let cachedSubmissions = [];

async function loadSubmissions() {
  const grid = document.getElementById('submissions-grid');
  const data = await safeApiGet('contact_submissions', []);
  if (data && data.__error) {
    grid.innerHTML = `<p style="color:var(--vermilion);">Could not load inquiries — ${escapeHtmlAdmin(data.__error)}</p>`;
    cachedSubmissions = [];
    return;
  }
  cachedSubmissions = Array.isArray(data) ? data : (data.submissions || []);
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
  try {
    await apiCall('contact_submissions', 'PATCH', null, authToken, `&id=${id}&status=${status}`);
  } catch (e) {
    console.error('Status update failed:', e.message);
    alert('Could not update status — ' + e.message);
  }
}

// ── Analytics ────────────────────────────────────────────────────────
//
// NOTE: there is only one real, documented endpoint here — GET
// ?type=analytics. There is no separate ?type=visitors endpoint (it was
// never in the backend's own documented list) — an earlier version of
// this file called one anyway, which is why "Recent visitors" always
// showed empty regardless of what analytics itself returned. Visitor
// detail, if the backend provides it at all, is expected to live inside
// the analytics response itself (e.g. analytics.visitors).

async function loadAnalytics() {
  const debugEl = document.getElementById('analytics-debug');
  let analytics;
  try {
    analytics = await apiCall('analytics', 'GET', null, authToken);
  } catch (e) {
    document.getElementById('stat-views').textContent = '—';
    document.getElementById('stat-visitors').textContent = '—';
    document.getElementById('stat-new').textContent = '—';
    document.getElementById('stat-repeat').textContent = '—';
    if (debugEl) debugEl.textContent = 'Request failed: ' + e.message;
    return;
  }

  const visitors = Array.isArray(analytics.visitors) ? analytics.visitors : [];
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

  // Raw response, shown collapsed — the fastest way to see exactly what
  // the backend actually sent back, without needing to open DevTools.
  // If Total Views is 0 here too, that confirms track_visitor writes
  // aren't landing (a backend question); if this shows real byDay data
  // but the stat cards above still read 0, that would point at a bug in
  // this rendering code instead — this view makes that distinction
  // checkable at a glance.
  if (debugEl) debugEl.textContent = JSON.stringify(analytics, null, 2);
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
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
  wrapper.innerHTML = entries.length
    ? entries.map(([label, val]) => `
        <div style="display:flex;align-items:center;gap:10px;font-family:var(--font-label);font-size:0.78rem;">
          <span style="width:90px;color:var(--text-soft);">${label}</span>
          <div style="flex:1;background:var(--border);border-radius:4px;overflow:hidden;height:14px;">
            <div style="width:${(val / max * 100).toFixed(0)}%;background:${color};height:100%;"></div>
          </div>
          <span style="width:30px;text-align:right;">${val}</span>
        </div>
      `).join('')
    : '<p style="color:var(--text-soft);font-size:0.85rem;">No data yet.</p>';
  canvas.replaceWith(wrapper);
  wrapper.id = canvas.id;
}

function renderVisitorsTable(visitors) {
  const tbody = document.querySelector('#visitors-table tbody');
  tbody.innerHTML = visitors.length
    ? visitors.map(v => `
        <tr>
          <td>${escapeHtmlAdmin(v.city || '')}, ${escapeHtmlAdmin(v.state || v.country || '')}</td>
          <td>${v.visitCount}</td>
          <td>${new Date(v.lastVisit).toLocaleDateString()}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="color:var(--text-soft);">No visitors recorded yet.</td></tr>';
}

// ── Image upload widgets (hero main, hero secondary, Uttam Kumar's photo)
//
// Each widget holds its current value in imageState[key] — the filename
// returned by the media endpoint after upload. Selecting a file uploads
// and previews it immediately; the actual save into config/content still
// happens when the surrounding form's Save button is clicked (or, for
// removal specifically, immediately — see below). ──────────────────────

const imageState = { heroMain: '', heroSecondary: '', aboutPhoto: '' };

// Which save function persists each image slot, so "Remove" can commit
// right away instead of silently waiting on a separate Save click that's
// easy to forget — that gap was the actual cause of images appearing to
// "not delete": the preview cleared locally, but nothing was ever sent
// to the backend until Save was clicked separately.
const IMAGE_SAVE_FN = {
  heroMain: () => saveSiteInfo(),
  heroSecondary: () => saveSiteInfo(),
  aboutPhoto: () => saveAboutContent()
};

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
    input.value = '';
  });
  removeBtn?.addEventListener('click', async () => {
    // Using "" rather than null here on purpose: some backends silently
    // skip updating a field when the incoming value is null (treating it
    // as "no change"), which would make removal look like it worked in
    // the admin UI but never actually clear the stored value. An empty
    // string is unambiguously "cleared."
    imageState[key] = '';
    renderImageWidget(key);
    if (removeBtn) { removeBtn.disabled = true; removeBtn.textContent = 'Removing…'; }
    await IMAGE_SAVE_FN[key]();
    if (removeBtn) { removeBtn.disabled = false; removeBtn.textContent = 'Remove image'; }
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

function resolveAdminImageRef(ref) {
  if (!ref) return '';
  if (ref.startsWith('data:') || ref.startsWith('http')) return ref;
  return `${APP_CONFIG.API_BASE}&type=media&file=${encodeURIComponent(ref)}`;
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
  const res = await apiCall('media', 'POST', { filename: file.name, contentType: file.type, dataBase64: dataUrl }, authToken);
  return res.filename;
}
