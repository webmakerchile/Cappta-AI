const CACHE_NAME = 'cjm-soporte-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const title = data.title || 'Nuevo mensaje';
    const options = {
      body: data.body || '',
      icon: '/logo-192.webp',
      badge: '/logo-192.webp',
      vibrate: [200, 100, 200],
      tag: 'cjm-soporte-' + (data.sessionId || 'general'),
      renotify: true,
      data: {
        url: data.url || '/admin',
        sessionId: data.sessionId
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    console.error('Push error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/admin';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (event) => {
});
