import { lookupZone } from './zones'
import type { Day, PlanPreferences, Trip } from '@/lib/types'
import type { LlmDay } from './llm-itinerary'

export type OptionBudgetTag = 'barato' | 'medio' | 'premium'

export type OptionLevel = {
  id: 'economica' | 'media' | 'premium'
  budgetTag: OptionBudgetTag
  label: string
  tag: string
  description: string
  perDayMin: number
  perDayMax: number
  hotelName: string
  hotelPrice: string
  lunchName: string
  lunchPrice: string
  dinnerName: string
  dinnerPrice: string
  transport: string
  cost: string
  tradeoffs: string[]
  upgrades: string[]
  differenceFromMedium: string
  recommended?: boolean
}

export const OPTION_LEVELS: OptionLevel[] = [
  {
    id: 'economica',
    budgetTag: 'barato',
    label: 'Económica',
    tag: 'Ahorro',
    description: 'Hoteles sencillos, warungs, menos traslados privados y más planes gratis o baratos.',
    perDayMin: 45,
    perDayMax: 75,
    hotelName: 'Guesthouse local bien ubicada',
    hotelPrice: '25 – 55 €/noche',
    lunchName: 'Warung local / mercado',
    lunchPrice: '3 – 8 €/persona',
    dinnerName: 'Warung recomendado',
    dinnerPrice: '6 – 14 €/persona',
    transport: 'Taxi local, ferry compartido y conductor solo en tramos clave',
    cost: '45 – 75 €/persona/día',
    tradeoffs: ['Menos hoteles especiales', 'Más gestión local de traslados', 'Menos beach clubs y tours privados'],
    upgrades: ['Mantiene zonas e imprescindibles', 'Optimiza comidas locales', 'Prioriza actividades gratis o de bajo coste'],
    differenceFromMedium: 'Baja alojamientos y experiencias de pago, manteniendo ruta y días clave.',
  },
  {
    id: 'media',
    budgetTag: 'medio',
    label: 'Media',
    tag: 'Recomendada',
    description: 'Hoteles boutique/gama media, mezcla de restaurantes locales y tours clave sin disparar el coste.',
    perDayMin: 80,
    perDayMax: 140,
    hotelName: 'Hotel boutique / villa sencilla',
    hotelPrice: '65 – 130 €/noche',
    lunchName: 'Restaurante local seleccionado',
    lunchPrice: '8 – 18 €/persona',
    dinnerName: 'Restaurante medio bien ubicado',
    dinnerPrice: '15 – 32 €/persona',
    transport: 'Coche privado en tramos largos + ferries organizados + taxi local',
    cost: '80 – 140 €/persona/día',
    tradeoffs: ['No busca lujo constante', 'Algún traslado compartido si compensa'],
    upgrades: ['Equilibrio entre comodidad y coste', 'Tours clave incluidos', 'Hoteles con buena ubicación'],
    differenceFromMedium: 'Es la base recomendada: equilibrio entre comodidad, tiempo y presupuesto.',
    recommended: true,
  },
  {
    id: 'premium',
    budgetTag: 'premium',
    label: 'Premium',
    tag: 'Confort',
    description: 'Mejores hoteles, beach clubs, traslados privados y experiencias más especiales.',
    perDayMin: 160,
    perDayMax: 310,
    hotelName: 'Resort boutique / villa privada con piscina',
    hotelPrice: '150 – 320 €/noche',
    lunchName: 'Restaurante cuidado / beach club',
    lunchPrice: '18 – 38 €/persona',
    dinnerName: 'Restaurante especial / sunset dinner',
    dinnerPrice: '35 – 85 €/persona',
    transport: 'Coche privado, fast boat premium y logística cerrada puerta a puerta',
    cost: '160 – 310 €/persona/día',
    tradeoffs: ['Coste más alto', 'Más reservas previas necesarias'],
    upgrades: ['Alojamientos superiores', 'Más experiencias privadas', 'Comidas y cierres de día más especiales'],
    differenceFromMedium: 'Sube hoteles, traslados y experiencias sin cambiar la estructura del viaje.',
  },
]

export function optionByTag(tag: string | null | undefined): OptionLevel {
  return OPTION_LEVELS.find((x) => x.budgetTag === tag) ?? OPTION_LEVELS[1]
}

export function parseTravellerCount(travellers: string | null | undefined): number {
  const match = String(travellers || '').match(/(\d+)/)
  return match ? Math.max(1, Number(match[1])) : 2
}

