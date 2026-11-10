# SOSX360 — Offline website package

This package keeps the existing single-file HTML application and adds basic offline page caching.

## Files
- `index.html` — existing SOSX360 page, with online/offline status and service-worker registration.
- `sw.js` — caches the application shell and successfully loaded static resources.
- `offline.html` — fallback page if the application has not been cached.

## Deploy to Vercel
1. Put all three files in the same deployed root directory.
2. Ensure the main page is named `index.html` (not only `SOSX360.html`).
3. Commit and push the files to GitHub, then let Vercel redeploy.
4. Open the HTTPS website while online and wait for the service worker to install.
5. Visit the page once while online, then test with browser DevTools > Network > Offline.
6. Refresh. The cached single-page application should load.

## Important limitations
- This is offline page access, not offline emergency dispatch.
- Reports, tracking lookups, admin operations, geocoding and live data need connectivity.
- The map layout may load offline, but map tiles are supplied by an external provider and are not guaranteed to be cached or available offline.
- External Leaflet and Google Fonts resources are cached only after they load successfully online; the system fallback fonts remain available.
- Test the deployed site after every service-worker update. If an old version persists, clear the site's storage/service-worker cache in browser DevTools and reload online.
- Do not use the demo passcode in a real operational deployment. The HTML file currently contains client-side demo authentication and localStorage-based records, which are not secure shared backend services.
