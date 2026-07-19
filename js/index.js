// Geet Bahar — Homepage logic
//
// Everything on this page — gallery, about text, hero images, contact
// info, rates — is loaded from the live API on every page view. There is
// no bundled/sample fallback for content that should come from the
// backend; the bilingual UI labels in i18n-data.js are the only
// exception (those are interface copy, not site content).

document.addEventListener('DOMContentLoaded', () => {
  trackPageView();
  renderGallery();
  setupGalleryTabs();
  setupLightbox();
  setupContactForm();
  applyAdminOverrides();
});

// ── Gallery — loaded from the real API only ─────────────────────────────

let galleryData = { photos: [], videos: [] };

async function renderGallery() {
  try {
    const raw = await apiCall('gallery', 'GET');
    galleryData = flattenGalleryResponse(raw);
  } catch (e) {
    console.error('Could not load gallery:', e.message);
    renderGalleryError('panel-photos');
    renderGalleryError('panel-videos');
    return;
  }
  renderGalleryPanel('panel-photos', galleryData.photos || [], 'photo');
  renderGalleryPanel('panel-videos', galleryData.videos || [], 'video');
}

function renderGalleryError(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) panel.innerHTML = `<div class="gallery-empty">Could not load this right now — please try again shortly.</div>`;
}

function renderGalleryPanel(panelId, items, kind) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  if (!items.length) {
    panel.innerHTML = `<div class="gallery-empty">No ${kind}s added yet — upload from the admin panel.</div>`;
    return;
  }
  panel.innerHTML = items.map((item, i) => {
    const url = resolveImageRef(item.filename);
    const thumb = kind === 'video'
      ? `<video src="${url}" muted preload="metadata" onerror="this.closest('.gallery-item').classList.add('media-error')"></video><span class="gallery-play-badge">▶</span>`
      : `<img src="${url}" alt="${escapeHtml(item.title || '')}" loading="lazy" onerror="this.closest('.gallery-item').classList.add('media-error')">`;
    return `
      <div class="gallery-item" onclick="openMediaModal('${kind}', ${i})">
        ${thumb}
        <div class="gallery-error-note">Couldn't load this file — check the admin panel</div>
        <div class="gallery-caption">${escapeHtml(item.title || '')}</div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function setupGalleryTabs() {
  document.querySelectorAll('.gallery-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.gallery-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.panel)?.classList.add('active');
    });
  });
}

// ── Media modal — images open full-size, videos open playable ──────────
// (Previously photos/videos were flat color blocks with no way to view
// them properly; this opens the real file, sized to fit the viewport.)

function openMediaModal(kind, index) {
  const item = (kind === 'video' ? galleryData.videos : galleryData.photos)[index];
  if (!item) return;
  const modal = document.getElementById('lightbox');
  const imgEl = document.getElementById('lightbox-image');
  const videoEl = document.getElementById('lightbox-video');
  const errorEl = document.getElementById('lightbox-error');
  const url = resolveImageRef(item.filename);
  errorEl.style.display = 'none';

  if (kind === 'video') {
    imgEl.style.display = 'none';
    videoEl.style.display = 'block';
    videoEl.onerror = () => { videoEl.style.display = 'none'; errorEl.style.display = 'block'; };
    videoEl.src = url;
    videoEl.load();
  } else {
    videoEl.pause();
    videoEl.style.display = 'none';
    videoEl.removeAttribute('src');
    imgEl.style.display = 'block';
    imgEl.onerror = () => { imgEl.style.display = 'none'; errorEl.style.display = 'block'; };
    imgEl.src = url;
    imgEl.alt = item.title || '';
  }
  modal.classList.add('active');
}

function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = lightbox?.querySelector('.lightbox-close');
  const videoEl = document.getElementById('lightbox-video');

  function closeModal() {
    lightbox.classList.remove('active');
    videoEl?.pause();
  }

  closeBtn?.addEventListener('click', closeModal);
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ── Media URL resolution ─────────────────────────────────────────────

function resolveImageRef(ref) {
  if (!ref) return '';
  if (ref.startsWith('data:') || ref.startsWith('http')) return ref;
  return `${APP_CONFIG.API_BASE}&type=media&file=${encodeURIComponent(ref)}`;
}

// ── Contact form ───────────────────────────────────────────────────────

function setupContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    status.textContent = 'Sending…';
    status.style.color = '';
    try {
      await submitContactForm(data);
      status.textContent = '✓ Sent — we will get back to you soon.';
      form.reset();
    } catch (err) {
      status.textContent = 'Could not send — please try again or call us directly.';
      status.style.color = 'var(--vermilion)';
    }
  });
}

// ── Admin overrides — hero images, Uttam Kumar's photo, contact info,
//    always loaded live from the API. ─────────────────────────────────

async function applyAdminOverrides() {
  try {
    const site = await apiCall('config', 'GET');
    if (site) applySiteConfig(site);
  } catch (e) {
    console.error('Could not load site config:', e.message);
  }
  try {
    const content = await apiCall('content', 'GET');
    if (content) applyPageContent(content);
  } catch (e) {
    console.error('Could not load page content:', e.message);
  }
}

function applySiteConfig(site) {
  if (site.contact) {
    if (site.contact.phone) document.getElementById('contact-phone').textContent = site.contact.phone;
    if (site.contact.email) document.getElementById('contact-email').textContent = site.contact.email;
    if (site.contact.address) document.getElementById('contact-address').textContent = site.contact.address;
  }
  if (site.businessHours) {
    const h = site.businessHours;
    const parts = [h.mon_fri && `Mon–Fri ${h.mon_fri}`, h.saturday && `Sat ${h.saturday}`, h.sunday && `Sun ${h.sunday}`].filter(Boolean);
    if (parts.length) document.getElementById('contact-hours').textContent = parts.join(' · ');
  }

  const mainRef = site.hero?.heroImage;
  if (mainRef) {
    const img = document.getElementById('hero-main-img');
    const visual = document.getElementById('hero-visual');
    img.src = resolveImageRef(mainRef);
    img.style.display = 'block';
    visual.classList.add('has-image');
  }

  const secRef = site.hero?.heroImageSecondary;
  if (secRef) {
    const wrap = document.getElementById('hero-secondary-image');
    const img = document.getElementById('hero-secondary-img');
    img.src = resolveImageRef(secRef);
    img.style.display = 'block';
    wrap.classList.remove('empty');
  }
}

function applyPageContent(content) {
  const photoRef = content.about?.photo;
  if (photoRef) {
    const img = document.getElementById('about-photo-img');
    const fallback = document.getElementById('about-photo-fallback');
    img.src = resolveImageRef(photoRef);
    img.style.display = 'block';
    if (fallback) fallback.style.display = 'none';
  }
}
