(() => {
  if (typeof window === 'undefined' || window.__NUSA_REAL_GUIDE__) return;
  window.__NUSA_REAL_GUIDE__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const originalFetch = window.fetch.bind(window);
  const dataUrl = `${base}/db-export.json`;
  let cache = null;

  function asset(src) {
    if (!src || typeof src !== 'string') return null;
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/bali/')) return src;
    return src.startsWith('/') ? base + src : `${base}/${src}`;
  }

  async function load() {
    if (cache) return cache;
    const res = await originalFetch(dataUrl, { cache: 'no-store' });
    cache = await res.json();
    return cache;
  }

  const clean = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  const first = (...values) => values.map(clean).find(Boolean) || null;
  const limit = (arr, n) => Array.isArray(arr) ? arr.slice(0, n) : [];

  function guideBase(data) {
    return limit(data.guide || [], 40).map((e, i) => ({
      id: e.id || `guide-${i}`,
      category: e.category || 'tip',
      zone: first(e.zone, 'Indonesia') || 'Indonesia',
      title: first(e.title, 'Entrada de guía') || 'Entrada de guía',
      text: first(e.text, e.description, e.tip, 'Información práctica para el viaje.') || 'Información práctica para el viaje.',
      price: first(e.price, '—'),
      time: first(e.time, '—'),
      link: first(e.link),
      wazeQuery: first(e.wazeQuery, e.title, e.zone),
      image: asset(first(e.image, e.imageUrl, e.foto1)),
      order: Number(e.order || i + 1),
    }));
  }

  function restaurantEntries(data) {
    const source = data.restaurants || data.gastronomia || [];
    return limit(source, 80).map((r, i) => ({
      id: `real-restaurant-${r.id || i}`,
      category: 'restaurant',
      zone: first(r.zone, r.subzone, r.region, 'Bali') || 'Bali',
      title: first(r.name, r.title, 'Restaurante') || 'Restaurante',
      text: first(
        [r.description, r.signatureDish ? `Plato recomendado: ${r.signatureDish}.` : '', r.tip ? `Consejo: ${r.tip}` : ''].filter(Boolean).join(' '),
        r.cuisine,
        'Restaurante real incluido en la base de datos del viaje.'
      ) || 'Restaurante real incluido en la base de datos del viaje.',
      price: r.priceLevel ? `Nivel precio ${r.priceLevel}/5` : first(r.price, r.priceRange, 'Consultar'),
      time: first(r.type, r.cuisine, 'Comida / cena'),
      link: first(r.webUrl, r.link),
      wazeQuery: first(r.address, `${r.name || r.title} ${r.zone || ''}`),
      image: asset(first(r.imageUrl, r.image, r.foto1)),
      order: 100 + i,
    }));
  }

  function beachEntries(data) {
    const source = data.playas || data.beaches || [];
    return limit(source, 80).map((p, i) => ({
      id: `real-beach-${p.id || i}`,
      category: 'beach',
      zone: first(p.zone, p.subzone, p.region, 'Bali') || 'Bali',
      title: first(p.name, p.title, 'Playa') || 'Playa',
      text: first(
        [p.descripcion, p.banio ? `Baño: ${p.banio}.` : '', p.acceso ? `Acceso: ${p.acceso}.` : '', p.consejos ? `Consejo: ${p.consejos}` : ''].filter(Boolean).join(' '),
        p.caracteristicas,
        'Playa real incluida en la base de datos del viaje.'
      ) || 'Playa real incluida en la base de datos del viaje.',
      price: first(p.prioridad, p.perfilPlaya, 'Acceso variable'),
      time: first(p.mejorHora, 'Mejor con luz diurna'),
      link: first(p.googleMapsUrl, p.webUrl, p.link),
      wazeQuery: first(p.address, p.ubicacion, `${p.name || p.title} ${p.zone || ''}`),
      image: asset(first(p.foto1, p.imageUrl, p.image)),
      order: 200 + i,
    }));
  }

  function activityEntries(data) {
    const baseActivities = data.activities || data.actividades || [];
    const elephants = data.elephants || data.elefantes || [];
    const fauna = data.fauna || [];
    const source = [...baseActivities, ...elephants, ...fauna];
    return limit(source, 100).map((a, i) => ({
      id: `real-activity-${a.id || i}`,
      category: 'activity',
      zone: first(a.zone, a.subzone, a.region, 'Indonesia') || 'Indonesia',
      title: first(a.name, a.title, 'Actividad') || 'Actividad',
      text: first(
        [a.description, a.logistica ? `Logística: ${a.logistica}.` : '', a.consejos ? `Consejo: ${a.consejos}` : '', a.queVer ? `Qué ver: ${a.queVer}` : ''].filter(Boolean).join(' '),
        a.filtroResumen,
        'Actividad real incluida en la base de datos del viaje.'
      ) || 'Actividad real incluida en la base de datos del viaje.',
      price: first(a.priceRange, a.precio1Dia, a.precioFecha, 'Consultar'),
      time: first(a.duration, a.duracion, a.mejorHora, 'Variable'),
      link: first(a.webUrl, a.sourceUrl, a.link),
      wazeQuery: first(a.address, a.lugarBase, `${a.name || a.title} ${a.zone || ''}`),
      image: asset(first(a.imageUrl1, a.foto1, a.imageUrl, a.image)),
      order: 300 + i,
    }));
  }

  function transportAndTips(data) {
    return guideBase(data).filter((e) => e.category === 'transport' || e.category === 'tip');
  }

  function buildGuide(data) {
    const entries = [
      ...transportAndTips(data),
      ...restaurantEntries(data),
      ...beachEntries(data),
      ...activityEntries(data),
    ];
    const seen = new Set();
    return entries.filter((e) => {
      const key = `${e.category}|${e.title}|${e.zone}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => String(a.category).localeCompare(String(b.category)) || a.order - b.order);
  }

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input && input.url ? input.url : '';
    let url;
    try { url = new URL(raw, location.origin); } catch { return originalFetch(input, init); }
    const path = url.pathname.replace(base, '');
    const method = String(init.method || 'GET').toUpperCase();

    if (path === '/api/guide' && method === 'GET') {
      try {
        const data = await load();
        return new Response(JSON.stringify({ entries: buildGuide(data) }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      } catch {
        return originalFetch(input, init);
      }
    }

    return originalFetch(input, init);
  };
})();
