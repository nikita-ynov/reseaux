/* Service worker : fonctionne hors ligne. Réseau d'abord, cache en secours. */
const CACHE = 'reseaux-v3';
const CORE = ['./', 'index.html', 'css/style.css', 'css/mobile.css','js/lessons.js', 'js/cards.js', 'js/sims.js', 'js/app.js', 'manifest.webmanifest', 'icon.svg', 'icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  e.respondWith(
    fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
