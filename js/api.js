// Geet Bahar — API client
//
// When IS_BACKEND_CONFIGURED is false (see config.js), every function here
// short-circuits to bundled/local data instead of making a network call.
// This is what makes the site (and the admin panel) fully usable before
// a backend is ever deployed.

async function apiCall(type, method = 'GET', data = null, authToken = null, params = '') {
  if (!window.IS_BACKEND_CONFIGURED) {
    throw new Error('backend-not-configured');
  }
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
  let id = localStorage.getItem('visitorId');
  if (!id) {
    id = 'visitor-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random());
    localStorage.setItem('visitorId', id);
  }
  return id;
}

async function trackPageView(path = window.location.pathname) {
  if (!window.IS_BACKEND_CONFIGURED) return; // silently skip in local mode
  try {
    await apiCall('track_visitor', 'POST', { path, visitorId: getOrCreateVisitorId() });
  } catch (e) { /* tracking failure should never break the page */ }
}

async function submitContactForm(formData) {
  if (!window.IS_BACKEND_CONFIGURED) {
    // Local mode: keep the submission so the admin demo panel has something to show.
    const list = JSON.parse(localStorage.getItem('gb_demo_submissions') || '[]');
    list.unshift({ ...formData, id: 'local-' + Date.now(), submittedAt: new Date().toISOString(), status: 'new' });
    localStorage.setItem('gb_demo_submissions', JSON.stringify(list));
    return { ok: true, local: true };
  }
  return apiCall('contact_submit', 'POST', formData);
}
