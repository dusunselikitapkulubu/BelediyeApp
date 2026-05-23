/* eslint-disable no-undef */
// BelediyeApp Service Worker - Push Notification Handler

self.addEventListener('push', function (event) {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'Talebinizde güncelleme var.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/taleplerim', talepId: data.talepId },
        actions: [
            { action: 'view', title: 'Görüntüle', icon: '/icons/action-view.png' },
            { action: 'dismiss', title: 'Kapat', icon: '/icons/action-close.png' },
        ],
        requireInteraction: false,
        tag: data.tag || 'belediye-bildirim',
        renotify: true,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'BelediyeApp', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/taleplerim';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('belediye-v1').then((cache) =>
            cache.addAll(['/', '/talep', '/taleplerim', '/profil', '/offline'])
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== 'belediye-v1')
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open('belediye-v1').then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request).then((r) => r || caches.match('/offline')))
    );
});