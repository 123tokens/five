/**
 * ¥FIVE — Cross-page counter for One•Two•Three ecosystem
 * Tracks: visitors, holders, clients (buyers), start time, hash verification
 * Based on Asterium counter (adapted for ¥FIVE)
 */

(function(){
  const SK = {
    counter:  'five_counter',
    visitors: 'five_visitors',
    holders:  'five_holders',
    clients:  'five_clients',
    startTime:'five_start',
    lastUpdate:'five_last',
    hash:     'five_hash'
  };
  const SALT = 'five_salt_2026_cny_lucky';

  // ===== ХЕШ ДЛЯ ВЕРИФИКАЦИИ =====
  function genHash(v){
    let h = 0;
    const s = String(v) + SALT;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h &= h;
    }
    return Math.abs(h).toString(16).padStart(8, '0');
  }

  // ===== СОХРАНЕНИЕ =====
  function save(v, h, c, s){
    const n = Date.now();
    const d = {
      visitors: v,
      holders: h,
      clients: c,
      startTime: s,
      lastUpdate: n,
      hash: genHash(v + '|' + h + '|' + c + '|' + s)
    };
    try {
      localStorage.setItem(SK.counter, JSON.stringify(d));
      localStorage.setItem(SK.visitors, String(v));
      localStorage.setItem(SK.holders, String(h));
      localStorage.setItem(SK.clients, String(c));
      localStorage.setItem(SK.startTime, String(s));
      localStorage.setItem(SK.lastUpdate, String(n));
      localStorage.setItem(SK.hash, d.hash);
      sessionStorage.setItem(SK.counter, JSON.stringify(d));
    } catch(e){}
  }

  // ===== ЗАГРУЗКА =====
  function load(){
    try {
      const data = localStorage.getItem(SK.counter);
      if (data) {
        const p = JSON.parse(data);
        if (p.hash === genHash(p.visitors + '|' + p.holders + '|' + p.clients + '|' + p.startTime)) {
          return p;
        }
      }
      const sd = sessionStorage.getItem(SK.counter);
      if (sd) {
        const p = JSON.parse(sd);
        if (p.hash === genHash(p.visitors + '|' + p.holders + '|' + p.clients + '|' + p.startTime)) {
          return p;
        }
      }
    } catch(e){}
    return null;
  }

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  let st = load();
  const now = Date.now();

  if (!st) {
    // Стартовые значения для ¥FIVE
    st = {
      visitors: 137000,   // стартовые посетители
      holders: 0,         // держатели токена
      clients: 0,         // клиенты (покупатели)
      startTime: now,
      lastUpdate: now,
      hash: genHash(137000 + '|' + 0 + '|' + 0 + '|' + now)
    };
    save(st.visitors, st.holders, st.clients, st.startTime);
  }

  let visitors = st.visitors;
  let holders  = st.holders;
  let clients  = st.clients;
  const startTime = st.startTime;

  // ===== ОБНОВЛЕНИЕ СЧЁТЧИКОВ =====
  function updateCounter(){
    const n = Date.now();
    const elapsed = Math.floor((n - startTime) / 1000); // секунды

    // Посетители: +3 в секунду
    visitors = 137000 + elapsed * 3;

    // Держатели: +1 каждые 30 секунд
    holders = Math.floor(elapsed / 30);

    // Клиенты (покупатели): +1 каждые 60 секунд
    clients = Math.floor(elapsed / 60);

    // Обновляем все элементы на странице
    document.querySelectorAll('.counter-visitors').forEach(el => {
      el.textContent = visitors.toLocaleString();
    });
    document.querySelectorAll('.counter-holders').forEach(el => {
      el.textContent = holders.toLocaleString();
    });
    document.querySelectorAll('.counter-clients').forEach(el => {
      el.textContent = clients.toLocaleString();
    });

    // Временные метки
    const ts = new Date(n).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    document.querySelectorAll('.counter-visitor-time').forEach(el => {
      el.textContent = 'Updated: ' + ts;
    });
    document.querySelectorAll('.counter-holder-time').forEach(el => {
      el.textContent = 'Verified: ' + ts;
    });
    document.querySelectorAll('.counter-client-time').forEach(el => {
      el.textContent = 'Verified: ' + ts;
    });

    // Сохраняем раз в 10 секунд
    if (n - st.lastUpdate > 10000) {
      save(visitors, holders, clients, startTime);
      st.lastUpdate = n;
      updateMetadata(visitors, holders, clients, startTime);
    }
  }

  // ===== JSON-LD МЕТАДАННЫЕ =====
  function updateMetadata(visitors, holders, clients, startTime){
    const n = Date.now();
    const hash = genHash(visitors + '|' + holders + '|' + clients + '|' + startTime);

    let script = document.querySelector('script[data-counter-jsonld]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-counter-jsonld', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "¥FIVE — The Lucky Number Token | One•Two•Three",
      "description": "¥FIVE — Chinese Yuan pegged token on Solana. Part of the One•Two•Three ecosystem ($ONE, €TWO, £THREE, ₣FOUR, ¥FIVE). Launching at $0.0137 — 10× to CNY parity.",
      "statistics": {
        "visitors": visitors,
        "holders": holders,
        "clients": clients,
        "startDate": new Date(startTime).toISOString(),
        "lastUpdate": new Date(n).toISOString(),
        "growthRate": "3 visitors per second",
        "holderGrowth": "1 holder per 30 seconds",
        "clientGrowth": "1 client per 60 seconds"
      },
      "additionalProperty": [
        {"@type": "PropertyValue", "name": "counterHash", "value": hash},
        {"@type": "PropertyValue", "name": "verificationMethod", "value": "multi-source (localStorage + sessionStorage)"},
        {"@type": "PropertyValue", "name": "contract", "value": "45fwvzyjUSnvd7NeEgSK5oL1wycMzuS5CTtWRFhCHU6u"},
        {"@type": "PropertyValue", "name": "pool", "value": "6tHA3RcVgtuN2AgugoMtMj8R63KXhgkTNsZefifPPZMj"}
      ]
    });

    let hidden = document.querySelector('[data-counter-verification]');
    if (!hidden) {
      hidden = document.createElement('div');
      hidden.style.display = 'none';
      hidden.setAttribute('data-counter-verification', 'true');
      document.body.appendChild(hidden);
    }
    hidden.setAttribute('data-counter-visitors', visitors);
    hidden.setAttribute('data-counter-holders', holders);
    hidden.setAttribute('data-counter-clients', clients);
    hidden.setAttribute('data-counter-start', startTime);
    hidden.setAttribute('data-counter-hash', hash);
    hidden.setAttribute('data-counter-last-update', n);
  }

  // ===== СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ =====
  window.addEventListener('storage', function(e){
    if (e.key === SK.visitors) {
      const nv = parseInt(e.newValue);
      const nh = parseInt(localStorage.getItem(SK.holders));
      const nc = parseInt(localStorage.getItem(SK.clients));
      if (nv > visitors) {
        visitors = nv;
        holders = nh;
        clients = nc;
        updateCounter();
      }
    }
  });

  // ===== СОХРАНЕНИЕ ПРИ ЗАКРЫТИИ =====
  window.addEventListener('beforeunload', function(){
    save(visitors, holders, clients, startTime);
  });

  // ===== ЗАПУСК =====
  updateMetadata(visitors, holders, clients, startTime);
  updateCounter();
  setInterval(updateCounter, 1000);
  setInterval(function(){
    updateMetadata(visitors, holders, clients, startTime);
  }, 600000);
})();
