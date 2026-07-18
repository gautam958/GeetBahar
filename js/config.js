// Geet Bahar — Configuration
//
// IMPORTANT: leave API_BASE as-is to run the site fully offline/local —
// all public content is bundled in js/i18n-data.js, and the admin panel
// runs in Local Demo Mode (saves to your browser's localStorage) until
// you deploy the real backend and put its URL + key here.

window.APP_CONFIG = {
  // Replace with your deployed Azure Function URL + key once ready.
  // Until then this stays as the placeholder and the site runs in local mode.
  API_BASE: "https://your-function-app.azurewebsites.net/api/geet-bahar?code=YOUR_FUNCTION_KEY",

  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",

  DEFAULT_LANGUAGE: "hi",
  DEFAULT_THEME: "light",

  FEATURES: {
    analytics: true,
    contact_form: true,
    gallery: true,
    visitor_tracking: true
  }
};

// True whenever API_BASE still contains the placeholder — this is what
// switches index.html and admin.html into local/demo behaviour.
window.IS_BACKEND_CONFIGURED = !window.APP_CONFIG.API_BASE.includes("your-function-app");
