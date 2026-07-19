# What Changed — v2 Redesign

This replaces the previous `index.html`, `admin.html`, and CSS. Backend
(`geet-bahar.csx`) and seed data in `/data/` are unchanged — your complaint
was about the design and local admin testing, not the backend, so those
weren't touched.

## Why the last version felt empty/basic

The old homepage rendered its content (about text, services, gallery) only
after a `fetch()` call to the Azure API. With no backend deployed, those
calls failed silently and left sections blank or with placeholder text like
"About section coming soon." The admin page had the same problem, plus it
required a real Google OAuth sign-in with no way in otherwise — so opening
it locally, without a deployed backend, left you stuck on the sign-in
screen with no way to see or test anything.

## What's different now

**Design** — rebuilt using a palette and layout grounded in the group's
actual world (Shravani Mela's monsoon-night processions, kanwariya saffron,
marigold garlands) instead of a generic template look. New type system
(Baloo 2 / Hind / Rajdhani), a signature "taal beat-strip" motif used as
section dividers and scroll navigation instead of generic dots, real
written copy for every section (not placeholders).

**Content is no longer empty by default** — all homepage copy and sample
gallery items are now bundled directly in `js/i18n-data.js` and render
immediately on page load. The API is now an optional enhancement layer: if
you deploy the real backend later, live data will override the bundled
content automatically. If you don't, the site still looks complete.

**Admin page now opens and works locally** — added a "Continue in Local
Demo Mode" button on the sign-in screen. It skips Google auth entirely and
loads sample data, with all edits (content, rates, gallery uploads, contact
statuses) saved to your browser's `localStorage`. Every tab — Content,
Gallery, Rates, Inquiries, Analytics — is fully clickable and functional
with zero setup. A yellow banner makes it clear you're in demo mode. Once
you deploy the real backend and set `GOOGLE_CLIENT_ID` + `API_BASE` in
`js/config.js`, the real Google sign-in path takes over automatically.

**Fixed a real crash** — while testing this myself, the analytics tab threw
an uncaught error whenever Chart.js's CDN script failed to load (blocked
network, offline testing, ad-blockers). It now falls back to a plain HTML
bar list so the tab still shows real numbers instead of breaking.

## How I verified this (not just claimed it)

I ran the actual pages in a headless browser (Playwright) against a local
static server, the same way you'd open them, and checked real output:

```
=== INDEX.HTML ===
Service cards: 6
Gallery photos: 4
Hero after EN toggle: [renders correctly]
data-theme attr after switching to dark: dark
Form status after submit: "✓ Saved locally (demo mode)..."

=== ADMIN.HTML ===
Admin shell visible after clicking Demo Mode: True
Stat views: 119        (was "—" / broken before)
Stat visitors: 3
Gallery admin cards: 6
Submission cards: 1
Save status text: "✓ Saved locally (demo mode)."

=== JS ERRORS ===
None (after the Chart.js fallback fix — see above)
```

I'm showing you this output instead of just asserting it works, since the
last round of claims turned out not to hold up.

## One honest caveat

Google Fonts, Chart.js, and Google Sign-In all load from CDNs. In my
sandboxed test environment those specific domains are blocked by a network
proxy, so fonts fell back to system fonts and charts used the plain-bar
fallback in my test screenshots. On your actual machine, with normal
internet access, all three will load as intended — I'm flagging this so
you know it's an artifact of my test environment, not a claim I can't
back up. If your own network also blocks these CDNs, the fallbacks will
keep the site fully functional either way.

## To open it locally right now

1. You need a local static server (opening via `file://` directly will
   block `fetch()` calls due to browser CORS rules — this is a browser
   restriction, not a bug in the code). From inside the extracted folder:
   ```
   python3 -m http.server 8000
   ```
   (or use the VS Code "Live Server" extension, or `npx http-server`)
2. Visit `http://localhost:8000/index.html` — fully populated, no setup.
3. Visit `http://localhost:8000/admin.html` → click **"Continue in Local
   Demo Mode"** → every tab works immediately.

---

## Update: Content & Rates are now real forms, not JSON

The Content tab is now two forms — "Contact & hero" (phone, email, address,
hero titles, business hours, social links) and "About, services & FAQ"
(with add/remove buttons for paragraphs, service cards, and FAQ entries).
The Rates tab is a form with add/remove package cards plus fields for the
two government rates and the notes text. Nothing needs raw JSON anymore.

