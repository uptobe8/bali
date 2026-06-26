'use client'

import type {
  ItineraryResponse,
  GuideResponse,
  SuggestionsResponse,
  Playa,
  Suggestion,
  ApplyResult,
  GenerateResult,
  PlanPreferences,
  SuggestionType,
  SourceKind,
  GastronomyRestaurant,
  Activity,
  FaunaActivity,
  ElephantActivity,
} from '@/lib/types'

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${t || res.statusText}`)
  }
  return (await res.json()) as T
}

export async function getItinerary(): Promise<ItineraryResponse> {
  return jsonOrThrow<ItineraryResponse>(
    await fetch('/api/itinerary', { cache: 'no-store' })
  )
}

export async function getGuide(): Promise<GuideResponse> {
  return jsonOrThrow<GuideResponse>(
    await fetch('/api/guide', { cache: 'no-store' })
  )
}

export async function getSuggestions(): Promise<SuggestionsResponse> {
  return jsonOrThrow<SuggestionsResponse>(
    await fetch('/api/suggestions', { cache: 'no-store' })
  )
}

export async function getPlayas(params?: {
  region?: string
  subzona?: string
  perfil?: string
  busqueda?: string
}): Promise<{ playas: Playa[] }> {
  const sp = new URLSearchParams()
  if (params?.region) sp.set('region', params.region)
  if (params?.subzona) sp.set('subzona', params.subzona)
  if (params?.perfil) sp.set('perfil', params.perfil)
  if (params?.busqueda) sp.set('busqueda', params.busqueda)
  const qs = sp.toString()
  const url = `/api/playas${qs ? `?${qs}` : ''}`
  return jsonOrThrow<{ playas: Playa[] }>(
    await fetch(url, { cache: 'no-store' })
  )
}

export interface CreateSuggestionPayload {
  type: SuggestionType
  title: string
  note?: string
  url?: string
  author: string
  sourceKind?: SourceKind
  coordsLat?: number
  coordsLng?: number
  file?: File
}

export async function createSuggestion(
  p: CreateSuggestionPayload
): Promise<Suggestion> {
  let res: Response
  if (p.file) {
    const fd = new FormData()
    fd.append('type', p.type)
    fd.append('title', p.title)
    if (p.note) fd.append('note', p.note)
    if (p.url) fd.append('url', p.url)
    fd.append('author', p.author)
    if (p.sourceKind) fd.append('sourceKind', p.sourceKind)
    if (p.coordsLat != null) fd.append('coordsLat', String(p.coordsLat))
    if (p.coordsLng != null) fd.append('coordsLng', String(p.coordsLng))
    fd.append('file', p.file)
    res = await fetch('/api/suggestions', { method: 'POST', body: fd })
  } else {
    res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: p.type,
        title: p.title,
        note: p.note,
        url: p.url,
        author: p.author,
        sourceKind: p.sourceKind,
        coordsLat: p.coordsLat,
        coordsLng: p.coordsLng,
      }),
    })
  }
  const data = await jsonOrThrow<{ suggestion: Suggestion }>(res)
  return data.suggestion
}

export interface ExtractResult {
  title: string
  description?: string
  imageUrl?: string | null
  sourceKind?: string | null
}

export async function extractUrl(url: string): Promise<ExtractResult> {
  const res = await fetch('/api/suggestions/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return jsonOrThrow<ExtractResult>(res)
}

export async function patchSuggestion(
  id: string,
  patch: Partial<Suggestion>
): Promise<Suggestion> {
  const res = await fetch(`/api/suggestions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const data = await jsonOrThrow<{ suggestion: Suggestion }>(res)
  return data.suggestion
}

export async function deleteSuggestion(id: string): Promise<void> {
  await jsonOrThrow(await fetch(`/api/suggestions/${id}`, { method: 'DELETE' }))
}

export async function applySuggestions(
  suggestionIds: string[]
): Promise<ApplyResult> {
  const res = await fetch('/api/suggestions/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestionIds }),
  })
  return jsonOrThrow<ApplyResult>(res)
}

