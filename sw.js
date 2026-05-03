const CACHE_NAME = 'cineverse-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/login.html',
    '/styles.css',
    '/login.css',
    '/app.js',
    '/login.js',
    '/firebase.js',
    '/manifest.json'
];

// Install — cache the static shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('🎬 CineVerse: Caching app shell');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firebase, external CDN, and API calls — always go to network
    if (
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com') ||
        url.hostname.includes('google.com') ||
        url.hostname.includes('firebaseapp.com') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.pathname.startsWith('/api/')
    ) {
        return;
    }

    // For TMDB images — cache them as the user browses
    if (url.hostname.includes('image.tmdb.org')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cached) => {
                    if (cached) return cached;
                    return fetch(event.request).then((response) => {
                        if (response.ok) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    }).catch(() => new Response('', { status: 408 }));
                });
            })
        );
        return;
    }

    // For local static assets — cache first, network fallback
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                // Cache successful responses for future
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // If offline and not cached, show a basic offline page for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return new Response('', { status: 408 });
            });
        })
    );
});
