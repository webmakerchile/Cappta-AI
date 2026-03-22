const CACHE_NAME = 'nexia-v1';
const OFFLINE_URLS = ['/admin', '/dashboard', '/panel'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

function setBadge(count) {
  if (self.registration && typeof self.registration.setAppBadge === 'function') {
    return self.registration.setAppBadge(count).catch(() => {});
  }
  return Promise.resolve();
}

function clearBadge() {
  if (self.registration && typeof self.registration.clearAppBadge === 'function') {
    return self.registration.clearAppBadge().catch(() => {});
  }
  return Promise.resolve();
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const handlePush = async () => {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nuevo mensaje', body: event.data.text() };
    }

    const title = data.title || 'Nuevo mensaje - Cappta AI';
    const options = {
      body: data.body || 'Tienes un nuevo mensaje de soporte',
      icon: '/favicon-fox.png',
      badge: '/favicon-fox.png',
      vibrate: [300, 100, 300, 100, 300],
      tag: 'nexia-' + (data.sessionId || 'general'),
      renotify: true,
      requireInteraction: true,
      silent: false,
      actions: [
        { action: 'open', title: 'Abrir Chat' },
        { action: 'dismiss', title: 'Cerrar' }
      ],
      data: {
        url: data.url || '/admin',
        sessionId: data.sessionId,
        timestamp: Date.now()
      }
    };

    await self.registration.showNotification(title, options);

    const count = typeof data.badgeCount === 'number' ? data.badgeCount : 1;
    if (count > 0) {
      await setBadge(count);
    } else {
      await clearBadge();
    }
  };

  event.waitUntil(handlePush());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/panel';
  const isPanel = urlToOpen.includes('/panel');
  const isDashboard = urlToOpen.includes('/dashboard');
  const targetPath = isPanel ? '/panel' : isDashboard ? '/dashboard' : '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetPath) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', sessionId: event.notification.data?.sessionId });
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    }).then(() => {
      return self.registration.getNotifications().then((notifications) => {
        if (notifications.length === 0) {
          return clearBadge();
        }
        return setBadge(notifications.length);
      });
    }).catch(() => {})
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach(n => n.close());
    }).catch(() => {});
    clearBadge();
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        const requestUrl = new URL(event.request.url);
        if (requestUrl.pathname.startsWith('/panel')) {
          return caches.match('/panel');
        }
        if (requestUrl.pathname.startsWith('/dashboard')) {
          return caches.match('/dashboard');
        }
        return caches.match('/admin');
      })
    );
  }
});
