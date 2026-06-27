(() => {
  if (typeof window === 'undefined' || window.__NUSA_REAL_GUIDE_DATA__) return;
  window.__NUSA_REAL_GUIDE_DATA__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const originalFetch = window.fetch.bind(window);
  const dbUrl = `${base}/db-export.json`;
  const IMG_EXT = /\.(png|jpe?g|webp|gif|svg|mp4|webm)(\?.*)?$/i;
  let dbCache = null;

  function asset(value) {
    if (!value || typeof value !== 'string') return null;
    if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value;
    if (value.startsWith('/bali/')) return value;
    if (value.startsWith('/') && IMG_EXT.test(value)) return base + value;
    if (!value.startsWith('/') && IMG_EXT.test(value)) return `${base}/${value}`;
    return value;
  }

  async function db() {
    if (dbCache) return dbCache;
    const res = await originalFetch(dbUrl, { cache: 'no-store' });
    dbCache = await res.json();
    return dbCache;
  }

  function first(...values) {
    return values.find((v) => v !== undefined && v !== null && String(v).trim() !== '') || null;
  }

  function asEntry(category, item, order) {
    if (category === 'restaurant') {
      return {
        id: `real-restaurant-${item.id || order}`,
        category,
        zone: first(item.zone, item.subzone, item.region, 'Indonesia'),
        title: first(item.name, item.title, 'Restaurante'),
        text: first(item.description, item.signatureDish, item.tip, 'Restaurante recomendado incluido en la base real de la app.'),
        price: item.priceLevel ? `Nivel precio ${item.priceLevel}/5` : first(item.price, item.priceRange, 'Consultar'),
        time: first(item.cuisine, item.type, item.signatureDish, null),
        link: first(item.webUrl, item.link, null),
        wazeQuery: first(item.address, item.name, item.title),
        image: asset(first(item.imageUrl, item.image, item.foto1, null)),
        order,
      };
    }

    if (category === 'beach') {
      return {
        id: `real-beach-${item.id || order}`,
        category,
        zone: first(item.zone, item.subzone, item.region, 'Indonesia'),
        title: first(item.name, item.title, 'Playa'),
        text: first(item.descripcion, item.caracteristicas, item.consejos, 'Playa real incluida en la guía.'),
        price: first(item.acceso, item.price, 'Acceso según zona'),
        time: first(item.mejorHora, item.perfilPlaya, null),
        link: first(item.googleMapsUrl, item.webUrl, item.link, null),
        wazeQuery: first(item.address, item.ubicacion, item.name, item.title),
        image: asset(first(item.foto1, item.imageUrl, item.image, null)),
        order,
      };
    }

    if (category === 'activity') {
      return {
        id: `real-activity-${item.id || order}`,
        category,
        zone: first(item.zone, item.subzone, item.region, 'Indonesia'),
        title: first(item.name, item.title, 'Actividad'),
        text: first(item.description, item.queVer, item.consejos, item.logistica, 'Actividad real incluida en la guía.'),
        price: first(item.priceRange, item.precio1Dia, item.price, 'Consultar'),
        time: first(item.duration, item.duracion, item.mejorHora, null),
        link: first(item.webUrl, item.sourceUrl, item.link, null),
        wazeQuery: first(item.address, item.lugarBase, item.name, item.title),
        image: asset(first(item.imageUrl1, item.foto1, item.imageUrl, item.image, null)),
        order,
      };
    }

    return {
      id: `real-${category}-${item.id || order}`,
      category,
      zone: first(item.zone, item.region, 'Indonesia'),
      title: first(item.title, item.name, 'Entrada'),
      text: first(item.text, item.description, item.consejos, 'Entrada de guía.'),
      price: first(item.price, item.priceRange, null),
      time: first(item.time, item.duration, item.duracion, null),
      link: first(item.link, item.webUrl, item.sourceUrl, null),
      wazeQuery: first(item.wazeQuery, item.address, item.title, item.name),
      image: asset(first(item.image, item.imageUrl, item.foto1, null)),
      order,
    };
  }

  function take(arr, n) {
    return (Array.isArray(arr) ? arr : []).slice(0, n);
  }

  function buildGuide(data) {
    const existing = Array.isArray(data.guide) ? data.guide : [];
    const restaurants = take(data.restaurants || data.gastronomia || [], 30).map((x, i) => asEntry('restaurant', x, i + 1));
    const beaches = take(data.playas || [], 30).map((x, i) => asEntry('beach', x, i + 1));
    const activitiesBase = [
      ...take(data.activities || data.actividades || [], 24),
      ...take(data.elephants || data.elefantes || [], 8),
      ...take(data.fauna || [], 8),
    ];
    const activities = activitiesBase.map((x, i) => asEntry('activity', x, i + 1));
    const transport = existing.filter((e) => e.category === 'transport').map((x, i) => asEntry('transport', x, i + 1));
    const tips = existing.filter((e) => e.category === 'tip').map((x, i) => asEntry('tip', x, i + 1));

    return [...transport, ...restaurants, ...beaches, ...activities, ...tips]
      .filter((e) => e.title && e.text)
      .map((e, i) => ({ ...e, order: e.order || i + 1 }));
  }

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input && input.url ? input.url : '';
    let url;
    try { url = new URL(raw, location.origin); } catch { return originalFetch(input, init); }
    const path = url.pathname.replace(base, '');
    const method = String(init.method || 'GET').toUpperCase();

    if (path === '/api/guide' && method === 'GET') {
      try {
        const data = await db();
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
