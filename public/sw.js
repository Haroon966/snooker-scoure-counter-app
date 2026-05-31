const CACHE_NAME = 'snooker-__CACHE_VERSION__';
const PRECACHE_URLS = __PRECACHE_URLS__;

function getBase() {
  const path = new URL('./', self.location.href).pathname;
  return path.endsWith('/') ? path : `${path}/`;
}

function offlineResponse() {
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}

async function precacheAll(cache, urls) {
  await Promise.allSettled(urls.map((url) => cache.add(url)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => precacheAll(cache, PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

function shouldHandle(url, request) {
  if (request.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;

  const base = getBase();
  if (!url.pathname.startsWith(base)) return false;

  if (url.pathname.includes('/src/') || url.pathname.includes('@vite') || url.pathname.includes('node_modules')) {
    return false;
  }

  return true;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!shouldHandle(url, event.request)) return;

  const base = getBase();

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(async () => (await caches.match(`${base}index.html`)) || offlineResponse())
    );
    return;
  }

  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request)
            .then((res) => {
              if (res.ok) {
                caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
              }
              return res;
            })
            .catch(async () => (await caches.match(event.request)) || offlineResponse())
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(event.request)) || offlineResponse())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
