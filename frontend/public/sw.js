// CotizaBot PWA — service worker mínimo para instalación
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => {
  // passthrough (requerido para que el navegador ofrezca "Instalar app")
});
