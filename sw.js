const CACHE_VERSION = "sosx360-static-v1";
const APP_SHELL = ["/", "/index.html", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key.startsWith("sosx360-") && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache APIs, authentication endpoints, or other dynamic/private data.
  if (url.origin === self.location.origin &&
      (url.pathname.startsWith("/api/") ||
       url.pathname.startsWith("/auth/"))) return;

  // This is a single-page HTML application: hash routes share the same document.
  if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put("/", response.clone());
          await cache.put("/index.html", response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) ||
               (await caches.match("/")) ||
               (await caches.match("/index.html")) ||
               (await caches.match("/offline.html"));
      }
    })());
    return;
  }

  // Cache same-origin assets and the external libraries/fonts used by this HTML
  // after they have loaded successfully online. Opaque CDN responses are allowed.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return cached || Response.error();
    }
  })());
});
