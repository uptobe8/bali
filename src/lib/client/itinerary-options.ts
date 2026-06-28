'use client'

export type ItineraryOption = {
  id: string
  key: 'economica' | 'media' | 'premium' | string
  label: string
  tag: string
  title: string
  budgetTag: 'barato' | 'medio' | 'premium' | string
  description: string
  totalEstimate: string
  perDayEstimate: string
  tradeoffs: string[]
  upgrades: string[]
  differenceFromMedium: string
  recommended: boolean
  daysCount: number
  createdAt: string
}

export type OptionJobResult = {
  success: boolean
  message: string
  daysAdded: number
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${t || res.statusText}`)
  }
  return (await res.json()) as T
}

export async function getItineraryOptions(): Promise<{ options: ItineraryOption[] }> {
  return jsonOrThrow<{ options: ItineraryOption[] }>(
    await fetch('/api/itinerary-options', { cache: 'no-store' }),
  )
}

export async function activateItineraryOption(id: string): Promise<OptionJobResult> {
  return jsonOrThrow<OptionJobResult>(
    await fetch(`/api/itinerary-options/${id}/activate`, { method: 'POST' }),
  )
}

export async function regenerateItineraryOption(
  id: string,
  onProgress?: (status: string) => void,
): Promise<OptionJobResult> {
  const start = await fetch(`/api/itinerary-options/${id}/regenerate`, { method: 'POST' })
  const startData = await start.json()
  if (startData.error) throw new Error(startData.error)

  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    onProgress?.('generating')
    const poll = await fetch(`/api/itinerary-options/${id}/regenerate`, { cache: 'no-store' })
    const data = await poll.json()
    if (data.status === 'done' && data.result) return data.result as OptionJobResult
    if (data.status === 'error' && data.result) return data.result as OptionJobResult
    if (data.status === 'idle') {
      return { success: false, message: 'La regeneración se perdió. Inténtalo de nuevo.', daysAdded: 0 }
    }
  }

  return {
    success: false,
    message: 'La regeneración está tardando demasiado. Recarga la página para ver el resultado.',
    daysAdded: 0,
  }
}
