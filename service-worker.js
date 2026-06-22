const CACHE='nusa-v7-cache';
const ASSETS=['./','./index.html','./css/styles.css','./js/app.js','./assets/img/indonesia_isometric_map.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
