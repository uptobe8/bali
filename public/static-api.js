(() => {
  if (typeof window === 'undefined' || window.__NUSA_STATIC_API__) return;
  window.__NUSA_STATIC_API__ = true;

  const originalFetch = window.fetch.bind(window);
  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const dataUrl = `${base}/db-export.json`;
  const IMG_EXT = /\.(png|jpe?g|webp|gif|svg|mp4|webm)(\?.*)?$/i;
  const KEYS = { itinerary: 'nusa-static-itinerary', suggestions: 'nusa-static-suggestions', job: 'nusa-static-generate-job' };
  const elephantPhotos = [
    '/elefantes/01_mason_elephant_park.jpg','/elefantes/02_bali_elephant_camp.jpg','/elefantes/03_elephant_safari_lodge.jpg','/elefantes/05_elephant_painting_ubud.jpg','/elefantes/06_taro_conservation.jpg','/elefantes/07_elephant_bathing_river.jpg','/elefantes/08_night_safari_elephants.jpg','/elefantes/09_elephant_art_studio.jpg','/elefantes/10_elephant_wellness_yoga.jpg','/elefantes/11_sumatra_conservation_aceh.jpg','/elefantes/12_taman_safari_elephants.jpg','/elefantes/13_way_kambas_safari.jpg','/elefantes/14_wild_elephants_clearing.jpg','/elefantes/15_elephant_patrol_riau.jpg','/elefantes/16_seblat_conservation.jpg','/elefantes/17_elephant_hospital.jpg','/elefantes/18_flying_camp_riau.jpg','/elefantes/20_surabaya_zoo_elephants.jpg','/elefantes/22_ujung_kulon_safari.jpg','/elefantes/23_borneo_kinabatangan.jpg','/elefantes/24_danum_valley_tracking.jpg'
  ];

  const read = (k, fallback) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function fixedAsset(value) {
    if (typeof value !== 'string' || !value) return value;
    if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('mailto:') || value.startsWith('tel:')) return value;
    if (value.startsWith('/bali/')) return value;
    if (value.startsWith('/_next/')) return base + value;
    if (value.startsWith('/') && IMG_EXT.test(value)) return base + value;
    if (!value.startsWith('/') && IMG_EXT.test(value) && !value.includes('://')) return `${base}/${value}`;
    return value;
  }

  function normalizeDeep(value) {
    if (Array.isArray(value)) return value.map(normalizeDeep);
    if (value && typeof value === 'object') {
      const out = {};
      Object.entries(value).forEach(([k, v]) => { out[k] = normalizeDeep(v); });
      return out;
    }
    return fixedAsset(value);
  }

  function elephantImage(index, offset) {
    const n = (index * 3 + offset) % elephantPhotos.length;
    return fixedAsset(elephantPhotos[n]);
  }

  function patchElephants(list) {
    return (Array.isArray(list) ? list : []).map((item, index) => ({
      ...item,
      foto1: elephantImage(index, 0),
      foto2: elephantImage(index, 1),
      foto3: elephantImage(index, 2),
    }));
  }

  function patchData(data) {
    const clean = normalizeDeep(data || {});
    clean.elephants = patchElephants(clean.elephants || clean.elefantes || []);
    clean.elefantes = clean.elephants;
    return clean;
  }

  let db = null;
  async function loadDb() {
    if (db) return db;
    const response = await originalFetch(dataUrl, { cache: 'no-store' });
    db = patchData(await response.json());
    return db;
  }

  function fixDomAssets() {
    document.querySelectorAll('img,video,source,audio').forEach((el) => {
      ['src', 'poster'].forEach((attr) => {
        const current = el.getAttribute(attr);
        const next = fixedAsset(current);
        if (next && next !== current) el.setAttribute(attr, next);
      });
    });
    document.querySelectorAll('[style]').forEach((el) => {
      const style = el.getAttribute('style') || '';
      const next = style.replace(/url\(["']?(\/[^"')]+)["']?\)/g, (_m, url) => `url(${fixedAsset(url)})`);
      if (next !== style) el.setAttribute('style', next);
    });
  }

  document.addEventListener('DOMContentLoaded', fixDomAssets);
  new MutationObserver(fixDomAssets).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'poster', 'style'] });
  setTimeout(fixDomAssets, 500);
  setTimeout(fixDomAssets, 1500);

  const includes = (value, q) => !q || String(value || '').toLowerCase().includes(String(q).toLowerCase());
  const matches = (item, q) => !q || JSON.stringify(item).toLowerCase().includes(String(q).toLowerCase());
  const fileToDataUrl = (file) => new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  function buildItinerary(preferences = {}) {
    const trip = {
      id: uid('trip'), title: preferences.destination || 'Indonesia · Bali', destination: preferences.destination || 'Indonesia · Bali', dates: preferences.dates || '14-16 días', travellers: preferences.travellers || 'Pareja / familia', budget: preferences.budget || 'Medio', pace: preferences.pace || 'Equilibrado', musts: preferences.musts || 'Bali, Ubud, Uluwatu, Gili Meno, Padang Padang', restrictions: preferences.restrictions || null,
    };
    const zones = ['Ubud', 'Sidemen', 'Uluwatu', 'Padang Padang', 'Sanur', 'Gili Meno', 'Nusa Penida', 'Seminyak'];
    const images = ['/hero-bali.jpg','/hero-bali.jpg','/playas/bali/padang-padang-beach-labuan-sait/foto-1.jpg','/playas/bali/bingin-beach/foto-1.jpg'].map(fixedAsset);
    const days = zones.map((zone, i) => ({
      id: uid(`day-${i + 1}`), tripId: trip.id, order: i, day: `Día ${i + 1}`, zone, title: `${zone}: plan visual y completo`, image: images[i % images.length], morning: `Ruta principal por ${zone} con paradas fotográficas y margen realista de traslado.`, lunch: `Comida local en zona ${zone}, priorizando warungs bien valorados y ubicaciones prácticas.`, afternoon: `Actividad destacada adaptada al ritmo ${preferences.pace || 'equilibrado'}: playa, templo, arrozales o snorkel según zona.`, night: 'Cena y paseo tranquilo para cerrar el día sin saturar el viaje.', transport: 'Coche privado, taxi local o ferry según tramo. Confirmar horario antes de reservar.', cost: preferences.budget === 'Alto' ? '90 – 180 €/persona' : preferences.budget === 'Bajo' ? '25 – 55 €/persona' : '45 – 95 €/persona', time: '09:00 – 21:00', mapQuery: `${zone} Bali Indonesia`, wazeQuery: `${zone} Bali Indonesia`, advice: 'Plan generado en modo estático para GitHub Pages. Revisa horarios reales antes de reservar.', hotelName: null, hotelPrice: null, hotelLink: null, mealLunchName: null, mealLunchPrice: null, mealLunchLink: null, mealDinnerName: null, mealDinnerPrice: null, mealDinnerLink: null, coordsLat: null, coordsLng: null,
    }));
    return { trip, days };
  }

  window.fetch = async (input, init = {}) => {
    const rawUrl = typeof input === 'string' ? input : input && input.url ? input.url : '';
    let url;
    try { url = new URL(rawUrl, location.origin); } catch { return originalFetch(input, init); }
    if (!url.pathname.includes('/api/')) return originalFetch(input, init);

    const data = await loadDb();
    const path = url.pathname.replace(base, '');
    const method = (init.method || 'GET').toUpperCase();

    if (path === '/api/itinerary' && method === 'GET') return json(read(KEYS.itinerary, { trip: data.trip || null, days: data.days || [] }));
    if (path === '/api/itinerary' && method === 'DELETE') { localStorage.removeItem(KEYS.itinerary); return json({ ok: true }); }
    if (path === '/api/guide') return json({ entries: data.guide || data.entries || [] });
    if (path === '/api/suggestions' && method === 'GET') return json({ suggestions: read(KEYS.suggestions, data.suggestions || []) });

    if (path === '/api/suggestions' && method === 'POST') {
      const now = new Date().toISOString(); let fields = {}; let file = null;
      if (init.body instanceof FormData) { for (const [k, v] of init.body.entries()) { if (v instanceof File) file = v; else fields[k] = v; } }
      else { try { fields = JSON.parse(init.body || '{}'); } catch {} }
      const imageUrl = await fileToDataUrl(file);
      const suggestion = { id: uid('suggestion'), tripId: (data.trip && data.trip.id) || 'static-trip', type: imageUrl ? 'photo' : (fields.type || 'link'), title: fields.title || (file && file.name) || 'Sugerencia', note: fields.note || null, url: fields.url || null, author: fields.author || 'Invitado', imageUrl, filePath: file && !imageUrl ? file.name : null, sourceKind: fields.sourceKind || (file ? 'upload' : fields.url ? 'web' : 'manual'), status: 'pending', appliedToDay: null, coordsLat: fields.coordsLat ? Number(fields.coordsLat) : null, coordsLng: fields.coordsLng ? Number(fields.coordsLng) : null, createdAt: now, updatedAt: now };
      const list = [suggestion, ...read(KEYS.suggestions, data.suggestions || [])]; write(KEYS.suggestions, list); return json({ suggestion }, 201);
    }

    if (path === '/api/suggestions/extract' && method === 'POST') { let body = {}; try { body = JSON.parse(init.body || '{}'); } catch {} const host = body.url ? new URL(body.url).hostname : 'Enlace'; return json({ title: host, description: body.url || '', imageUrl: null, sourceKind: 'web' }); }
    if (path.startsWith('/api/suggestions/') && method === 'PATCH') { const id = path.split('/').pop(); let patch = {}; try { patch = JSON.parse(init.body || '{}'); } catch {} const list = read(KEYS.suggestions, data.suggestions || []).map((s) => s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s); write(KEYS.suggestions, list); return json({ suggestion: list.find((s) => s.id === id) || null }); }
    if (path.startsWith('/api/suggestions/') && method === 'DELETE') { const id = path.split('/').pop(); const list = read(KEYS.suggestions, data.suggestions || []).filter((s) => s.id !== id); write(KEYS.suggestions, list); return json({ ok: true }); }
    if (path === '/api/suggestions/apply' && method === 'POST') { let body = {}; try { body = JSON.parse(init.body || '{}'); } catch {} const ids = body.suggestionIds || []; const list = read(KEYS.suggestions, data.suggestions || []).map((s, i) => ids.includes(s.id) ? { ...s, status: 'applied', appliedToDay: i + 1, updatedAt: new Date().toISOString() } : s); write(KEYS.suggestions, list); return json({ success: true, message: 'Ideas aplicadas localmente.', applied: ids.length, daysAdded: 0 }); }

    if (path === '/api/itinerary/generate' && method === 'POST') { let prefs = {}; try { prefs = JSON.parse(init.body || '{}'); } catch {} const plan = buildItinerary(prefs); write(KEYS.itinerary, plan); sessionStorage.setItem(KEYS.job, JSON.stringify({ status: 'done', result: { success: true, message: 'Itinerario generado en GitHub Pages.', daysAdded: plan.days.length } })); return json({ status: 'started' }); }
    if (path === '/api/itinerary/generate' && method === 'GET') return json(read(KEYS.job, { status: 'done', result: { success: true, message: 'Itinerario listo.', daysAdded: 0 } }));

    if (path === '/api/playas') { const arr = data.playas || []; return json({ playas: arr.filter((x) => includes(x.region, url.searchParams.get('region')) && includes(x.subzone || x.subzona, url.searchParams.get('subzona')) && includes(x.perfilPlaya, url.searchParams.get('perfil')) && matches(x, url.searchParams.get('busqueda'))) }); }
    if (path === '/api/gastronomia') { const arr = data.restaurants || data.gastronomia || []; return json({ restaurants: arr.filter((x) => includes(x.zone, url.searchParams.get('zona')) && includes(x.type, url.searchParams.get('tipo')) && matches(x, url.searchParams.get('busqueda'))) }); }
    if (path === '/api/actividades') { const arr = data.activities || data.actividades || []; return json({ activities: arr.filter((x) => includes(x.region, url.searchParams.get('region')) && includes(x.category || x.categoria, url.searchParams.get('categoria')) && includes(x.difficulty || x.dificultad, url.searchParams.get('dificultad')) && matches(x, url.searchParams.get('busqueda'))) }); }
    if (path === '/api/fauna') { const arr = data.fauna || []; return json({ fauna: arr.filter((x) => includes(x.region, url.searchParams.get('region')) && includes(x.species || x.especie, url.searchParams.get('especie')) && matches(x, url.searchParams.get('busqueda'))) }); }
    if (path === '/api/elefantes') { const arr = data.elephants || data.elefantes || []; return json({ elephants: patchElephants(arr).filter((x) => includes(x.region, url.searchParams.get('region')) && includes(x.difficulty || x.dificultad, url.searchParams.get('dificultad')) && matches(x, url.searchParams.get('busqueda'))) }); }

    return originalFetch(input, init);
  };
})();
