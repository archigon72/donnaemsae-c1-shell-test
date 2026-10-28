/* GitHub Contents API 읽기 도우미 (c-1).
 * - 토큰은 localStorage(이 기기)에만 저장, 콘솔/화면에 출력하지 않음
 * - 요청은 api.github.com 으로만 보냄 (raw.githubusercontent.com 은 인증 preflight 403)
 * - 응답은 캐시하지 않음 (cache:'no-store'), 서비스워커도 이 요청을 건드리지 않음
 */
(function () {
  const KEY = 'dnmc1.ghToken';
  const TokenStore = {
    get() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } },
    set(v) { localStorage.setItem(KEY, String(v || '').trim()); },
    clear() { localStorage.removeItem(KEY); },
    has() { return !!this.get(); }
  };

  async function fetchPrivateJson(path) {
    const c = window.C1_CONFIG;
    const url = 'https://api.github.com/repos/' + encodeURIComponent(c.owner) + '/' +
      encodeURIComponent(c.repo) + '/contents/' +
      path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(c.ref);
    const headers = {
      'Accept': 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    const t = TokenStore.get();
    if (t) headers['Authorization'] = 'Bearer ' + t;
    let res;
    try {
      res = await fetch(url, { headers, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
    } catch (e) {
      return { ok: false, status: 0, reason: 'network' };
    }
    if (res.ok) {
      try { return { ok: true, status: res.status, data: await res.json() }; }
      catch (e) { return { ok: false, status: res.status, reason: 'parse' }; }
    }
    // 404 = 토큰 없음/권한 없음(비공개 저장소는 존재 자체를 숨김), 401 = 토큰 만료·오류, 403 = 한도·권한
    const reason = res.status === 404 ? (t ? 'no-access' : 'no-token')
      : res.status === 401 ? 'bad-token'
      : res.status === 403 ? 'forbidden-or-rate' : 'http';
    return { ok: false, status: res.status, reason };
  }

  window.C1Data = { TokenStore, fetchPrivateJson };
})();
