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

export async function activateItineraryOption(id: string): Promise<{ success: boolean; message: string; daysAdded: number }> {
  return jsonOrThrow<{ success: boolean; message: string; daysAdded: number }>(
    await fetch(`/api/itinerary-options/${id}/activate`, { method: 'POST' }),
  )
}
