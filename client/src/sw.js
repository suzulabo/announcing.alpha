importScripts('workbox-v4.3.1/workbox-sw.js');

self.workbox.precaching.precacheAndRoute([]);

self.addEventListener('push', event => {
  const data = event.data.json();
  const title = data.notification.title;
  const icon = data.data?.icon ? `/data/images/${data.data.icon}` : null;
  const options = {
    body: data.notification.body,
    icon,
    data: { href: `/${data.data?.announceID || ''}` },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  clients.openWindow(notification.data.href);
  notification.close();
});
