import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateItineraryFromPreferences } from '@/lib/server/llm-itinerary'
import { buildOptionDays, hydrateStoredDays, optionByTag, optionPrefs } from '@/lib/server/itinerary-options'
import type { GenerateResult, PlanPreferences } from '@/lib/types'

type Job = {
  id: string
  status: 'pending' | 'generating' | 'done' | 'error'
  result: string | null
  updatedAt: string
}

const jobs = new Map<string, Job>()

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const now = new Date().toISOString()
  jobs.set(id, { id, status: 'pending', result: null, updatedAt: now })

  runRegeneration(id).catch((err) => {
    console.error('[regenerate option] background error', err)
    const job = jobs.get(id)
    if (!job) return
    job.status = 'error'
    job.result = JSON.stringify({
      success: false,
      message: err instanceof Error ? err.message : 'No se pudo regenerar esta opción.',
      daysAdded: 0,
    } as GenerateResult)
    job.updatedAt = new Date().toISOString()
  })

  return NextResponse.json({ status: 'generating' })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const job = jobs.get(id)
  if (!job) return NextResponse.json({ status: 'idle' })
  return NextResponse.json({ status: job.status, result: job.result ? JSON.parse(job.result) : null })
}

async function runRegeneration(id: string) {
  const job = jobs.get(id)
  if (!job) return
  job.status = 'generating'
  job.updatedAt = new Date().toISOString()

  const option = await db.savedItinerary.findUnique({ where: { id } })
  if (!option) throw new Error('Opción no encontrada')

  const level = optionByTag(option.budgetTag)
  const prefs: PlanPreferences = optionPrefs({
    destination: option.destination,
    dates: option.dates,
    travellers: option.travellers,
    budget: option.budget,
    pace: option.pace,
    musts: option.musts,
    restrictions: option.restrictions || '',
  }, level)

  const baseDays = await generateItineraryFromPreferences(prefs)
  const days = buildOptionDays(baseDays, level)

  await db.savedItinerary.update({
    where: { id },
    data: {
      title: `${option.destination} · ${option.dates} · ${level.label}`,
      budget: level.label,
      budgetTag: level.budgetTag,
      daysCount: days.length,
      dayData: JSON.stringify(days),
    },
  })

  const activeTrip = await db.trip.findUnique({ where: { id: 'current' } })
  const sameTrip = !!activeTrip &&
    activeTrip.destination === option.destination &&
    activeTrip.dates === option.dates &&
    activeTrip.travellers === option.travellers &&
    activeTrip.pace === option.pace &&
    activeTrip.musts === option.musts &&
    (activeTrip.restrictions || null) === (option.restrictions || null) &&
    activeTrip.budget.toLowerCase().includes(level.label.toLowerCase())

  if (sameTrip) {
    const hydrated = hydrateStoredDays(JSON.stringify(days), activeTrip.id)
    await db.$transaction(async (tx) => {
      await tx.day.deleteMany({ where: { tripId: activeTrip.id } })
      for (const day of hydrated) {
        await tx.day.create({ data: day })
      }
    })
  }

  job.status = 'done'
  job.result = JSON.stringify({
    success: true,
    message: `${level.label} regenerada correctamente${sameTrip ? ' y actualizada como itinerario activo' : ''}.`,
    daysAdded: days.length,
  } as GenerateResult)
  job.updatedAt = new Date().toISOString()
}
