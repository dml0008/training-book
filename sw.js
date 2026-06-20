const CACHE_NAME = "training-book-shell-v60";
const STATIC_ASSETS = [
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "fonts/figtree-latin.woff2"
];
const APP_FILES = [
  "./",
  "index.html",
  // styles.css was split into ordered parts (load order set in index.html).
  "styles-01-base.css",
  "styles-02-layout.css",
  "styles-03-workout.css",
  "styles-04-progress.css",
  "styles-05-interactions.css",
  "styles-06-plan.css",
  "styles-07-library.css",
  "app.js",
  // throwaway style-guide page: network-first so edits show fresh while iterating
  "styleguide.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only handle our own app's files. Let everything else (Firebase sign-in,
  // the live database connection, the Firebase code on Google's CDN) go
  // straight to the network untouched, so real-time sync is never cached.
  if (url.origin !== self.location.origin) return;

  const isAppFile = APP_FILES.some((file) => url.pathname.endsWith(file) || file === "./");

  event.respondWith(
    (isAppFile ? networkFirst : cacheFirst)(event.request)
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request) || new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return fetch(request).catch(() => new Response("Offline", { status: 503 }));
}
