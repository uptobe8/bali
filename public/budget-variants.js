(() => {
  if (typeof window === 'undefined' || window.__NUSA_BUDGET_VARIANTS__) return;
  window.__NUSA_BUDGET_VARIANTS__ = true;

  const base = document.querySelector('meta[name="nusa-base-path"]')?.content || '';
  const originalFetch = window.fetch.bind(window);

  const LEVELS = [
    {
      id: 'economica',
      label: 'Económica',
      tag: 'Ahorro',
      description: 'Mismos días, zonas e intereses seleccionados, optimizando warungs, alojamientos sencillos y transportes contenidos.',
      hotel: 'Hotel local / guesthouse bien ubicado',
      hotelPrice: '25–55 €/noche',
      lunch: 'Warung local o mercado',
      lunchPrice: '3–8 €/persona',
      dinner: 'Warung recomendado / comida local',
      dinnerPrice: '6–14 €/persona',
      cost: '35–65 €/persona/día',
      totalPerDayMin: 35,
      totalPerDayMax: 65,
    },
    {
      id: 'media',
      label: 'Media',
      tag: 'Equilibrio',
      description: 'Respeta el viaje elegido con hoteles boutique razonables, buenos restaurantes y traslados cómodos sin disparar el presupuesto.',
      hotel: 'Hotel boutique / villa sencilla',
      hotelPrice: '65–120 €/noche',
      lunch: 'Restaurante local seleccionado',
      lunchPrice: '8–18 €/persona',
      dinner: 'Restaurante medio con buena ubicación',
      dinnerPrice: '15–32 €/persona',
      cost: '75–130 €/persona/día',
      totalPerDayMin: 75,
      totalPerDayMax: 130,
    },
    {
      id: 'premium',
      label: 'Premium',
      tag: 'Confort',
      description: 'Mismos imprescindibles, ritmo y zonas, elevando alojamientos, experiencias privadas y restaurantes especiales.',
      hotel: 'Resort boutique / villa privada con piscina',
      hotelPrice: '150–320 €/noche',
      lunch: 'Restaurante cuidado / beach club seleccionado',
      lunchPrice: '18–38 €/persona',
      dinner: 'Restaurante especial / autor / sunset dinner',
      dinnerPrice: '35–85 €/persona',
      cost: '150–290 €/persona/día',
      totalPerDayMin: 150,
      totalPerDayMax: 290,
    },
  ];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function dayCount(days) {
    return Array.isArray(days) && days.length ? days.length : 1;
  }

  function estimate(level, days) {
    const n = dayCount(days);
    return `${level.totalPerDayMin * n}–${level.totalPerDayMax * n} €/persona aprox.`;
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
      return {
        id: level.id,
        label: level.label,
        tag: level.tag,
        description: level.description,
        totalEstimate: estimate(level, payload.days),
        trip,
        days: payload.days.map((day, index) => patchDay(day, level, index)),
      };
    });

    return { ...payload, variants };
  }

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input && input.url ? input.url : '';
    let url;
    try { url = new URL(raw, location.origin); } catch { return originalFetch(input, init); }
    const path = url.pathname.replace(base, '');

    const res = await originalFetch(input, init);

    if (path === '/api/itinerary' && (!init.method || String(init.method).toUpperCase() === 'GET')) {
      try {
        const data = await res.clone().json();
        return new Response(JSON.stringify(addVariants(data)), {
          status: res.status,
          statusText: res.statusText,
          headers: { 'content-type': 'application/json' },
        });
      } catch {
        return res;
      }
    }

    return res;
  };
})();
