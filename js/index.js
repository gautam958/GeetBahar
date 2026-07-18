// Geet Bahar — Homepage logic

document.addEventListener('DOMContentLoaded', () => {
  trackPageView();
  renderGallery();
  setupGalleryTabs();
  setupLightbox();
  setupContactForm();
  applyAdminOverrides();
});

// ── Admin overrides — hero images, Uttam Kumar's photo, contact info.
//    These come from whatever the admin panel has saved (localStorage in
//    Local Demo Mode, or the live API once a backend is configured). The
//    baked-in i18n content stays as the fallback if nothing's been set. ──

async function applyAdminOverrides() {
  let site = null, content = null;

  if (window.IS_BACKEND_CONFIGURED) {
    try { site = await apiCall('config', 'GET'); } catch (e) { /* keep fallback */ }
    try { content = await apiCall('content', 'GET'); } catch (e) { /* keep fallback */ }
  } else {
    site = readLocalJSON('gb_demo_site_config');
    content = readLocalJSON('gb_demo_page_content');
  }

  if (site) applySiteConfig(site);
  if (content) applyPageContent(content);
}

function readLocalJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}

// A demo-mode ref is already a data: URL (stored directly by the admin
// upload). A live-mode ref is a filename that needs to be resolved against
// the media endpoint.
function resolveImageRef(ref) {
  if (!ref) return null;
  if (window.IS_BACKEND_CONFIGURED && !ref.startsWith('data:')) {
    return `${APP_CONFIG.API_BASE}&type=media&file=${encodeURIComponent(ref)}`;
  }
  return ref;
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

// ── Gallery (renders from bundled sample data; swaps to live data if a
//    backend is configured and returns real items) ──────────────────────

function renderGallery() {
  const data = window.SAMPLE_GALLERY;
  renderGalleryPanel('panel-photos', data.photos, 'photo');
  renderGalleryPanel('panel-videos', data.videos, 'video');

  if (window.IS_BACKEND_CONFIGURED) {
    apiCall('gallery', 'GET').then(live => {
      if (live?.photos?.length) renderGalleryPanel('panel-photos', live.photos, 'photo');
      if (live?.videos?.length) renderGalleryPanel('panel-videos', live.videos, 'video');
    }).catch(() => { /* keep bundled sample content on failure */ });
  }
}

function renderGalleryPanel(panelId, items, kind) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  if (!items || !items.length) {
    panel.innerHTML = `<div class="gallery-empty">No ${kind}s added yet — upload from the admin panel.</div>`;
    return;
  }
  panel.innerHTML = items.map(item => `
    <div class="gallery-item" data-title="${escapeHtml(item.title || '')}">
      <div style="width:100%;height:100%;background:${item.color || 'var(--surface)'};display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-label);font-size:0.8rem;text-align:center;padding:12px;">
        ${kind === 'video' ? '▶ ' : ''}${escapeHtml(item.title || '')}
      </div>
      <div class="gallery-caption">${escapeHtml(item.desc || '')}</div>
    </div>
  `).join('');
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

// ── Lightbox (kept simple; sample gallery uses color blocks, so this is
//    ready for real images once uploaded) ─────────────────────────────

function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = lightbox?.querySelector('.lightbox-close');
  closeBtn?.addEventListener('click', () => lightbox.classList.remove('active'));
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('active'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox?.classList.remove('active'); });
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
    try {
      const res = await submitContactForm(data);
      status.textContent = res?.local
        ? '✓ Saved locally (demo mode) — connect the backend to receive real emails.'
        : '✓ Sent — we will get back to you soon.';
      form.reset();
    } catch (err) {
      status.textContent = 'Could not send — please try again or call us directly.';
    }
  });
}
