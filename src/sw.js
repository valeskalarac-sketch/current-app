import { precacheAndRoute } from "workbox-precaching";

// Precarga de archivos estáticos (JS/CSS/íconos), generada automáticamente por vite-plugin-pwa.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Recibe una notificación push enviada desde el servidor (api/send-payment-reminders)
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Current", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Current";
  const options = {
    body: data.body || "Tienes un pago próximo a vencer.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
    tag: data.tag || "current-recordatorio",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Al tocar la notificación, abre (o enfoca) la app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
