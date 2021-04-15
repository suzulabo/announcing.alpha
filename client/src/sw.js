importScripts('workbox-v4.3.1/workbox-sw.js');

const apiSite =
  self.location.protocol == 'https:'
    ? self.location.origin
    : `http://${self.location.hostname}:5000`;

self.workbox.precaching.precacheAndRoute([]);

self.addEventListener('push', event => {
  const data = event.data.json();
  console.log(`Push received with data "${JSON.stringify(data, null, 2)}"`);

  const title = data.notification.title;
  const icon = data.data.icon ? `${apiSite}/image/${data.data.icon}` : null;
  const options = {
    body: data.notification.body,
    icon,
    data: { href: `/${data.data.announceID}` },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('notificationclick', event);

  const notification = event.notification;
  clients.openWindow(notification.data.href);
  notification.close();
});