export function estimateText(level: OptionLevel, daysCount: number, travellers: string | null | undefined) {
  const days = Math.max(daysCount, 1)
  const people = parseTravellerCount(travellers)
  const perPersonMin = level.perDayMin * days
  const perPersonMax = level.perDayMax * days
  const groupMin = perPersonMin * people
  const groupMax = perPersonMax * people
  return {
    totalEstimate: `${perPersonMin} – ${perPersonMax} €/persona · ${groupMin} – ${groupMax} € grupo aprox.`,
    perDayEstimate: `${level.perDayMin} – ${level.perDayMax} €/persona/día`,
  }
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function buildOptionDays(baseDays: LlmDay[], level: OptionLevel): LlmDay[] {
  return baseDays.map((day, index) => {
    const prefix = level.id === 'media' ? '' : `${level.label}: `
    return {
      ...day,
      day: asText(day.day, String(index + 1)),
      title: asText(day.title, `Día ${index + 1}`),
      transport: level.id === 'media' ? asText(day.transport, level.transport) : level.transport,
      cost: level.cost,
      hotelName: level.id === 'media' ? asText(day.hotelName, level.hotelName) : level.hotelName,
      hotelPrice: level.hotelPrice,
      mealLunchName: level.id === 'media' ? asText(day.mealLunchName, level.lunchName) : level.lunchName,
      mealLunchPrice: level.lunchPrice,
      mealDinnerName: level.id === 'media' ? asText(day.mealDinnerName, level.dinnerName) : level.dinnerName,
      mealDinnerPrice: level.dinnerPrice,
      advice: `${prefix}${level.differenceFromMedium} ${asText(day.advice)}`.trim(),
    }
  })
}

export function optionTrip(base: Trip | { id: string; title: string; destination: string; dates: string; travellers: string; budget: string; pace: string; musts: string; restrictions: string | null }, level: OptionLevel): Trip {
  return {
    id: `${base.id}-${level.id}`,
    title: `${base.destination} · ${base.dates} · ${level.label}`,
    destination: base.destination,
    dates: base.dates,
    travellers: base.travellers,
    budget: level.label,
    pace: base.pace,
    musts: base.musts,
    restrictions: base.restrictions,
  }
}

export function optionSummary(row: { id: string; title: string; budgetTag: string; travellers: string; daysCount: number; createdAt: Date }) {
  const level = optionByTag(row.budgetTag)
  const estimate = estimateText(level, row.daysCount, row.travellers)
  return {
    id: row.id,
    key: level.id,
    label: level.label,
    tag: level.tag,
    title: row.title,
    budgetTag: level.budgetTag,
    description: level.description,
    totalEstimate: estimate.totalEstimate,
    perDayEstimate: estimate.perDayEstimate,
    tradeoffs: level.tradeoffs,
    upgrades: level.upgrades,
    differenceFromMedium: level.differenceFromMedium,
    recommended: !!level.recommended,
    daysCount: row.daysCount,
    createdAt: row.createdAt.toISOString(),
  }
}

export function hydrateStoredDays(raw: string, tripId: string): Omit<Day, 'id'>[] {
  let parsed: unknown = []
  try { parsed = JSON.parse(raw || '[]') } catch { parsed = [] }
  const rows = Array.isArray(parsed) ? parsed : []
  return rows.map((item, index) => {
    const d = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const zoneName = asText(d.zone, 'Indonesia')
    const zone = lookupZone(zoneName)
    return {
      tripId,
      order: index,
      day: asText(d.day, String(index + 1)),
      zone: zoneName,
      title: asText(d.title, `Día ${index + 1}`),
      image: zone.image,
      morning: asText(d.morning),
      lunch: asText(d.lunch),
      afternoon: asText(d.afternoon),
      night: asText(d.night),
      transport: asText(d.transport),
      cost: asText(d.cost),
      time: asText(d.time),
      mapQuery: asText(d.mapQuery, zoneName),
      wazeQuery: asText(d.wazeQuery, zoneName),
      advice: asText(d.advice),
      hotelName: asText(d.hotelName) || null,
      hotelPrice: asText(d.hotelPrice) || null,
      hotelLink: asText(d.hotelLink) || null,
      mealLunchName: asText(d.mealLunchName) || null,
      mealLunchPrice: asText(d.mealLunchPrice) || null,
      mealLunchLink: asText(d.mealLunchLink) || null,
      mealDinnerName: asText(d.mealDinnerName) || null,
      mealDinnerPrice: asText(d.mealDinnerPrice) || null,
      mealDinnerLink: asText(d.mealDinnerLink) || null,
      coordsLat: zone.lat,
      coordsLng: zone.lng,
    }
  })
}

export function optionPrefs(base: PlanPreferences, level: OptionLevel): PlanPreferences {
  return {
    ...base,
    budget: level.label,
    musts: `${base.musts} Nivel de presupuesto: ${level.description}`,
  }
}
