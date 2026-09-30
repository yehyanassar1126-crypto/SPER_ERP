// ===== SPER_ERP — SERVICE WORKER (PWA) =====
// Network-first strategy to ensure instant updates with offline fallback

var CACHE_NAME = 'sper-erp-v25';
var STATIC_ASSETS = [
  '../screens/portal/portal.html',
  'css/styles.css',
  'css/ai-mind.css',
  'css/enterprise-ux.css',
  'css/ai-erp.css',
  'js/core/config.js',
  'js/core/constants.js',
  'js/core/icons.js',
  'js/core/helpers.js',
  'js/core/sper-logo-data.js',
  'js/core/app.js',
  'assets/sper_erp_logo.png',
  'assets/logo.png',
  'manifest.json'
];

// Install: cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching SPER_ERP assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: purge all old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('[SW] Purging old cache:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: NETWORK FIRST for everything to ensure the user always sees the latest updates immediately
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  
  // Skip Supabase API calls
  if (url.hostname.includes('supabase') || url.hostname.includes('cdn.jsdelivr') || url.hostname.includes('unpkg')) {
    return;
  }

  // Network first with cache fallback
  event.respondWith(
    fetch(event.request).then(function(networkResponse) {
      if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
        var responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
  return;
});

  // HTML pages: network first, cache fallback
  if (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }
});

// Offline Queue: stores failed POST/PATCH requests for later sync
var OFFLINE_QUEUE_KEY = 'nf_offline_queue';

self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

function syncOfflineQueue() {
  // This would be triggered when connectivity is restored
  // Implementation depends on IndexedDB for storing queued operations
  console.log('[SW] Sync offline queue triggered');
  return Promise.resolve();
}
