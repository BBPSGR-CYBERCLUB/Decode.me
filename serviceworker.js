const CACHE_NAME = 'error-pages-cache-v1';
const ERROR_PAGES = [
    '404.html',
    'neterr.html'
];

// Install event - cache error pages
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching error pages...');
                return cache.addAll(ERROR_PAGES);
            })
            .catch(error => {
                console.error('Failed to cache error pages:', error);
            })
    );
    event.waitUntil(
        self.skipWaiting().then(() => console.log('Service worker installed'))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                    return Promise.resolve();
                })
            );
        })
    );
    event.waitUntil(
        self.clients.claim().then(() => console.log('Service worker activated'))
    );
});

// Fetch event - serve cached error pages when needed
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                console.log('Fetching:', event.request.url);
                if (response.ok) {
                    return response;
                }
                if (response.status === 404) {
                    return caches.match('404.html');
                }
                return response;
            })
            .catch(error => {
                console.error('Network error:', error);
                return caches.match('neterr.html');
            })
    );
});
