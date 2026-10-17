// ===== Service Worker for SkillTimer PWA =====
// All URLs are relative to the app root so the app also works when it is
// hosted under a sub-path (e.g. GitHub Pages).

const CACHE_NAME = 'skilltimer-v3';
const SCOPE = self.registration.scope;

const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/i18n.js',
    './js/storage.js',
    './js/notifications.js',
    './js/video.js',
    './js/timer.js',
    './manifest.json',
    './assets/icons/icon-72x72.png',
    './assets/icons/icon-96x96.png',
    './assets/icons/icon-128x128.png',
    './assets/icons/icon-144x144.png',
    './assets/icons/icon-152x152.png',
    './assets/icons/icon-192x192.png',
    './assets/icons/icon-384x384.png',
    './assets/icons/icon-512x512.png'
].map(path => new URL(path, SCOPE).href);

// ===== Install =====
self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);

        // Cache each file separately so one missing file cannot break the
        // whole installation.
        await Promise.all(CORE_ASSETS.map(async (url) => {
            try {
                const response = await fetch(url, { cache: 'reload' });
                if (response && response.ok) {
                    await cache.put(url, response);
                }
            } catch (error) {
                console.warn('Could not precache:', url);
            }
        }));

        await self.skipWaiting();
    })());
});

// ===== Activate =====
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        const hadOldCaches = cacheNames.some((cacheName) => cacheName !== CACHE_NAME);

        await Promise.all(cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
                return caches.delete(cacheName);
            }
            return Promise.resolve();
        }));

        await self.clients.claim();

        // If this activation replaced an older version, reload open windows
        // once so they pick up the new HTML/CSS/JS instead of the stale
        // cache-first copy served by the old worker.
        if (hadOldCaches) {
            const windowClients = await self.clients.matchAll({ type: 'window' });
            await Promise.all(windowClients.map((client) => {
                if ('navigate' in client && client.url) {
                    return client.navigate(client.url).catch(() => {});
                }
                return Promise.resolve();
            }));
        }
    })());
});

// ===== Fetch: network-first with cached fallback =====
self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Only handle same-origin requests. Fonts and other third-party assets
    // go straight to the network.
    if (url.origin !== self.location.origin) return;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const response = await fetch(request);

        if (response && response.ok) {
            cache.put(request, response.clone()).catch(() => {});
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;

        // Navigation fallback to the app shell
        if (request.mode === 'navigate') {
            const shell = await cache.match(new URL('./index.html', SCOPE).href) ||
                await cache.match(new URL('./', SCOPE).href);
            if (shell) return shell;
        }

        return new Response('Offline', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

// ===== Allow the page to activate a waiting worker =====
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
