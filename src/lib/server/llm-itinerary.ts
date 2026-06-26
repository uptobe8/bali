// Server-only LLM helpers for Nusa Travel OS.
// - generateItineraryFromPreferences: create a fresh itinerary from the
//   planner form (Inicio).
// - regenerateItineraryWithLlm: rebuild the itinerary incorporating the
//   Izan & Iria selected suggestions.
// Uses z-ai-web-dev-sdk (backend only).

import ZAI from 'z-ai-web-dev-sdk'
import { lookupZone } from './zones'
import type { Suggestion, Day, PlanPreferences } from '@/lib/types'

export interface LlmDay {
  day: string
  zone: string
  title: string
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
  hotelName: string
  hotelPrice: string
  hotelLink: string
  mealLunchName: string
  mealLunchPrice: string
  mealLunchLink: string
  mealDinnerName: string
  mealDinnerPrice: string
  mealDinnerLink: string
}

const SYSTEM_PROMPT = `Eres un planificador experto de itinerarios de viaje. Recibes las preferencias del viajero (destination, dates, travellers, budget, pace, musts, restrictions) y, opcionalmente, el itinerario actual y nuevas sugerencias de los viajeros.

Tu tarea: devolver SIEMPRE un NUEVO itinerario día a día en JSON que respete las preferencias del viajero y, si las hay, integre de forma natural las nuevas sugerencias.

Reglas estrictas:
- El número de días debe coincidir con lo que indique "dates" (por defecto 16).
- Devuelve EXCLUSIVAMENTE un array JSON de objetos día. Sin texto antes ni después, sin explicaciones, sin bloques de código ni fences markdown.
- Cada objeto día debe tener EXACTAMENTE estas claves (todas string, nunca null): day, zone, title, morning, lunch, afternoon, night, transport, cost, time, mapQuery, wazeQuery, advice, hotelName, hotelPrice, hotelLink, mealLunchName, mealLunchPrice, mealLunchLink, mealDinnerName, mealDinnerPrice, mealDinnerLink.
- No incluyas claves de coordenadas ni de imagen (el servidor las rellena a partir de "zone").
- Respeta siempre "musts" (imprescindibles) y "restrictions" (lo que se debe evitar o las condiciones).
- Cuando uses una sugerencia del usuario en algún campo, prepón el símbolo "★ " al inicio de ese campo concreto para que se vea integrado. No abuses del marcador: solo en el campo donde encaje la sugerencia.
- Tono cálido de app de viaje, evocador (descripciones, NO instrucciones tipo "debes/hay que"). Todo el texto en español.
- NUNCA uses la palabra "romántico".
- Mantén precios realistas como rangos (tipo "12 – 20 €/persona").
- "mapQuery" y "wazeQuery" deben ser consultas útiles para buscar en Google Maps / Waze (lugares reales).
- "hotelLink" y los "meal*Link" pueden quedar como "" si no tienes uno claro.
- Sé CONCISO en cada campo (1–2 frases máximo por campo) para que el JSON completo quepa en la respuesta.`

function summariseDay(d: Day): Record<string, string> {
  // Send only the high-signal fields to the LLM to keep the prompt compact;
  // the model already has plenty of context to regenerate the full plan.
  return {
    day: d.day,
    zone: d.zone,
    title: d.title,
    morning: d.morning,
    lunch: d.lunch,
    afternoon: d.afternoon,
    night: d.night,
    transport: d.transport,
    hotelName: d.hotelName ?? '',
    mealLunchName: d.mealLunchName ?? '',
    mealDinnerName: d.mealDinnerName ?? '',
  }
}

function summariseSuggestion(s: Suggestion): Record<string, unknown> {
  return {
    id: s.id,
    type: s.type,
    title: s.title,
    note: s.note ?? '',
    url: s.url ?? '',
    author: s.author,
    sourceKind: s.sourceKind ?? '',
  }
}

function stripCodeFences(text: string): string {
  let t = text.trim()
  // Remove ```json ... ``` or ``` ... ``` wrappers if present.
  const fenceMatch = t.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i)
  if (fenceMatch) t = fenceMatch[1].trim()
  // Some models add a leading "Aquí tienes..." and trailing text. Find the first
  // '[' and the matching last ']'.
  const firstBracket = t.indexOf('[')
  const lastBracket = t.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    t = t.slice(firstBracket, lastBracket + 1)
  }
  return t
}

function coerceString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (v === null || v === undefined) return fallback
  return String(v)
}

function normaliseDay(raw: unknown): LlmDay {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    day: coerceString(obj.day, ''),
    zone: coerceString(obj.zone, ''),
    title: coerceString(obj.title, ''),
    morning: coerceString(obj.morning, ''),
    lunch: coerceString(obj.lunch, ''),
    afternoon: coerceString(obj.afternoon, ''),
    night: coerceString(obj.night, ''),
    transport: coerceString(obj.transport, ''),
    cost: coerceString(obj.cost, ''),
    time: coerceString(obj.time, ''),
    mapQuery: coerceString(obj.mapQuery, ''),
    wazeQuery: coerceString(obj.wazeQuery, ''),
    advice: coerceString(obj.advice, ''),
    hotelName: coerceString(obj.hotelName, ''),
    hotelPrice: coerceString(obj.hotelPrice, ''),
    hotelLink: coerceString(obj.hotelLink, ''),
    mealLunchName: coerceString(obj.mealLunchName, ''),
    mealLunchPrice: coerceString(obj.mealLunchPrice, ''),
    mealLunchLink: coerceString(obj.mealLunchLink, ''),
    mealDinnerName: coerceString(obj.mealDinnerName, ''),
    mealDinnerPrice: coerceString(obj.mealDinnerPrice, ''),
    mealDinnerLink: coerceString(obj.mealDinnerLink, ''),
  }
}

