/* Generated allowlist contains public build files only. Never cache runtime requests. */
importScripts('precache-manifest.js');
const scope = new URL(self.registration.scope);
const prefix = `mol-pwa-${scope.pathname}-`;
const cacheName = prefix + PWA_BUILD.version;
const assets = new Set(PWA_BUILD.assets.map(path => {
  const url = new URL(path, scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || url.search || url.hash) throw Error('Invalid precache URL');
  return url.href;
}));
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(cacheName);
  try {
    // Sequential requests let a failed fetch settle before the incomplete cache is removed.
    for (const url of assets) {
      const response = await fetch(new Request(url, {cache:'reload', credentials:'omit'}));
      if (!response.ok || response.type === 'opaque' || response.redirected) throw Error('Precache failed: ' + url);
      await cache.put(url, response);
    }
  } catch (error) { await caches.delete(cacheName); throw error; }
  // Deliberately wait for existing tabs to close before activating a new build.
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || url.search) return;
  const relative = url.pathname.slice(scope.pathname.length);
  if (/^(api|auth|ws|uploads|private)(\/|$)/i.test(relative)) return;
  const key = request.mode === 'navigate' ? new URL('index.html', scope).href : url.href;
  if (!assets.has(key)) return;
  event.respondWith((async () => {
    const hit = await (await caches.open(cacheName)).match(key);
    // A broken cache must not silently mix files from another release.
    return hit || new Response('Offline application cache is incomplete. Reconnect and reload.', {status:503});
  })());
});
