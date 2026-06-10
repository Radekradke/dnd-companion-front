// v32 — network-first para HTML, nunca cacheia index.html
const CACHE = 'dnd-v32-v1';
const STATIC = ['./manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Chamadas de API externa: nunca intercepta
  if (url.hostname !== self.location.hostname) return;

  // HTML (index.html, /): sempre busca na rede primeiro
  if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname === '') {
    e.respondWith(
      fetch(e.request)
        .then(r => { caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Outros assets estáticos: cache first
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request))
  );
});
