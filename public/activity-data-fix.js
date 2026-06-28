(() => {
  if (typeof window === 'undefined' || window.__NUSA_ACTIVITY_DATA_FIX__) return;
  window.__NUSA_ACTIVITY_DATA_FIX__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const originalFetch = window.fetch.bind(window);
  const imgExt = /\.(png|jpe?g|webp|gif)(\?.*)?$/i;

  const slugify = (value) => String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  const asset = (value) => {
    if (!value || typeof value !== 'string') return value;
    if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('/bali/')) return value;
    if (value.startsWith('/') && imgExt.test(value)) return base + value;
    if (!value.startsWith('/') && imgExt.test(value)) return `${base}/${value}`;
    return value;
  };

  const activityPath = (item, n = 1) => {
    const slug = item.slug || slugify(item.name || item.title || 'actividad');
    const zone = slugify(item.zone || item.zona || item.region || 'indonesia');
    const subzone = slugify(item.subzone || item.subzona || item.lugarBase || item.place || zone);
    const num = String(n).padStart(2, '0');
    return asset(`/actividades/${zone}/${subzone}/${slug}/${slug}-${num}.jpg`);
  };

  const fixActivity = (item, index = 0) => {
    const clean = { ...item };
    clean.order = Number(clean.order || clean.id || index + 1);
    clean.slug = clean.slug || slugify(clean.name || clean.title || `actividad-${clean.order}`);
    clean.name = clean.name || clean.title || clean.activity_name || 'Actividad';
    clean.title = clean.title || clean.name;
    clean.zone = clean.zone || clean.zona || clean.region || 'Indonesia';
    clean.subzone = clean.subzone || clean.subzona || clean.lugarBase || clean.place || clean.zone;
    clean.category = clean.category || clean.categoria || clean.categoria_aventura || 'Actividad';
    clean.description = clean.description || clean.experiencia_app || clean.text || clean.logistica || '';
    clean.imageUrl1 = asset(clean.imageUrl1 || clean.foto1) || activityPath(clean, 1);
    clean.imageUrl2 = asset(clean.imageUrl2 || clean.foto2) || activityPath(clean, 2);
    clean.imageUrl3 = asset(clean.imageUrl3 || clean.foto3) || activityPath(clean, 3);
    clean.imageUrl4 = asset(clean.imageUrl4 || clean.foto4) || activityPath(clean, 4);
    return clean;
  };

  const sortActivities = (items) => (Array.isArray(items) ? items : [])
    .map(fixActivity)
    .sort((a, b) => Number(a.order || 9999) - Number(b.order || 9999) || String(a.name).localeCompare(String(b.name), 'es'));

  const patchGuideEntry = (entry, index) => {
    if (!entry || entry.category !== 'activity') return entry;
    const fixed = fixActivity(entry, index);
    return {
      ...entry,
      title: entry.title || fixed.name,
      zone: entry.zone || fixed.zone,
      text: entry.text || fixed.description,
      price: entry.price || fixed.priceRange || fixed.precioTipo || null,
      time: entry.time || fixed.duration || fixed.mejorHora || null,
      image: fixed.imageUrl1,
      order: Number(entry.order || fixed.order || index + 1),
    };
  };

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input?.url || '';
    let url;
    try { url = new URL(raw, location.origin); } catch { return originalFetch(input, init); }
    const path = url.pathname.replace(base, '');
    const res = await originalFetch(input, init);

    if (path === '/api/actividades') {
      try {
        const data = await res.clone().json();
        const activities = sortActivities(data.activities || data.actividades || []);
        return new Response(JSON.stringify({ ...data, activities }), { status: res.status, statusText: res.statusText, headers: { 'content-type': 'application/json' } });
      } catch { return res; }
    }

    if (path === '/api/guide') {
      try {
        const data = await res.clone().json();
        const entries = (data.entries || []).map(patchGuideEntry).sort((a, b) => {
          const order = { transport: 1, tip: 2, beach: 3, restaurant: 4, activity: 5 };
          return (order[a.category] || 9) - (order[b.category] || 9) || Number(a.order || 9999) - Number(b.order || 9999);
        });
        return new Response(JSON.stringify({ ...data, entries }), { status: res.status, statusText: res.statusText, headers: { 'content-type': 'application/json' } });
      } catch { return res; }
    }

    return res;
  };
})();
