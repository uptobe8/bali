// Shared types & helpers for Nusa Travel OS — used by backend API and frontend.

export type SuggestionType =
  | 'link'
  | 'hotel'
  | 'activity'
  | 'restaurant'
  | 'beach'
  | 'place'
  | 'photo'
  | 'doc'
  | 'other'

export type SuggestionStatus = 'pending' | 'applied' | 'rejected'

export type SourceKind = 'instagram' | 'booking' | 'airbnb' | 'googlemaps' | 'web' | 'upload' | 'manual'

export interface Trip {
  id: string
  title: string
  destination: string
  dates: string
  travellers: string
  budget: string
  pace: string
  musts: string
  restrictions: string | null
}

/**
 * Preferences the user fills in on the Inicio planner form. Sent to
 * `POST /api/itinerary/generate` to produce a fresh itinerary from scratch
 * via the LLM (z-ai-web-dev-sdk, server-side only).
 */
export interface PlanPreferences {
  destination: string
  dates: string
  travellers: string
  budget: string
  pace: string
  musts: string
  restrictions: string
}

export interface Day {
  id: string
  tripId: string
  order: number
  day: string
  zone: string
  title: string
  image: string
  morning: string
  lunch: string
  afternoon: string
  night: string
  transport: string
  cost: string
  time: string
  mapQuery: string
  wazeQuery: string
  advice: string
  hotelName: string | null
  hotelPrice: string | null
  hotelLink: string | null
  mealLunchName: string | null
  mealLunchPrice: string | null
  mealLunchLink: string | null
  mealDinnerName: string | null
  mealDinnerPrice: string | null
  mealDinnerLink: string | null
  coordsLat: number | null
  coordsLng: number | null
}

export interface Suggestion {
  id: string
  tripId: string
  type: SuggestionType
  title: string
  note: string | null
  url: string | null
  author: string
  imageUrl: string | null
  filePath: string | null
  sourceKind: string | null
  status: SuggestionStatus
  appliedToDay: number | null
  coordsLat: number | null
  coordsLng: number | null
  createdAt: string
  updatedAt: string
}

export type GuideCategory = 'transport' | 'restaurant' | 'beach' | 'activity' | 'tip'

export interface GuideEntry {
  id: string
  category: GuideCategory
  zone: string
  title: string
  text: string
  price: string | null
  time: string | null
  link: string | null
  wazeQuery: string | null
  image: string | null
  order: number
}

// ---- API response shapes ----

export interface ItineraryResponse {
  trip: Trip | null
  days: Day[]
}

export interface GuideResponse {
  entries: GuideEntry[]
}

export interface SuggestionsResponse {
  suggestions: Suggestion[]
}

export interface CreateSuggestionInput {
  type: SuggestionType
  title: string
  note?: string
  url?: string
  author: string
  sourceKind?: SourceKind
  coordsLat?: number
  coordsLng?: number
  // file uploads come through multipart; the API returns imageUrl/filePath
}

export interface ApplySuggestionsInput {
  suggestionIds: string[]
}

export interface ApplyResult {
  success: boolean
  message: string
  applied: number
  daysAdded: number
}

export interface GenerateResult {
  success: boolean
  message: string
  daysAdded: number
}

// ---- URL helpers ----

export function wazeNavigateUrl(query: string): string {
  // Waze deep link — opens navigation/search in the Waze app (or web fallback)
  return `https://www.waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`
}

export function wazeCoordUrl(lat: number, lng: number): string {
  return `https://www.waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`
}

