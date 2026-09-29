// ===== NINJA FACTORY ERP — SERVICE WORKER (PWA) =====
// Provides basic offline caching for static assets
// and queue support for factory floor operations

var CACHE_NAME = 'nf-erp-v14';
var STATIC_ASSETS = [
  '../../screens/portal/portal.html',
  '../css/styles.css',
  '../css/ai-mind.css',
  '../css/enterprise-ux.css',
  '../css/ai-erp.css',
  'config.js',
  'constants.js',
  'icons.js',
  'helpers.js',
  'translations.js',
  '../public/logo.png',
  '../manifest.json'
];

// Install: cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first, cache fallback for navigation
// Cache first for static assets
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  
  // Skip Supabase API calls - always network
  if (url.hostname.includes('supabase') || url.hostname.includes('cdn.jsdelivr') || url.hostname.includes('unpkg')) {
    return;
  }

  // Static assets: cache first
  if (event.request.method === 'GET' && (
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.svg')
  )) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request).then(function(networkResponse) {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

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
