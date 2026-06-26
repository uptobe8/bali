(() => {
  if (typeof window === 'undefined' || window.__NUSA_STATIC_API__) return;
  window.__NUSA_STATIC_API__ = true;
  const originalFetch = window.fetch.bind(window);
  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const dataUrl = `${base}/db-export.json`;
  const K = { itinerary: 'nusa-static-itinerary', suggestions: 'nusa-static-suggestions', job: 'nusa-static-generate-job' };
  let cache = null;
  const json = (body, init = {}) => new Response(JSON.stringify(body), { status: init.status || 200, headers: { 'content-type': 'application/json' } });
  const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const read = (k, fallback) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const load = async () => {
    if (cache) return cache;
    const r = await originalFetch(dataUrl, { cache: 'no-store' });
    cache = await r.json();
    return cache;
  };
  const text = (v) => String(v == null ? '' : v).toLowerCase();
  const match = (obj, q) => !q || JSON.stringify(obj).toLowerCase().includes(q.toLowerCase());
  const inc = (v, q) => !q || text(v).includes(q.toLowerCase());
  const asUrl = (input) => {
    const raw = typeof input === 'string' ? input : input?.url || '';
    try { return new URL(raw, location.origin); } catch { return null; }
  };
  const fileToDataUrl = (file) => new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
  const generated = (prefs) => {
    const trip = {
      id: uid('trip'),
      title: prefs.destination || 'Indonesia · Bali',
      destination: prefs.destination || 'Indonesia · Bali',
      dates: prefs.dates || '14-16 días',
      travellers: prefs.travellers || 'Pareja / familia',
      budget: prefs.budget || 'Medio',
      pace: prefs.pace || 'Equilibrado',
      musts: prefs.musts || 'Bali, Ubud, Uluwatu, Gili Meno, Padang Padang',
      restrictions: prefs.restrictions || null,
    };
    const zones = ['Ubud', 'Sidemen', 'Uluwatu', 'Padang Padang', 'Sanur', 'Gili Meno', 'Nusa Penida', 'Seminyak'];
    const imgs = [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=88',
      'https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=1600&q=88',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=88',
      'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1600&q=88'
    ];
    const days = zones.map((zone, i) => ({
      id: uid(`day-${i + 1}`), tripId: trip.id, order: i, day: `Día ${i + 1}`, zone,
      title: `${zone}: plan visual y completo`, image: imgs[i % imgs.length],
      morning: `Ruta principal por ${zone} con paradas fotográficas y margen realista de traslado.`,
      lunch: `Comida local en zona ${zone}, priorizando warungs bien valorados y ubicaciones prácticas.`,
      afternoon: `Actividad destacada adaptada al ritmo ${prefs.pace || 'equilibrado'}: playa, templo, arrozales o snorkel según zona.`,
      night: 'Cena y paseo tranquilo para cerrar el día sin saturar el viaje.',
      transport: 'Coche privado, taxi local o ferry según tramo. Confirmar horario antes de reservar.',
      cost: prefs.budget === 'Alto' ? '90 – 180 €/persona' : prefs.budget === 'Bajo' ? '25 – 55 €/persona' : '45 – 95 €/persona',
      time: '09:00 – 21:00', mapQuery: `${zone} Bali Indonesia`, wazeQuery: `${zone} Bali Indonesia`,
      advice: 'Plan generado en modo estático para GitHub Pages. Revisa horarios reales antes de reservar.',
      hotelName: null, hotelPrice: null, hotelLink: null, mealLunchName: null, mealLunchPrice: null, mealLunchLink: null,
      mealDinnerName: null, mealDinnerPrice: null, mealDinnerLink: null, coordsLat: null, coordsLng: null,
    }));
    return { trip, days };
  };
  window.fetch = async (input, init = {}) => {
    const u = asUrl(input);
    if (!u || !u.pathname.includes('/api/')) return originalFetch(input, init);
    const path = u.pathname.replace(base, '');
    const method = (init.method || 'GET').toUpperCase();
    const data = await load();
    if (path === '/api/itinerary' && method === 'GET') return json(read(K.itinerary, { trip: data.trip || null, days: data.days || [] }));
    if (path === '/api/itinerary' && method === 'DELETE') { localStorage.removeItem(K.itinerary); return json({ ok: true }); }
    if (path === '/api/guide') return json({ entries: data.guide || data.entries || [] });
    if (path === '/api/suggestions' && method === 'GET') return json({ suggestions: read(K.suggestions, data.suggestions || []) });
    if (path === '/api/suggestions' && method === 'POST') {
      const now = new Date().toISOString(); let fields = {}; let file = null;
      if (init.body instanceof FormData) { for (const [k, v] of init.body.entries()) { if (v instanceof File) file = v; else fields[k] = v; } }
      else { try { fields = JSON.parse(init.body || '{}'); } catch {} }
      const imageUrl = await fileToDataUrl(file);
      const s = { id: uid('suggestion'), tripId: (data.trip && data.trip.id) || 'static-trip', type: imageUrl ? 'photo' : (fields.type || 'link'), title: fields.title || file?.name || 'Sugerencia', note: fields.note || null, url: fields.url || null, author: fields.author || 'Invitado', imageUrl, filePath: file && !imageUrl ? file.name : null, sourceKind: fields.sourceKind || (file ? 'upload' : fields.url ? 'web' : 'manual'), status: 'pending', appliedToDay: null, coordsLat: fields.coordsLat ? Number(fields.coordsLat) : null, coordsLng: fields.coordsLng ? Number(fields.coordsLng) : null, createdAt: now, updatedAt: now };
      const list = [s, ...read(K.suggestions, data.suggestions || [])]; write(K.suggestions, list); return json({ suggestion: s }, { status: 201 });
    }
    if (path === '/api/suggestions/extract' && method === 'POST') { let body = {}; try { body = JSON.parse(init.body || '{}'); } catch {} const host = body.url ? new URL(body.url).hostname : 'Enlace'; return json({ title: host, description: body.url || '', imageUrl: null, sourceKind: 'web' }); }
    if (path.startsWith('/api/suggestions/') && method === 'PATCH') { const id = path.split('/').pop(); let patch = {}; try { patch = JSON.parse(init.body || '{}'); } catch {} const list = read(K.suggestions, data.suggestions || []).map((s) => s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s); write(K.suggestions, list); return json({ suggestion: list.find((s) => s.id === id) || null }); }
    if (path.startsWith('/api/suggestions/') && method === 'DELETE') { const id = path.split('/').pop(); const list = read(K.suggestions, data.suggestions || []).filter((s) => s.id !== id); write(K.suggestions, list); return json({ ok: true }); }
    if (path === '/api/suggestions/apply' && method === 'POST') { let body = {}; try { body = JSON.parse(init.body || '{}'); } catch {} const ids = body.suggestionIds || []; const list = read(K.suggestions, data.suggestions || []).map((s, i) => ids.includes(s.id) ? { ...s, status: 'applied', appliedToDay: i + 1, updatedAt: new Date().toISOString() } : s); write(K.suggestions, list); return json({ success: true, message: 'Ideas aplicadas localmente.', applied: ids.length, daysAdded: 0 }); }
    if (path === '/api/itinerary/generate' && method === 'POST') { let prefs = {}; try { prefs = JSON.parse(init.body || '{}'); } catch {} const plan = generated(prefs); write(K.itinerary, plan); sessionStorage.setItem(K.job, JSON.stringify({ status: 'done', result: { success: true, message: 'Itinerario generado en GitHub Pages.', daysAdded: plan.days.length } })); return json({ status: 'started' }); }
    if (path === '/api/itinerary/generate' && method === 'GET') return json(read(K.job, { status: 'done', result: { success: true, message: 'Itinerario listo.', daysAdded: 0 } }));
    if (path === '/api/playas') { const arr = data.playas || []; return json({ playas: arr.filter((x) => inc(x.region, u.searchParams.get('region')) && inc(x.subzone || x.subzona, u.searchParams.get('subzona')) && inc(x.perfilPlaya, u.searchParams.get('perfil')) && match(x, u.searchParams.get('busqueda'))) }); }
    if (path === '/api/gastronomia') { const arr = data.restaurants || data.gastronomia || []; return json({ restaurants: arr.filter((x) => inc(x.zone, u.searchParams.get('zona')) && inc(x.type, u.searchParams.get('tipo')) && match(x, u.searchParams.get('busqueda'))) }); }
    if (path === '/api/actividades') { const arr = data.activities || data.actividades || []; return json({ activities: arr.filter((x) => inc(x.region, u.searchParams.get('region')) && inc(x.category || x.categoria, u.searchParams.get('categoria')) && inc(x.difficulty || x.dificultad, u.searchParams.get('dificultad')) && match(x, u.searchParams.get('busqueda'))) }); }
    if (path === '/api/fauna') { const arr = data.fauna || []; return json({ fauna: arr.filter((x) => inc(x.region, u.searchParams.get('region')) && inc(x.species || x.especie, u.searchParams.get('especie')) && match(x, u.searchParams.get('busqueda'))) }); }
    if (path === '/api/elefantes') { const arr = data.elephants || data.elefantes || []; return json({ elephants: arr.filter((x) => inc(x.region, u.searchParams.get('region')) && inc(x.difficulty || x.dificultad, u.searchParams.get('dificultad')) && match(x, u.searchParams.get('busqueda'))) }); }
    return originalFetch(input, init);
  };
})();
