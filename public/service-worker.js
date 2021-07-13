const FILES = [
    '/',
    '/index.html',
    '/db.js',
    'manifest.webmanifest',
    '/styles.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

const CACHE = 'static-cache-v2';
const DATA_CACHE = 'data-cache-v1';

self.addEventListener('install', (e) =>
{
    e.waitUntil(
        caches.open(CACHE)
        .then(cache =>
            {
                return cache.addAll(FILES);
            })
    );

    self.skipWaiting();
});

self.addEventListener('activate', (e) =>
{
    e.waitUntil(
        caches.keys()
        .then(keys =>
            {
                return Promise.all(
                    keys.map(k =>
                        {
                            if(k !== CACHE && k !== DATA_CACHE)
                            {
                                return caches.delete(k);
                            }
                        })
                );  
            })
    );

    self.clients.claim();
});

self.addEventListener('fetch', (e) =>
{
    if(e.request.url.includes('/api/'))
    {
        e.respondWith(
            caches.open(DATA_CACHE)
            .then(cache =>
                {
                    return fetch(e.request)
                            .then(response =>
                                {
                                    if(response.status == 200)
                                    {
                                        cache.put(e.request.url, response.clone());
                                    }

                                    return response;
                                })
                            .catch(err =>
                                {
                                    return cache.match(e.request);
                                });
                })
            .catch(err =>
                {
                    console.log(err);
                })
        );
    }

    e.respondWith(
        fetch(e.request).catch(() =>
        {
            return caches.match(e.request)
            .then(response =>
                {
                    if(response)
                    {
                        return response;
                    }
                    else if(e.request.headers.get('accept').includes('text/html'))
                    {
                        return caches.match('/');
                    }
                });
        })
    );
});