/**
 * Shared LLM call + parse logic. Sends the system prompt + a user payload
 * (already stringified by the caller) and returns the parsed LlmDay[].
 * Throws a clear Error on empty/invalid responses.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function callLlmForDays(userPayloadJson: string): Promise<LlmDay[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        model: 'glm-4.6',
        temperature: 0.7,
        max_tokens: 8192,
        thinking: { type: 'disabled' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPayloadJson },
        ],
      })

      const raw: string =
        (completion?.choices?.[0]?.message?.content as string | undefined) ?? ''
      const finishReason: string = completion?.choices?.[0]?.finish_reason ?? ''

      if (!raw) {
        console.error(`[llm-itinerary] attempt ${attempt}: empty content. finish_reason =`, finishReason)
        throw new Error('El LLM devolvió una respuesta vacía')
      }
      if (finishReason === 'length') {
        console.warn(`[llm-itinerary] attempt ${attempt}: finish_reason=length — response truncated, will retry`)
        throw new Error('Respuesta truncada por límite de tokens')
      }

      const cleaned = stripCodeFences(raw)
      let parsed: unknown
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error(`[llm-itinerary] attempt ${attempt}: JSON parse failed. head:`, cleaned.slice(0, 300))
        throw new Error('No se pudo parsear el JSON del LLM')
      }
      if (!Array.isArray(parsed)) throw new Error('El LLM no devolvió un array')
      const days = parsed.map(normaliseDay)
      if (days.length === 0) throw new Error('El LLM devolvió 0 días')
      return days
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const isRetryable = lastError.message.includes('vacía') ||
        lastError.message.includes('truncada') ||
        lastError.message.includes('parsear') ||
        lastError.message.includes('array') ||
        lastError.message.includes('0 días') ||
        lastError.message.includes('502') ||
        lastError.message.includes('503') ||
        lastError.message.includes('gateway') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('network')

      if (!isRetryable || attempt === maxRetries) {
        console.error(`[llm-itinerary] attempt ${attempt}/${maxRetries}: fatal error:`, lastError.message)
        break
      }

      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000)
      console.warn(`[llm-itinerary] attempt ${attempt} failed (${lastError.message}), retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }

  throw lastError ?? new Error('No se pudo generar el itinerario después de varios intentos')
}

/**
 * Generate a fresh itinerary from scratch using the user's planner-form
 * preferences (no existing itinerary, no suggestions).
 */
export async function generateItineraryFromPreferences(
  prefs: PlanPreferences,
): Promise<LlmDay[]> {
  const userPayload = {
    mode: 'generate-from-preferences',
    preferences: prefs,
  }
  return callLlmForDays(JSON.stringify(userPayload, null, 2))
}

/**
 * Regenerate the itinerary incorporating the Izan & Iria selected
 * suggestions, while respecting the trip's original preferences.
 */
export async function regenerateItineraryWithLlm(
  currentDays: Day[],
  selected: Suggestion[],
  tripPreferences?: {
    destination?: string
    dates?: string
    travellers?: string
    budget?: string
    pace?: string
    musts?: string
    restrictions?: string | null
  },
): Promise<LlmDay[]> {
  const userPayload = {
    mode: 'apply-suggestions',
    tripPreferences: tripPreferences ?? {},
    currentItinerary: currentDays.map(summariseDay),
    newSuggestions: selected.map(summariseSuggestion),
    markAppliedSuggestionsWith: '★ ',
  }
  return callLlmForDays(JSON.stringify(userPayload, null, 2))
}

/**
 * Returns the index of the first day that mentions a suggestion's title
 * (case-insensitive substring match across all the day's text fields).
 * Returns null if not found.
 */
export function findAppliedDayIndex(day: LlmDay, suggestion: Suggestion): number | null {
  const title = (suggestion.title || '').trim().toLowerCase()
  if (!title) return null
  // Use at least the first 4 chars so we still match e.g. "★ Sal..." variants.
  const needle = title.slice(0, Math.min(40, title.length))
  const haystack = [
    day.title, day.morning, day.lunch, day.afternoon, day.night,
    day.advice, day.hotelName, day.mealLunchName, day.mealDinnerName,
    day.zone, day.transport, day.mapQuery, day.wazeQuery,
  ].join(' \n ').toLowerCase()
  return haystack.includes(needle) ? Number(day.day) - 1 : null
}

export function zoneImageForDay(zone: string): string {
  return lookupZone(zone).image
}

export function zoneCoordsForDay(zone: string): { lat: number; lng: number } {
  const z = lookupZone(zone)
  return { lat: z.lat, lng: z.lng }
}
