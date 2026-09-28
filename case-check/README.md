# Case-Check

Standalone static page at `/case-check/`. No build step, backend, analytics or external font requests. Existing site pages are unchanged.

Questions and local Archivo font files match the approved conference handout `output/SESSION_V2/HANDOUT_A5.html` (read-only source in the Landeskoferenz KI project). Font license: Archivo-OFL.txt.

Storage: `tigr.case-check.v1`, JSON `{version: 1, values: {...}}`. Every input/change saves synchronously. All radios begin empty. Invalid saved schemas are preserved until explicit reset; save errors remain visible and exports continue working. Only the dedicated key is removed by reset.

Export: plain text, including unanswered fields. Clipboard failure exposes selectable text; download creates a local Blob. The email action opens an unsent draft addressed to tim@tigr.ventures. Users deliberately paste or attach their check before sending; no form content goes into URL parameters.

Verification on 2026-09-28: Chromium with a fresh persistent profile, all fields restored after reload and full browser close/relaunch; 11 initially blank questions; baseline decimal/zero/invalid values; full and incomplete text export; clipboard success/fallback; reset cancel/confirm/Escape; corrupt JSON/schema, quota and denied storage; keyboard radio selection; no form requests or page errors; overflow checks at 320, 390, 768, 1440 px and visual review on mobile/desktop.

To repeat the checks, serve the repo with `python3 -m http.server 8766`, make Playwright available to Node, then run `node tests/case-check.cjs` and `node tests/case-check-interactions.cjs`. Optional environment variables: `CHECK_URL` and `CHROMIUM_PATH` (an already installed Chromium executable). Tests use independent profiles and generated test data, and never send an email.