Underneath, the forms still read and write the exact same JSON shape the
backend (`geet-bahar.csx`) expects — `config`, `content`, and `rates`
endpoints are unchanged, so this is a pure admin-UI change with no backend
impact.

Verified with the same headless-browser approach as before:

```
Phone field pre-filled:        +91-87654 32100
About paragraph rows:           3
Service rows:                   6
FAQ rows:                       2
Added a service row: 6 -> 7, filled it, saved
After page reload: 7 rows, new service still there  (persisted correctly)
Removed a row: 7 -> 6                                (delete works)
Rates: added a package row, saved, count 3 -> 4      (persisted)
JS errors: None
```


---

## Update: Hero image + Uttam Kumar's photo can now be uploaded

Two gaps fixed:

1. **Hero visual had no upload option.** Admin → Content → "Contact & hero"
   now has two image upload slots: a main hero image and an optional
   secondary image (shown near the stats row, similar to the layered
   look in the reference you shared). Until an image is uploaded, the
   hero keeps its designed gradient + taal-strip look — it never shows a
   broken or empty box.

2. **No place for Uttam Kumar's photo.** Admin → Content → "About,
   services & FAQ" now has an upload slot right under the intro line.
   Until a photo is added, that spot shows a tasteful monogram card
   (initial + "Uttam Kumar · Founder & Director") instead of empty space
   or a dashed "missing image" box.

Both flow through to the public homepage automatically — upload in the
admin panel, click Save, and the image appears live (instantly in Local
Demo Mode; after your Azure backend is deployed, via the real `media` and
`config`/`content` endpoints in Live mode). Removing an image reverts to
the fallback design instead of leaving a broken `<img>` tag.

**On the reference photo you shared** — I can't recreate that specific
image (it shows a real temple and real performers; generating a fake
photorealistic stand-in would be misleading rather than a real fix). What
I built instead is the actual mechanism: once you upload your own event
photography into these two slots, the homepage will have that same
layered look — a real photo behind the hero text, plus a smaller second
photo near the stats.

Verified with an actual file upload through a headless browser (not just
code review):

```
Uploaded test image to hero-main slot      -> preview appears, remove button appears
Uploaded test image to hero-secondary slot -> preview appears
Saved "Contact & hero" form
Uploaded test image to Uttam Kumar's photo slot -> preview appears
Saved "About" form

Reloaded the actual public homepage:
  Hero main image visible:          True
  Hero secondary image visible:     True (wrapper's "empty" class removed)
  About photo visible:              True (monogram fallback hidden)
  hero-visual "has-image" class:    True (gradient overlay activates for contrast)

Clicked "Remove image" on hero main -> preview disappears, upload prompt returns
JS errors: None
```

---

## Update: Save button was real, but buried too far away

You were right — the "Save about, services & FAQ" button existed and
worked, but it sat at the very bottom of the About form, roughly 4,875px
down the page (past 3 paragraphs, 6 service cards, and 2 FAQ entries).
After uploading Uttam Kumar's photo near the top of that form, there was
no reasonable way to spot it without scrolling several screens down.

Fixed by adding a second Save button (with its own status message) at the
**top** of each long form — About, Contact & hero, and Rates — right next
to the fields you're most likely editing first, in addition to keeping the
original one at the bottom for after you've finished a full pass. Both
buttons call the same save function and both status messages update
together, so it doesn't matter which one you click.

Verified with the exact flow you described — upload the photo, then look
for Save without scrolling past it:

```
Scrolled to the photo upload zone (not the very top of the page)
Save button visible in that same scroll position: True
Distance from upload zone to save button: 182px (same screen)

Clicked it: 
  Top status:    "✓ Saved locally (demo mode)."
  Bottom status: "✓ Saved locally (demo mode)."
Reloaded the page → photo still there (confirms it actually saved,
not just showed a message)
JS errors: None
```

---

## Update: Live backend integration, Google Sign-In, gallery bug fix, and more

### The gallery bug you asked about — found and fixed
`index.js` was reading a hardcoded sample array (`window.SAMPLE_GALLERY`)
on every page load, completely ignoring whatever the admin had actually
saved — in every mode, demo or live. Uploads never had a path to the
public page at all. That hardcoded array is now deleted entirely; the
homepage gallery loads only from the live `gallery` API endpoint.

