/*
 * OKR Ally — minimal service worker.
 *
 * Its only job is to exist and register a `fetch` handler, which is the last
 * PWA-installability criterion Chrome / Edge desktop still require for the
 * native install button (address-bar icon + `beforeinstallprompt`) to appear.
 *
 * It does NOT cache anything or provide offline support — every request goes
 * straight to the network, exactly as it would without a service worker.
 */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // A non-trivial fetch handler for top-level navigations (plain network
  // pass-through). Sub-resource requests fall through to the browser untouched.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request))
  }
})
