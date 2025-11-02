const CACHE_NAME = 'apartment-guide-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/content.json',
  '/manifest.json',
  '/css/style.css',
  '/css/tabler-icons.css',
  // Local PNG Flags
  '/assets/flags/gb.png',
  '/assets/flags/pl.png',
  '/assets/flags/de.png',
  '/assets/flags/fr.png',
  '/assets/flags/it.png',
  '/assets/flags/es.png',
  '/assets/flags/nl.png',
  '/assets/flags/cz.png',
  '/assets/flags/sk.png',
  '/assets/flags/uk.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('content.json')) {
    event.respondWith(
      fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('SW: skipWaiting received');
    self.skipWaiting();
  }
});