/* c-1 화면 전용 서비스워커.
 * - FILES 에 데이터 파일 없음 (화면 파일만)
 * - addAll 대신 파일별 개별 캐시: 하나가 404 여도 설치 실패하지 않음
 * - 다른 출처(api.github.com 등) 요청과 Authorization 헤더가 있는 요청은 절대 가로채거나 캐시하지 않음
 */
const CACHE = 'dnmc1-shell-v1';
const FILES = ['./', 'index.html', 'style.css', 'config.js', 'data-fetch.js', 'app.js'];
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(FILES.map(async (p) => {
      try {
        const r = await fetch(p, { cache: 'no-cache' });
        if (r.ok) await c.put(p, r);
      } catch (err) { /* 개별 실패 무시 */ }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('dnmc1-shell-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // api.github.com 은 통과
  if (req.headers.has('Authorization')) return;
  e.respondWith((async () => {
    try {
      const r = await fetch(req);
      if (r.ok) { const c = await caches.open(CACHE); await c.put(req, r.clone()); }
      return r;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
