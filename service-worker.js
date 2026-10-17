// ===== Service Worker for SkillTimer PWA =====

const CACHE_NAME = 'skilltimer-v1';
const ASSETS_CACHE_NAME = 'skilltimer-assets-v1';

// ===== Core assets to cache =====
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/i18n.js',
    '/js/storage.js',
    '/js/notifications.js',
    '/js/video.js',
    '/js/timer.js',
    '/manifest.json'
];

// ===== Asset files to cache =====
const ASSET_FILES = [
    // Icons will be cached if available
    '/assets/icons/icon-72x72.png',
    '/assets/icons/icon-96x96.png',
    '/assets/icons/icon-128x128.png',
    '/assets/icons/icon-144x144.png',
    '/assets/icons/icon-152x152.png',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-384x384.png',
    '/assets/icons/icon-512x512.png'
];

// ===== Install Event =====
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                console.log('Core assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache core assets:', error);
            })
    );
});

// ===== Activate Event =====
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE_NAME) {
                            console.log(`Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service worker activated');
                return self.clients.claim();
            })
    );
});

// ===== Fetch Event =====
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Don't cache API requests or video files
    if (url.pathname.startsWith('/api/') || isVideoRequest(url)) {
        return;
    }
    
    // Handle core assets
    if (CORE_ASSETS.includes(url.pathname)) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request);
                })
        );
        return;
    }
    
    // Handle asset files
    if (ASSET_FILES.includes(url.pathname)) {
        event.respondWith(
            caches.open(ASSETS_CACHE_NAME)
                .then((cache) => {
                    return cache.match(event.request)
                        .then((response) => {
                            if (response) {
                                return response;
                            }
                            
                            return fetch(event.request)
                                .then((response) => {
                                    if (response.status === 200) {
                                        cache.put(event.request, response.clone());
                                    }
                                    return response;
                                });
                        });
                })
        );
        return;
    }
    
    // Handle other requests with cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request)
                    .then((response) => {
                        // Cache successful responses
                        if (response.status === 200 && isCacheable(url)) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    });
            })
    );
});

// ===== Check if request is for video =====
function isVideoRequest(url) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv'];
    return videoExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext));
}

// ===== Check if URL is cacheable =====
function isCacheable(url) {
    // Don't cache HTML pages (except index.html)
    if (url.pathname.endsWith('.html') && url.pathname !== '/') {
        return false;
    }
    
    // Don't cache JSON files (except manifest)
    if (url.pathname.endsWith('.json') && !url.pathname.endsWith('manifest.json')) {
        return false;
    }
    
    // Cache CSS, JS, and image files
    if (url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.js') || 
        url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        return true;
    }
    
    return false;
}

// ===== Message Event for Cache Management =====
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_ASSETS') {
        event.waitUntil(
            caches.open(ASSETS_CACHE_NAME)
                .then((cache) => {
                    return cache.addAll(ASSET_FILES);
                })
        );
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((cacheName) => {
                            return caches.delete(cacheName);
                        })
                    );
                })
        );
    }
});

// ===== Push Notification Event =====
self.addEventListener('push', (event) => {
    const data = event.data?.json();
    
    if (data && data.title && data.body) {
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/icon-72x72.png',
                data: data.data || {}
            })
        );
    }
});

// ===== Notification Click Event =====
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    } else {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// ===== Background Sync Event =====
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-exercises') {
        event.waitUntil(
            syncExercises()
        );
    }
});

// ===== Sync Exercises (for future cloud sync) =====
async function syncExercises() {
    // This is a placeholder for future cloud synchronization
    console.log('Syncing exercises...');
    
    // In a future version, this would:
    // 1. Get all local exercises from IndexedDB
    // 2. Compare with server
    // 3. Upload new/changed exercises
    // 4. Download remote changes
    // 5. Resolve conflicts
}

// ===== Periodic Sync (if supported) =====
if ('periodicSync' in self.registration) {
    self.registration.periodicSync.register('sync-exercises', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
    });
}

// ===== Handle Offline/Online Events =====
self.addEventListener('online', () => {
    console.log('Device is online');
    // Trigger sync when coming back online
    if ('sync' in self.registration) {
        self.registration.sync.register('sync-exercises');
    }
});

self.addEventListener('offline', () => {
    console.log('Device is offline');
});

// ===== Error Handling =====
self.addEventListener('error', (error) => {
    console.error('Service worker error:', error);
});

console.log('SkillTimer Service Worker loaded');
