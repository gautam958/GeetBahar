// Geet Bahar — Configuration
//
// Backend is live. All content, gallery, rates, and submissions data comes
// from this API — there is no local/offline fallback anymore.

window.APP_CONFIG = {
  API_BASE: "https://communication-fn.azurewebsites.net/api/GeetBahar?code=dkb1lkLpp1xG7_verp-g5JL3F_g5ZxMGEwTid-BaP_vxAzFuFSySLA==",

  // TODO: put your real Google OAuth Client ID here — get it from
  // https://console.cloud.google.com/apis/credentials (OAuth 2.0 Client ID,
  // Web application). Until this is a real value, the admin sign-in screen
  // will show a clear error explaining this instead of failing silently.
  GOOGLE_CLIENT_ID: "758897423249-9toac3f4jopm26vo3ge6k1lm8mtjqnrr.apps.googleusercontent.com",

  DEFAULT_LANGUAGE: "hi",
  DEFAULT_THEME: "light"
};

window.IS_GOOGLE_CLIENT_ID_SET = !window.APP_CONFIG.GOOGLE_CLIENT_ID.startsWith("YOUR_GOOGLE_CLIENT_ID");