### Backend wired to your real deployment
`js/config.js` now points at your Azure Function:
```
https://communication-fn.azurewebsites.net/api/GeetBahar?code=...
```
I confirmed it's reachable (got a valid JSON response). One flag: requesting
`?type=config` returned a generic service-info banner rather than actual
config data — that might be normal (nothing saved yet) or might mean your
deployed function's routing differs slightly from the documented contract.
Worth a quick check on your end since I can't inspect your actual Azure
code from here.

### Demo mode and localStorage-for-data — removed
All of `DEMO_KEYS`, `SEED`, `demoGet`/`demoSet`, the "Continue in Local
Demo Mode" button, and the demo banner are gone. Every admin load/save now
calls the real API only. If a request fails, the affected section shows a
plain-language error message instead of silently showing fake content.

**One thing I kept in localStorage on purpose:** the visitor ID (anonymous,
used only so analytics can tell repeat visitors from new ones) and the
signed-in admin's auth token. Neither of these duplicates your actual
content data — they're just client-side session/identity bits, the same
way any site would use a cookie. Let me know if you'd rather those go too.

### Google Sign-In — wired, needs one value from you
The sign-in flow is fully live: real `google.accounts.id` calls, a proper
JWT decode for the signed-in email, and the admin shell only unlocks after
a real credential comes back from Google. The one thing I can't supply is
your **Google OAuth Client ID** — I don't have one, and inventing a value
would just break sign-in silently. Get one from
[Google Cloud Console](https://console.cloud.google.com/apis/credentials)
(OAuth 2.0 Client ID → Web application) and paste it into
`GOOGLE_CLIENT_ID` in `js/config.js`. Until then, the sign-in screen shows
a plain-language message explaining exactly this, instead of a broken
button.

### Image/video modal on the homepage
Gallery items now render real thumbnails (actual `<img>`/`<video>` tags
pointed at your uploaded files, not the color-block placeholders from
before). Clicking a photo opens it full-size in a modal; clicking a video
opens the same modal with a real, playable `<video>` element — not the
image element by mistake.

### Language selector → toggle button
Replaced the हिन्दी/English `<select>` dropdown with a two-segment
pill toggle (हिं / EN) in the header — same behavior, one click instead
of opening a dropdown.

### Mobile admin menu
Found the actual bug: I'd previously written `display: none` on the public
site's "Admin" link at narrow widths — meaning there was no way to reach
`admin.html` from a phone at all. That's removed; the link now just
shrinks to fit. Separately, the admin panel's own tab bar (Content /
Gallery / Rates / Inquiries / Analytics) is confirmed horizontally
scrollable with proper touch sizing on mobile.

### How this was tested
I can't reach your actual Azure Function or Google's OAuth servers from
this sandbox (its network is locked to a small allowlist that doesn't
include `azurewebsites.net` or `accounts.google.com` — the one health-check
fetch I did earlier only worked because you gave me that exact URL
directly in this conversation). So I built a local mock server that
implements the same documented contract (GET/POST/DELETE/PATCH across
config/content/rates/gallery/media/contact_submissions/analytics/visitors),
pointed a test copy of the frontend at it, and ran it through a headless
browser:

```
Signed-in shortcut (simulated session) → admin shell loads: True
Phone field loaded from API: "+91-87654 32100"      (real API data, not seed)
Service/package/submission rows all loaded from the mock API correctly

Uploaded a photo + a video via Admin → Gallery
  Public homepage photo panel items: 1
  Public homepage video panel items: 1
  Clicked photo  → modal shows <img>, video element hidden
  Clicked video  → modal shows <video>, image element hidden

Deleted the uploaded photo → gallery card count 1 → 0

Uploaded hero image + Uttam Kumar's photo → saved →
  both visible on the public homepage, fallback states hidden

Mobile (375px viewport):
  Public "Admin" link visible: True
  Admin tab bar present and sized to viewport: True

Language toggle: clicking EN sets it active, translations apply

JS errors: None (all console noise was 403s from this sandbox's own
network proxy blocking font/Google/CDN domains — not app bugs)
```

**What I could NOT test:** the actual Google OAuth popup/consent screen
(needs `accounts.google.com`, which I can't reach), and your real Azure
Function's exact behavior beyond the one GET request above. Once you add
your `GOOGLE_CLIENT_ID`, please do one real click-test of signing in and
saving something — that's the one path only you can verify end-to-end.
