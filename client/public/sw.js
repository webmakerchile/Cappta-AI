const CACHE_NAME = 'cjm-soporte-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

function setBadge(count) {
  if (self.registration && typeof self.registration.setAppBadge === 'function') {
    return self.registration.setAppBadge(count);
  }
  if (typeof navigator !== 'undefined' && typeof navigator.setAppBadge === 'function') {
    return navigator.setAppBadge(count);
  }
  return Promise.resolve();
}

function clearBadge() {
  if (self.registration && typeof self.registration.clearAppBadge === 'function') {
    return self.registration.clearAppBadge();
  }
  if (typeof navigator !== 'undefined' && typeof navigator.clearAppBadge === 'function') {
    return navigator.clearAppBadge();
  }
  return Promise.resolve();
}

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
      self.registration.showNotification(title, options).then(() => {
        const count = typeof data.badgeCount === 'number' ? data.badgeCount : 1;
        if (count > 0) {
          return setBadge(count);
        }
        return clearBadge();
      }).catch(() => {})
    );
  } catch (e) {
    console.error('Push error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/admin';
  
  event.waitUntil(
    Promise.all([
      self.registration.getNotifications().then((notifications) => {
        if (notifications.length === 0) {
          return clearBadge();
        }
        return setBadge(notifications.length);
      }).catch(() => {}),
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes('/admin') && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
    ])
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach(n => n.close());
    });
    clearBadge().catch(() => {});
  }
});

self.addEventListener('fetch', (event) => {
});
