const CACHE_NAME = 'apartment-guide-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/content.json',
  '/manifest.json',
  '/css/style.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css',
  // Local flags
  '/assets/flags/en.svg',
  '/assets/flags/pl.svg',
  '/assets/flags/de.svg',
  '/assets/flags/fr.svg',
  '/assets/flags/it.svg',
  '/assets/flags/es.svg',
  '/assets/flags/nl.svg',
  '/assets/flags/cs.svg',
  '/assets/flags/sk.svg',
  '/assets/flags/uk.svg'
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