export function googleMapUrl(q: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function googleRouteUrl(q: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
}

export const SUGGESTION_TYPE_META: Record<SuggestionType, { label: string; icon: string }> = {
  link: { label: 'Enlace', icon: 'Link' },
  hotel: { label: 'Hotel', icon: 'Hotel' },
  activity: { label: 'Actividad', icon: 'Sparkles' },
  restaurant: { label: 'Restaurante', icon: 'UtensilsCrossed' },
  beach: { label: 'Playa', icon: 'Palmtree' },
  place: { label: 'Sitio', icon: 'MapPin' },
  photo: { label: 'Foto', icon: 'Image' },
  doc: { label: 'Documento', icon: 'FileText' },
  other: { label: 'Otro', icon: 'Compass' },
}

export interface GastronomyRestaurant {
  id: string
  order: number
  name: string
  zone: string
  subzone: string
  region: string
  description: string
  signatureDish: string
  tip: string
  priceLevel: number
  type: string
  cuisine: string
  address: string
  lat: number | null
  lng: number | null
  wazeUrl: string
  webUrl: string
  imageUrl: string
  rating: number
}

export const CATEGORY_META: Record<GuideCategory, { label: string; icon: string }> = {
  transport: { label: 'Transportes', icon: 'Plane' },
  restaurant: { label: 'Restaurantes', icon: 'UtensilsCrossed' },
  beach: { label: 'Playas', icon: 'Palmtree' },
  activity: { label: 'Actividades', icon: 'Sparkles' },
  tip: { label: 'Consejos', icon: 'Lightbulb' },
}

// ---- Playa (Beach) ----

export interface Playa {
  id: string
  order: number
  name: string
  zone: string
  subzone: string
  region: string
  ubicacion: string
  descripcion: string
  mejorHora: string
  banio: string
  acceso: string
  seguridad: string
  caracteristicas: string
  area: string
  consejos: string
  prioridad: string
  perfilPlaya: string
  address: string
  lat: number | null
  lng: number | null
  wazeUrl: string
  googleMapsUrl: string
  foto1: string
  foto2: string
  foto3: string
}

export const PLAYA_REGIONS = [
  'Bali',
  'Java',
  'Komodo y Flores',
  'Borneo y Sumatra',
  'Sulawesi y Raja Ampat',
  'Gili y Nusa Penida',
] as const

export const PLAYA_PERFILES = [
  'Snorkel',
  'Surf',
  'Familias',
  'Sunset',
  'Fotografía',
  'Aventura',
  'Aislada',
] as const

// ---- Activity ----
export interface Activity {
  id: string; order: number; name: string; slug: string; zone: string; subzone: string; region: string
  lugarBase: string; description: string; duration: string; difficulty: string; priceRange: string
  precioTipo: string; category: string; mejorEpoca: string; mejorHora: string
  logistica: string; consejos: string; seguridad: string; aptoNinos: string
  prioridad: string; estadoVerificacion: string; sourceKey: string; sourceUrl: string
  address: string; lat: number | null; lng: number | null; wazeUrl: string; webUrl: string
  imageUrl1: string; imageUrl2: string; imageUrl3: string; imageUrl4: string; rating: number
}

export const ACTIVITY_CATEGORIES = ['Naturaleza','Aventura','Cultural','Gastronómica','Deportiva','Bienestar','Acuática','Montaña','Sobrevivencia','Exploración','Relajante'] as const
export const ACTIVITY_DIFFICULTIES = ['Baja','Baja-media','Media','Media-alta','Alta','Muy alta'] as const

// ---- Fauna ----
export interface FaunaActivity {
  id: string; order: number; name: string; zone: string; subzone: string; region: string
  description: string; tipoActividad: string; dificultad: string; duracion: string
  mejorEpoca: string; queVer: string; peligro: string; especie: string; familia: string
  address: string; lat: number | null; lng: number | null; wazeUrl: string; webUrl: string
  foto1: string; foto2: string; foto3: string; rating: number
}

// ---- Elephant ----
export interface ElephantActivity {
  id: string; order: number; name: string; slug: string; zone: string; subzone: string; region: string
  lugarBase: string; description: string; tipoActividad: string; dificultad: string; duracion: string
  mejorEpoca: string; mejorHora: string; queVer: string; peligro: string
  precio1Dia: string; precio2Dias: string; precio3Dias: string; precioFecha: string
  logistica: string; nivelTurismo: string; nivelRespeto: string; nivelContacto: string
  filtroResumen: string; opinionPositiva: string; opinionNegativa: string
  consejos: string; recomendacion: string; sourceUrl: string; estadoVerificacion: string
  address: string; lat: number | null; lng: number | null; wazeUrl: string; webUrl: string
  foto1: string; foto2: string; foto3: string; rating: number
}

export const ALL_REGIONS = ['Bali','Java','Komodo y Flores','Borneo y Sumatra','Sulawesi y Raja Ampat','Gili y Nusa Penida'] as const
