// Complète dist-pwa/ : icônes, manifeste et module hors ligne (service worker).
import { copyFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const out = 'dist-pwa';
for (const f of readdirSync('pwa')) copyFileSync(`pwa/${f}`, `${out}/${f}`);

writeFileSync(`${out}/manifest.webmanifest`, JSON.stringify({
  name: 'Nini',
  short_name: 'Nini',
  description: 'Suivi des dossiers et des tâches, hors ligne.',
  lang: 'fr',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: '#ffffff',
  theme_color: '#ffffff',
  icons: [
    { src: './icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}, null, 2));

const files = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
const version = createHash('sha256').update(readFileSync(`${out}/index.html`)).digest('hex').slice(0, 12);

writeFileSync(`${out}/sw.js`, `// Nini — module hors ligne (version ${version})
// Une fois installée, l'app est servie uniquement depuis la mémoire de l'appareil.
// Toute requête vers un autre site est refusée.
const CACHE = 'nini-${version}';
const FILES = ${JSON.stringify(files)};

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('nini-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    // Refusé, et signalé à l'app pour son journal de sécurité.
    self.clients.matchAll().then(list => list.forEach(c => c.postMessage({ type: 'nini-blocked', method: event.request.method, url: event.request.url })));
    event.respondWith(Response.error());
    return;
  }
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(event.request, { ignoreSearch: true })
        .then(hit => hit || (event.request.mode === 'navigate' ? cache.match('./index.html') : Response.error())),
    ),
  );
});
`);
console.log(`dist-pwa prêt (version ${version}) :`, readdirSync(out).join(', '));
