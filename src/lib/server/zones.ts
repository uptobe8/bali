// Server-only zone lookup map for itinerary regeneration.
// Used by /api/suggestions/apply to fill `image` and `coordsLat`/`coordsLng`
// on LLM-generated Day rows based on a case-insensitive match on `zone`.

export interface ZoneDefault {
  lat: number
  lng: number
  image: string
}

export const ZONE_DEFAULTS: Record<string, ZoneDefault> = {
  denpasar: { lat: -8.7467, lng: 115.1668, image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=88' },
  llegada: { lat: -8.7467, lng: 115.1668, image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=88' },
  salida: { lat: -8.7467, lng: 115.1668, image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=88' },
  ubud: { lat: -8.5069, lng: 115.2625, image: 'https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=1600&q=88' },
  sidemen: { lat: -8.4667, lng: 115.4333, image: 'https://images.unsplash.com/photo-1559628233-100c798642d4?auto=format&fit=crop&w=1600&q=88' },
  'gili meno': { lat: -8.3517, lng: 116.0584, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=88' },
  uluwatu: { lat: -8.8291, lng: 115.0849, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=88' },
  'padang padang': { lat: -8.8107, lng: 115.1024, image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=88' },
  munduk: { lat: -8.267, lng: 115.066, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=88' },
  'villa final': { lat: -8.267, lng: 115.066, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=88' },
}

export const ZONE_FALLBACK: ZoneDefault = {
  lat: -8.55,
  lng: 115.45,
  image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1600&q=88',
}

export function lookupZone(zone: string | undefined | null): ZoneDefault {
  if (!zone) return ZONE_FALLBACK
  const z = zone.toLowerCase()
  // Try exact key first, then a "contains" match for compound zones like
  // "Villa final · Munduk" or "Llegada · Denpasar".
  if (ZONE_DEFAULTS[z]) return ZONE_DEFAULTS[z]
  for (const key of Object.keys(ZONE_DEFAULTS)) {
    if (z.includes(key)) return ZONE_DEFAULTS[key]
  }
  return ZONE_FALLBACK
}
