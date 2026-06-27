(() => {
  if (typeof window === 'undefined' || window.__NUSA_REAL_GUIDE__) return;
  window.__NUSA_REAL_GUIDE__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const originalFetch = window.fetch.bind(window);
  let cache = null;

  function asset(v) {
    if (!v || typeof v !== 'string') return null;
    if (v.startsWith('http') || v.startsWith('data:') || v.startsWith('blob:')) return v;
    if (v.startsWith('/bali/')) return v;
    if (v.startsWith('/')) return base + v;
    return base + '/' + v;
  }

  function txt(...values) {
    return values.filter(Boolean).map((v) => String(v).trim()).filter(Boolean).join(' · ');
  }

  function mapLink(item) {
    return item.webUrl || item.sourceUrl || item.googleMapsUrl || item.link || item.wazeUrl || null;
  }

  function waze(item, title) {
    return item.wazeQuery || item.address || txt(title, item.zone, item.region, 'Indonesia');
  }

  function entry(category, item, i, opts = {}) {
    const title = opts.title || item.name || item.title || 'Entrada';
    const zone = item.zone || item.subzone || item.region || item.lugarBase || 'Indonesia';
    return {
      id: `${category}-${item.id || i}`,
      category,
      zone,
      title,
      text: opts.text || item.description || item.descripcion || item.text || item.consejos || item.logistica || item.queVer || '',
      price: opts.price || item.price || item.priceRange || item.precio1Dia || item.precioTipo || null,
      time: opts.time || item.time || item.duration || item.duracion || item.mejorHora || null,
      link: mapLink(item),
      wazeQuery: waze(item, title),
      image: asset(opts.image || item.imageUrl || item.imageUrl1 || item.foto1 || item.image || null),
      order: Number(item.order || i + 1),
    };
  }

  async function load() {
    if (cache) return cache;
    const res = await originalFetch(`${base}/db-export.json`, { cache: 'no-store' });
    cache = await res.json();
    return cache;
  }

  function buildGuide(db) {
    const out = [];
    const old = Array.isArray(db.guide) ? db.guide : [];
    old.filter((x) => x.category === 'transport' || x.category === 'tip').forEach((x, i) => out.push(entry(x.category, x, i, {
      text: x.text || (x.category === 'transport' ? 'Transporte útil para organizar rutas y traslados del viaje.' : 'Consejo práctico para preparar el viaje sin sorpresas.'),
      image: x.image || null,
    })));

    const restaurants = db.restaurants || db.gastronomia || [];
    restaurants.slice(0, 36).forEach((x, i) => out.push(entry('restaurant', x, i, {
      title: x.name,
      text: txt(x.description, x.signatureDish ? `Plato recomendado: ${x.signatureDish}` : '', x.tip),
      price: x.priceLevel ? `Nivel ${x.priceLevel}/5` : x.price || null,
      time: x.cuisine || x.type || null,
      image: x.imageUrl,
    })));

    const playas = db.playas || [];
    playas.slice(0, 36).forEach((x, i) => out.push(entry('beach', x, i, {
      title: x.name,
      text: txt(x.descripcion, x.banio ? `Baño: ${x.banio}` : '', x.consejos),
      price: x.acceso || 'Acceso variable',
      time: x.mejorHora || null,
      image: x.foto1,
    })));

    const acts = db.activities || db.actividades || [];
    acts.slice(0, 36).forEach((x, i) => out.push(entry('activity', x, i, {
      title: x.name,
      text: txt(x.description, x.logistica, x.consejos),
      price: x.priceRange || x.precioTipo || null,
      time: x.duration || x.mejorHora || null,
      image: x.imageUrl1,
    })));

    const fauna = db.fauna || [];
    fauna.slice(0, 12).forEach((x, i) => out.push(entry('activity', x, i + 200, {
      title: x.name,
      text: txt(x.description, x.queVer, x.peligro ? `Riesgo: ${x.peligro}` : ''),
      price: x.dificultad || null,
      time: x.duracion || x.mejorEpoca || null,
      image: x.foto1,
    })));

    const elephants = db.elephants || db.elefantes || [];
    elephants.slice(0, 12).forEach((x, i) => out.push(entry('activity', x, i + 300, {
      title: x.name,
      text: txt(x.description, x.filtroResumen, x.recomendacion),
      price: x.precio1Dia || null,
      time: x.duracion || x.mejorHora || null,
      image: x.foto1,
    })));

    return out.filter((e) => e.title && e.text).map((e, i) => ({ ...e, order: i + 1 }));
  }

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input?.url || '';
    let url;
    try { url = new URL(raw, location.origin); } catch { return originalFetch(input, init); }
    const path = url.pathname.replace(base, '');
    if (path !== '/api/guide') return originalFetch(input, init);
    const db = await load();
    return new Response(JSON.stringify({ entries: buildGuide(db) }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
})();
