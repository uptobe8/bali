(() => {
  if (typeof window === 'undefined' || window.__NUSA_ELEPHANT_FIX__) return;
  window.__NUSA_ELEPHANT_FIX__ = true;
  const oldFetch = window.fetch.bind(window);
  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const imgs = [
    '/elefantes/01_mason_elephant_park.jpg',
    '/elefantes/02_bali_elephant_camp.jpg',
    '/elefantes/03_elephant_safari_lodge.jpg',
    '/elefantes/05_elephant_painting_ubud.jpg',
    '/elefantes/06_taro_conservation.jpg',
    '/elefantes/07_elephant_bathing_river.jpg',
    '/elefantes/08_night_safari_elephants.jpg',
    '/elefantes/09_elephant_art_studio.jpg',
    '/elefantes/10_elephant_wellness_yoga.jpg',
    '/elefantes/11_sumatra_conservation_aceh.jpg'
  ];
  const urlFix = (v) => !v ? v : (v.startsWith('http') || v.startsWith('data:') || v.startsWith('/bali/') ? v : (v.startsWith('/') ? base + v : base + '/' + v));
  const photo = (x, i, n) => urlFix(x['foto' + n] || x['imageUrl' + n] || x.imageUrl || x.image || imgs[(i + n - 1) % imgs.length]);
  window.fetch = async (input, init) => {
    const res = await oldFetch(input, init);
    try {
      const raw = typeof input === 'string' ? input : input?.url || '';
      const u = new URL(raw, location.origin);
      if (!u.pathname.includes('/api/elefantes')) return res;
      const data = await res.clone().json();
      if (!Array.isArray(data.elephants)) return res;
      data.elephants = data.elephants.map((x, i) => ({ ...x, foto1: photo(x, i, 1), foto2: photo(x, i, 2), foto3: photo(x, i, 3) }));
      return new Response(JSON.stringify(data), { status: res.status, headers: { 'content-type': 'application/json' } });
    } catch { return res; }
  };
})();
