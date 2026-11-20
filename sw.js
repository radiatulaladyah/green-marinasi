/* Service worker sederhana. Hanya terdaftar di localhost atau HTTPS (aturan browser). */
const C = 'gm-v1';
const FILES = ['./', 'index.html', 'css/style.css', 'js/storage.js', 'js/salary.js', 'js/sales.js', 'js/employees.js', 'js/charts.js', 'js/reports.js', 'js/app.js', 'js/vendor/chart.umd.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