/**
 * Trigger itinerary generation (returns immediately with status).
 * Then poll GET /api/itinerary/generate/status until done.
 * ~2-3 min latency. Returns GenerateResult when finished.
 */
export async function generateItinerary(
  prefs: PlanPreferences,
  onProgress?: (status: string) => void,
): Promise<GenerateResult> {
  // 1. Kick off generation
  const startRes = await fetch('/api/itinerary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  })
  const startData = await startRes.json()
  if (startData.error) throw new Error(startData.error)

  // 2. Poll until done
  const maxAttempts = 120 // 120 × 3s = 6 minutes max
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    if (onProgress) onProgress('generating')

    const pollRes = await fetch('/api/itinerary/generate')
    const pollData = await pollRes.json()

    if (pollData.status === 'done' && pollData.result) {
      return pollData.result as GenerateResult
    }
    if (pollData.status === 'error' && pollData.result) {
      return pollData.result as GenerateResult
    }
    if (pollData.status === 'idle') {
      // Job was lost — shouldn't happen, but handle gracefully
      return {
        success: false,
        message: 'La generación se perdió. Inténtalo de nuevo.',
        daysAdded: 0,
      }
    }
  }

  return {
    success: false,
    message: 'La generación está tardando demasiado. Recarga la página para ver el resultado.',
    daysAdded: 0,
  }
}

/**
 * Wipe the current trip + its days + its suggestions. Returns the app to the
 * empty (no-trip) state. Always returns `{ ok: true }`.
 */
export async function resetItinerary(): Promise<{ ok: boolean }> {
  const res = await fetch('/api/itinerary', { method: 'DELETE' })
  return jsonOrThrow<{ ok: boolean }>(res)
}

export async function getGastronomia(params?: { zona?: string; tipo?: string; precio?: string; busqueda?: string }): Promise<{ restaurants: GastronomyRestaurant[] }> {
  const sp = new URLSearchParams()
  if (params?.zona) sp.set('zona', params.zona)
  if (params?.tipo) sp.set('tipo', params.tipo)
  if (params?.precio) sp.set('precio', params.precio)
  if (params?.busqueda) sp.set('busqueda', params.busqueda)
  const qs = sp.toString()
  return jsonOrThrow<{ restaurants: GastronomyRestaurant[] }>(await fetch(`/api/gastronomia${qs ? `?${qs}` : ''}`, { cache: 'no-store' }))
}

export async function getActividades(params?: { region?: string; categoria?: string; dificultad?: string; busqueda?: string }): Promise<{ activities: Activity[] }> {
  const sp = new URLSearchParams()
  if (params?.region) sp.set('region', params.region)
  if (params?.categoria) sp.set('categoria', params.categoria)
  if (params?.dificultad) sp.set('dificultad', params.dificultad)
  if (params?.busqueda) sp.set('busqueda', params.busqueda)
  const qs = sp.toString()
  return jsonOrThrow<{ activities: Activity[] }>(await fetch(`/api/actividades${qs ? `?${qs}` : ''}`, { cache: 'no-store' }))
}

export async function getFauna(params?: { region?: string; especie?: string; busqueda?: string }): Promise<{ fauna: FaunaActivity[] }> {
  const sp = new URLSearchParams()
  if (params?.region) sp.set('region', params.region)
  if (params?.especie) sp.set('especie', params.especie)
  if (params?.busqueda) sp.set('busqueda', params.busqueda)
  const qs = sp.toString()
  return jsonOrThrow<{ fauna: FaunaActivity[] }>(await fetch(`/api/fauna${qs ? `?${qs}` : ''}`, { cache: 'no-store' }))
}

export async function getElefantes(params?: { region?: string; dificultad?: string; busqueda?: string }): Promise<{ elephants: ElephantActivity[] }> {
  const sp = new URLSearchParams()
  if (params?.region) sp.set('region', params.region)
  if (params?.dificultad) sp.set('dificultad', params.dificultad)
  if (params?.busqueda) sp.set('busqueda', params.busqueda)
  const qs = sp.toString()
  return jsonOrThrow<{ elephants: ElephantActivity[] }>(await fetch(`/api/elefantes${qs ? `?${qs}` : ''}`, { cache: 'no-store' }))
}
