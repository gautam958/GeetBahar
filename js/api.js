// Geet Bahar — API client
//
// Every call here hits the live Azure Function. There is no local/demo
// fallback — if a request fails, the caller is responsible for showing
// that to the person (see the error banners in admin.js and index.js)
// rather than silently substituting fake data.

async function apiCall(type, method = 'GET', data = null, authToken = null, params = '') {
  const url = `${APP_CONFIG.API_BASE}&type=${type}${params}`;
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
  if (data && method !== 'GET') options.body = JSON.stringify(data);

  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `API error ${response.status}`);
  }
  if (response.status === 204) return null;
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('application/json')) return response.json();
  return response.text();
}

// ── Gallery data recovery ────────────────────────────────────────────
//
// Some deployments have been observed storing gallery data with recursive
// nesting — each save wraps the *entire* previous gallery blob as a new
// list item instead of replacing the array. Rather than trust the wrapper
// structure (photos vs videos keys), this walks the whole response at any
// depth and recovers real leaf items by their id prefix, which is set
// once at upload time and stays reliable even if the storage around it
// gets mangled. Always use this instead of reading .photos/.videos
// directly on data that came from the API.
function flattenGalleryResponse(raw) {
  const photos = [];
  const videos = [];
  const seenIds = new Set();

  function isLeafItem(node) {
    return node && typeof node === 'object' && typeof node.filename === 'string' && typeof node.id === 'string';
  }

  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (isLeafItem(node)) {
      if (!seenIds.has(node.id)) {
        seenIds.add(node.id);
        (node.id.startsWith('video-') ? videos : photos).push(node);
      }
      return; // leaf items shouldn't contain further nested wrappers
    }
    Object.values(node).forEach(walk);
  }

  walk(raw);
  return { photos, videos };
}

// No persistence at all — a fresh id is generated on every page load. This
// means analytics can no longer distinguish "repeat" from "new" visitors
// across separate visits (that capability required storing something on
// the visitor's device between visits, which is exactly what's being
// removed here). Trade-off accepted per explicit instruction: zero client
// storage of any kind, no exceptions.
let currentVisitorId = null;
function getOrCreateVisitorId() {
  if (!currentVisitorId) {
    currentVisitorId = 'visitor-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random());
  }
  return currentVisitorId;
}

async function trackPageView(path = window.location.pathname) {
  try {
    await apiCall('track_visitor', 'POST', { path, visitorId: getOrCreateVisitorId() });
  } catch (e) {
    console.warn('Visitor tracking failed (non-fatal):', e.message);
  }
}

async function submitContactForm(formData) {
  return apiCall('contact_submit', 'POST', formData);
}
