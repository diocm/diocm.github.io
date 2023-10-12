const staticCacheName = 'farkle-cache';

const assets = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/android-chrome-192x192.png',
    //'/android-chrome-256-256.png', //
    //'/apple-touch-icon.png', //
    '/browserconfig.xml', //
    '/favicon-16x16.png', //
    '/favicon-32x32.png', //
    //'/favicon.ico',
    //'/image/mstile-150x150.png',
    //'/image/safari-pinned-tab.svg',
];

self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(staticCacheName).then(cache => {
            console.log('caching assets');
            cache.addAll(assets);
        })
    );
});

self.addEventListener('activate', evt => {
    // evt.waitUntil(
    //     caches.keys().then(keys =>{
    //         return Promise.all(keys
    //             .filter(key => key !== staticCacheName)
    //             .map(key => caches.delete(key))
    //         )
    //     })
    // );
});

self.addEventListener('fetch', evt => {
    evt.respondWith(
        caches.match(evt.request).then(cacheRes => {
            return cacheRes || fetch(evt.request);
        })
    )
});
