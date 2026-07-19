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

function getOrCreateVisitorId() {
  let id = sessionStorage.getItem('visitorId');
  if (!id) {
    id = 'visitor-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random());
    sessionStorage.setItem('visitorId', id);
  }
  return id;
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
