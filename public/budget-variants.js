(() => {
  if (typeof window === 'undefined' || window.__NUSA_BUDGET_VARIANTS__) return;
  window.__NUSA_BUDGET_VARIANTS__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const originalFetch = window.fetch.bind(window);
  let dbCache = null;
  const imgExt = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i;

  const LEVELS = [
    { id: 'economica', label: 'Económica', tag: 'Ahorro', description: 'Mismos días, zonas e intereses seleccionados, optimizando warungs, alojamientos sencillos y transportes contenidos.', hotel: 'Hotel local / guesthouse bien ubicado', hotelPrice: '25–55 €/noche', lunch: 'Warung local o mercado', lunchPrice: '3–8 €/persona', dinner: 'Warung recomendado / comida local', dinnerPrice: '6–14 €/persona', cost: '35–65 €/persona/día', totalPerDayMin: 35, totalPerDayMax: 65 },
    { id: 'media', label: 'Media', tag: 'Equilibrio', description: 'Respeta el viaje elegido con hoteles boutique razonables, buenos restaurantes y traslados cómodos sin disparar el presupuesto.', hotel: 'Hotel boutique / villa sencilla', hotelPrice: '65–120 €/noche', lunch: 'Restaurante local seleccionado', lunchPrice: '8–18 €/persona', dinner: 'Restaurante medio con buena ubicación', dinnerPrice: '15–32 €/persona', cost: '75–130 €/persona/día', totalPerDayMin: 75, totalPerDayMax: 130 },
    { id: 'premium', label: 'Premium', tag: 'Confort', description: 'Mismos imprescindibles, ritmo y zonas, elevando alojamientos, experiencias privadas y restaurantes especiales.', hotel: 'Resort boutique / villa privada con piscina', hotelPrice: '150–320 €/noche', lunch: 'Restaurante cuidado / beach club seleccionado', lunchPrice: '18–38 €/persona', dinner: 'Restaurante especial / autor / sunset dinner', dinnerPrice: '35–85 €/persona', cost: '150–290 €/persona/día', totalPerDayMin: 150, totalPerDayMax: 290 },
  ];

  const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));
  const arr = (v) => Array.isArray(v) ? v : [];
  const pick = (...v) => v.find((x) => typeof x === 'string' && x.trim()) || null;
  const fix = (v) => {
    if (!v || typeof v !== 'string') return v;
    if (v.startsWith('http') || v.startsWith('data:') || v.startsWith('blob:') || v.startsWith('/bali/')) return v;
    if (v.startsWith('/') && imgExt.test(v)) return base + v;
    if (!v.startsWith('/') && imgExt.test(v)) return `${base}/${v}`;
    return v;
  };
  const estimate = (level, days) => `${level.totalPerDayMin * Math.max(days.length, 1)}–${level.totalPerDayMax * Math.max(days.length, 1)} €/persona aprox.`;

  async function loadDb() {
    if (dbCache) return dbCache;
    dbCache = await (await originalFetch(`${base}/db-export.json`, { cache: 'no-store' })).json();
    return dbCache;
  }

  function patchDay(day, level, index) {
    const d = clone(day);
    d.id = `${day.id || 'day'}-${level.id}`;
    d.cost = level.cost;
    d.hotelName = day.hotelName || level.hotel;
    d.hotelPrice = level.hotelPrice;
    d.mealLunchName = day.mealLunchName || level.lunch;
    d.mealLunchPrice = level.lunchPrice;
    d.mealDinnerName = day.mealDinnerName || level.dinner;
    d.mealDinnerPrice = level.dinnerPrice;
    d.advice = `${day.advice || ''} Opción ${level.label.toLowerCase()}: ${level.description}`.trim();
    d.title = day.title || `Día ${index + 1}`;
    return d;
  }

  function addVariants(payload) {
    if (!payload || !payload.trip || !Array.isArray(payload.days) || payload.days.length === 0) return payload;
    if (Array.isArray(payload.variants) && payload.variants.length >= 3) return payload;
    const variants = LEVELS.map((level) => {
      const trip = clone(payload.trip);
      trip.id = `${payload.trip.id || 'trip'}-${level.id}`;
      trip.title = `${payload.trip.title || payload.trip.destination || 'Viaje'} · ${level.label}`;
      trip.budget = `${level.label} · base seleccionada: ${payload.trip.budget || 'sin especificar'}`;
      return { id: level.id, label: level.label, tag: level.tag, description: level.description, totalEstimate: estimate(level, payload.days), trip, days: payload.days.map((day, index) => patchDay(day, level, index)) };
    });
    return { ...payload, variants };
  }

  function realGuide(data) {
    const guide = arr(data.guide || data.entries).filter((g) => g.category === 'transport' || g.category === 'tip').map((g, i) => ({ id: g.id || `guide-${i}`, category: g.category || 'tip', zone: g.zone || 'General', title: g.title, text: g.text || 'Información práctica para el viaje.', price: g.price || null, time: g.time || null, link: g.link || null, wazeQuery: g.wazeQuery || g.title || null, image: fix(g.image || g.imageUrl || null), order: i + 1 }));
    const restaurants = arr(data.restaurants || data.gastronomia).slice(0, 80).map((r, i) => ({ id: `restaurant-${r.id || i}`, category: 'restaurant', zone: pick(r.zone, r.subzone, r.region, 'Indonesia'), title: pick(r.name, r.title, 'Restaurante'), text: [r.description, r.signatureDish ? `Plato clave: ${r.signatureDish}.` : '', r.tip ? `Consejo: ${r.tip}` : '', r.cuisine ? `Cocina: ${r.cuisine}.` : ''].filter(Boolean).join(' '), price: pick(r.priceRange, r.price, r.priceLevel ? '€'.repeat(Math.min(Number(r.priceLevel), 4)) : null), time: pick(r.type, r.mejorHora, null), link: pick(r.webUrl, r.link, null), wazeQuery: pick(r.address, r.name, r.title, null), image: fix(pick(r.imageUrl, r.foto1, r.image, null)), order: i + 1 }));
    const beaches = arr(data.playas).slice(0, 80).map((p, i) => ({ id: `beach-${p.id || i}`, category: 'beach', zone: pick(p.zone, p.subzone, p.region, 'Indonesia'), title: pick(p.name, p.title, 'Playa'), text: [p.descripcion, p.caracteristicas, p.banio ? `Baño: ${p.banio}.` : '', p.seguridad ? `Seguridad: ${p.seguridad}.` : '', p.consejos ? `Consejo: ${p.consejos}` : ''].filter(Boolean).join(' '), price: pick(p.acceso, p.price, 'Acceso no indicado'), time: pick(p.mejorHora, null), link: pick(p.googleMapsUrl, null), wazeQuery: pick(p.address, p.name, null), image: fix(pick(p.foto1, p.foto2, p.foto3, null)), order: i + 1 }));
    const activities = arr(data.activities || data.actividades).slice(0, 80).map((a, i) => ({ id: `activity-${a.id || i}`, category: 'activity', zone: pick(a.zone, a.subzone, a.region, a.lugarBase, 'Indonesia'), title: pick(a.name, a.title, 'Actividad'), text: [a.description, a.logistica ? `Logística: ${a.logistica}.` : '', a.consejos ? `Consejo: ${a.consejos}` : '', a.difficulty ? `Dificultad: ${a.difficulty}.` : ''].filter(Boolean).join(' '), price: pick(a.priceRange, a.precioTipo, a.price, null), time: pick(a.duration, a.mejorHora, null), link: pick(a.webUrl, a.sourceUrl, null), wazeQuery: pick(a.address, a.name, null), image: fix(pick(a.imageUrl1, a.imageUrl2, a.imageUrl3, a.foto1, null)), order: i + 1 }));
    return { entries: [...guide, ...restaurants, ...beaches, ...activities].filter((e) => e.title) };
  }

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input && input.url ? input.url : '';
    let url;
    try { url = new URL(raw, location.origin); } catch { return originalFetch(input, init); }
    const path = url.pathname.replace(base, '');

    if (path === '/api/guide' && (!init.method || String(init.method).toUpperCase() === 'GET')) {
      try { return new Response(JSON.stringify(realGuide(await loadDb())), { status: 200, headers: { 'content-type': 'application/json' } }); }
      catch { return originalFetch(input, init); }
    }

    const res = await originalFetch(input, init);
    if (path === '/api/itinerary' && (!init.method || String(init.method).toUpperCase() === 'GET')) {
      try { const data = await res.clone().json(); return new Response(JSON.stringify(addVariants(data)), { status: res.status, statusText: res.statusText, headers: { 'content-type': 'application/json' } }); }
      catch { return res; }
    }
    return res;
  };
})();
