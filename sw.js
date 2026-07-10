// This is a Service Worker — it runs separately from your main page,
// even in the background, and can show notifications with action buttons.

// Required event — fires when the service worker is first installed
self.addEventListener('install', function(event) {
  self.skipWaiting(); // activate this service worker immediately, don't wait
});

// Required event — fires when the service worker takes control
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim()); // take control of the page right away
});

// Fires when the user clicks the notification OR one of its action buttons
self.addEventListener('notificationclick', function(event) {
  const action = event.action; // 'snooze', 'stop', or '' if they clicked the body
  const medId = event.notification.data.medId; // which medication this was for

  event.notification.close(); // close the notification popup

  // Send a message to the actual page, telling it what the user chose
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clientList) {
      clientList.forEach(function(client) {
        client.postMessage({ action: action, medId: medId });
        client.focus(); // bring the tab into focus
      });
    })
  );
});