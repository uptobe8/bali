(() => {
  if (typeof window === 'undefined' || window.__NUSA_GUIDE_REAL_MIN__) return;
  window.__NUSA_GUIDE_REAL_MIN__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const prevFetch = window.fetch.bind(window);
  let dbCache = null;

  const img = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i;
  const fix = (v) => typeof v === 'string' && v && !v.startsWith('http') && !v.startsWith('data:') && img.test(v)
    ? (v.startsWith('/bali/') ? v : v.startsWith('/') ? base + v : `${base}/${v}`)
    : v;
  const arr = (v) => Array.isArray(v) ? v : [];
  const pick = (...v) => v.find((x) => typeof x === 'string' && x.trim()) || null;

  async function db() {
    if (dbCache) return dbCache;
    const res = await prevFetch(`${base}/db-export.json`, { cache: 'no-store' });
    dbCache = await res.json();
    return dbCache;
  }

  function restaurant(r, i) {
    return {
      id: `real-r-${r.id || i}`,
      category: 'restaurant',
      zone: pick(r.zone, r.subzone, r.region, 'Indonesia'),
      title: pick(r.name, r.title, 'Restaurante'),
      text: [r.description, r.signatureDish ? `Plato clave: ${r.signatureDish}.` : '', r.tip ? `Consejo: ${r.tip}` : '', r.cuisine ? `Cocina: ${r.cuisine}.` : ''].filter(Boolean).join(' '),
      price: pick(r.priceRange, r.price, r.priceLevel ? '€'.repeat(Math.max(1, Math.min(4, Number(r.priceLevel)))) : null),
      time: pick(r.type, r.mejorHora, null),
      link: pick(r.webUrl, r.link, null),
      wazeQuery: pick(r.address, r.name, r.title, null),
      image: fix(pick(r.imageUrl, r.foto1, r.image, null)),
      order: i + 1,
    };
  }

  function beach(p, i) {
    return {
      id: `real-p-${p.id || i}`,
      category: 'beach',
      zone: pick(p.zone, p.subzone, p.region, 'Indonesia'),
      title: pick(p.name, p.title, 'Playa'),
      text: [p.descripcion, p.caracteristicas, p.banio ? `Baño: ${p.banio}.` : '', p.seguridad ? `Seguridad: ${p.seguridad}.` : '', p.consejos ? `Consejo: ${p.consejos}` : ''].filter(Boolean).join(' '),
      price: pick(p.acceso, p.price, 'Consultar acceso'),
      time: pick(p.mejorHora, p.time, null),
      link: pick(p.googleMapsUrl, p.link, null),
      wazeQuery: pick(p.address, p.name, null),
      image: fix(pick(p.foto1, p.foto2, p.foto3, null)),
      order: i + 1,
    };
  }

  function activity(a, i, prefix = 'a') {
    return {
      id: `real-${prefix}-${a.id || i}`,
      category: 'activity',
      zone: pick(a.zone, a.subzone, a.region, a.lugarBase, 'Indonesia'),
      title: pick(a.name, a.title, 'Actividad'),
      text: [a.description, a.logistica ? `Logística: ${a.logistica}.` : '', a.consejos ? `Consejo: ${a.consejos}` : '', a.recomendacion ? `Recomendación: ${a.recomendacion}` : '', a.queVer ? `Qué ver: ${a.queVer}.` : ''].filter(Boolean).join(' '),
      price: pick(a.priceRange, a.precio1Dia, a.price, null),
      time: pick(a.duration, a.duracion, a.mejorHora, null),
      link: pick(a.webUrl, a.sourceUrl, a.link, null),
      wazeQuery: pick(a.address, a.name, null),
      image: fix(pick(a.imageUrl1, a.foto1, a.imageUrl2, a.foto2, null)),
      order: i + 1,
    };
  }

  function build(data) {
    const baseGuide = arr(data.guide || data.entries).filter((x) => x.category === 'transport' || x.category === 'tip').map((x, i) => ({
      id: x.id || `real-g-${i}`,
      category: x.category || 'tip',
      zone: pick(x.zone, 'General'),
      title: pick(x.title, 'Consejo'),
      text: pick(x.text, x.description, 'Información práctica para el viaje.'),
      price: pick(x.price, null),
      time: pick(x.time, null),
      link: pick(x.link, null),
      wazeQuery: pick(x.wazeQuery, x.title, null),
      image: fix(pick(x.image, x.imageUrl, null)),
      order: i + 1,
    }));
    return {
      entries: [
        ...baseGuide,
        ...arr(data.restaurants || data.gastronomia).slice(0, 60).map(restaurant),
        ...arr(data.playas).slice(0, 60).map(beach),
        ...arr(data.activities || data.actividades).slice(0, 60).map((x, i) => activity(x, i, 'a')),
        ...arr(data.elephants || data.elefantes).slice(0, 25).map((x, i) => activity(x, i + 100, 'e')),
        ...arr(data.fauna).slice(0, 25).map((x, i) => activity(x, i + 200, 'f')),
      ]
    };
  }

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input?.url || '';
    let url;
    try { url = new URL(raw, location.origin); } catch { return prevFetch(input, init); }
    const path = url.pathname.replace(base, '');
    if (path === '/api/guide' && (!init.method || String(init.method).toUpperCase() === 'GET')) {
      try { return new Response(JSON.stringify(build(await db())), { status: 200, headers: { 'content-type': 'application/json' } }); }
      catch { return prevFetch(input, init); }
    }
    return prevFetch(input, init);
  };
})();
