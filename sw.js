const CACHE_NAME = 'venuesync-cache-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Outfit:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Exclude API calls from aggressive caching to ensure realtime efficiency
    if (event.request.url.includes('/api/')) {
        return;
    }
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
