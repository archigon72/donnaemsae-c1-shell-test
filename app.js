(function () {
  const { TokenStore, fetchPrivateJson } = window.C1Data;
  const $ = (id) => document.getElementById(id);
  const MSG = {
    'no-token': '토큰이 없어 비공개 데이터를 읽을 수 없어요 (404, 정상 차단).',
    'no-access': '토큰은 있지만 이 저장소 권한이 없어요 (404). 저장소 선택·권한을 확인해 주세요.',
    'bad-token': '토큰이 만료됐거나 잘못됐어요 (401). 새 토큰을 넣어 주세요.',
    'forbidden-or-rate': '접근 거부 또는 요청 한도 초과 (403).',
    'network': '네트워크 오류예요. 연결을 확인해 주세요.',
    'parse': '데이터 형식 오류예요.',
    'http': '알 수 없는 응답이에요.'
  };
  function showTokenState() {
    $('token-state').textContent = TokenStore.has() ? '토큰 저장됨 (값은 표시하지 않음)' : '저장된 토큰 없음';
  }
  $('save').onclick = () => {
    const v = $('token').value.trim();
    if (!v) return;
    TokenStore.set(v);
    $('token').value = '';
    showTokenState();
  };
  $('clear').onclick = () => { TokenStore.clear(); showTokenState(); };
  $('load').onclick = async () => {
    $('status').textContent = '불러오는 중…';
    const tb = document.querySelector('#prices tbody');
    tb.textContent = '';
    $('prices').hidden = true;
    const r = await fetchPrivateJson(window.C1_CONFIG.pricesPath);
    if (!r.ok) { $('status').textContent = (MSG[r.reason] || MSG.http) + ' [' + r.status + ']'; return; }
    for (const it of (r.data.items || [])) {
      const tr = document.createElement('tr');
      for (const v of [it.code, it.name, it.price, it.trade_date]) {
        const td = document.createElement('td'); td.textContent = v == null ? '' : String(v); tr.appendChild(td);
      }
      tb.appendChild(tr);
    }
    $('prices').hidden = false;
    $('status').textContent = '읽기 성공 (' + (r.data.items || []).length + '건, ' + (r.data._notice ? '가상 데이터' : '') + ')';
  };
  showTokenState();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
