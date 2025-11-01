// Read VERSION from URL param
const url = new URL(self.registration.scope);
const VERSION = url.searchParams.get('v') || 'v0.0.0';
const CACHE = `pwa-${VERSION}`;

const ASSETS = [
  '/', '/index.html', '/css/style.css', '/js/app.js', '/manifest.json',
  '/assets/flags/en.svg', '/assets/flags/pl.svg', '/assets/flags/de.svg',
  '/assets/icons/icon-192.png', '/assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (req.url.includes('content.json') || req.url.includes('index.html')) {
    e.respondWith(
      fetch(req).then(r => caches.open(CACHE).then(c => { c.put(req, r.clone()); return r; }))
        .catch(() => caches.match(req))
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(r => caches.open(CACHE).then(c => { c.put(req, r.clone()); return r; })))
    );
  }
});

self.addEventListener('message', e => {
  if (e.data?.action === 'skipWaiting') self.skipWaiting();
});