import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateItineraryFromPreferences, zoneImageForDay, zoneCoordsForDay } from '@/lib/server/llm-itinerary'
import { lookupZone } from '@/lib/server/zones'
import type { PlanPreferences, GenerateResult } from '@/lib/types'

// POST /api/itinerary/generate
// Uses a polling pattern to avoid Caddy 502 timeouts:
// 1. Returns { status: "generating" } immediately
// 2. Runs LLM generation in a background promise
// 3. Client polls GET /api/itinerary/generate until done

interface GenerationJob {
  id: string
  status: 'pending' | 'generating' | 'done' | 'error'
  result: string | null // JSON GenerateResult
  createdAt: string
  updatedAt: string
}

const activeJobs = new Map<string, GenerationJob>()

function getJobKey(): string {
  return 'current'
}

function classifyBudget(budget?: string): 'barato' | 'medio' | 'premium' {
  const b = (budget || '').toLowerCase()
  if (b.includes('económico') || b.includes('economico') || b.includes('mochilero')) return 'barato'
  if (b.includes('lujo') || b.includes('premium')) return 'premium'
  return 'medio'
}

function emptyToNull(s: string): string | null {
  return s && s.trim() ? s : null
}

export async function POST(request: Request) {
  let prefs: PlanPreferences
  try {
    const body = await request.json().catch(() => ({}))
    const obj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
    prefs = {
      destination: typeof obj.destination === 'string' ? obj.destination.trim() : '',
      dates: typeof obj.dates === 'string' ? obj.dates.trim() : '',
      travellers: typeof obj.travellers === 'string' ? obj.travellers.trim() : '',
      budget: typeof obj.budget === 'string' ? obj.budget.trim() : '',
      pace: typeof obj.pace === 'string' ? obj.pace.trim() : '',
      musts: typeof obj.musts === 'string' ? obj.musts.trim() : '',
      restrictions: typeof obj.restrictions === 'string' ? obj.restrictions.trim() : '',
    }
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de la petición inválido' },
      { status: 400 },
    )
  }

  if (!prefs.destination || !prefs.dates) {
    return NextResponse.json(
      { error: 'Indica al menos el destino y las fechas del viaje' },
      { status: 400 },
    )
  }

  const key = getJobKey()
  const now = new Date().toISOString()
  const job: GenerationJob = {
    id: key,
    status: 'pending',
    result: null,
    createdAt: now,
    updatedAt: now,
  }
  activeJobs.set(key, job)

  // Fire off generation in background — returns immediately to avoid Caddy timeout
  runGeneration(prefs, key).catch((err) => {
    console.error('[generate] Background generation error:', err)
    const existing = activeJobs.get(key)
    if (existing && existing.status === 'generating') {
      existing.status = 'error'
      existing.result = JSON.stringify({
        success: false,
        message: err instanceof Error ? err.message : 'No se pudo generar el itinerario. Inténtalo de nuevo en unos segundos.',
        daysAdded: 0,
      } as GenerateResult)
      existing.updatedAt = new Date().toISOString()
    }
  })

  return NextResponse.json({ status: 'generating' })
}

// GET /api/itinerary/generate
// Returns the current generation job status (polled by client).
export async function GET() {
  const key = getJobKey()
  const job = activeJobs.get(key)
  if (!job) {
    return NextResponse.json({ status: 'idle' })
  }
  const result = job.result ? JSON.parse(job.result) : null
  return NextResponse.json({
    status: job.status,
    result,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: runs LLM generation + DB writes in a fire-and-forget promise.
// ─────────────────────────────────────────────────────────────────────────────
async function runGeneration(prefs: PlanPreferences, jobKey: string): Promise<void> {
  const job = activeJobs.get(jobKey)
  if (!job) return

  job.status = 'generating'
  job.updatedAt = new Date().toISOString()

  const title = `${prefs.destination} · ${prefs.dates}`

  try {
    // 1. Ensure a Trip row exists
    const trip = await db.trip.upsert({
      where: { id: 'current' },
      create: {
        id: 'current',
        title,
        destination: prefs.destination,
        dates: prefs.dates,
        travellers: prefs.travellers,
        budget: prefs.budget,
        pace: prefs.pace,
        musts: prefs.musts,
        restrictions: prefs.restrictions || null,
      },
      update: {
        title,
        destination: prefs.destination,
        dates: prefs.dates,
        travellers: prefs.travellers,
        budget: prefs.budget,
        pace: prefs.pace,
        musts: prefs.musts,
        restrictions: prefs.restrictions || null,
      },
    })

    // 2. Call LLM
    console.log('[generate] Calling LLM for:', prefs.destination, prefs.dates)
    const newDays = await generateItineraryFromPreferences(prefs)
    console.log('[generate] LLM returned', newDays.length, 'days')

    // 3. Write days to DB
    await db.$transaction(async (tx) => {
      await tx.day.deleteMany({ where: { tripId: trip.id } })
      for (let i = 0; i < newDays.length; i++) {
        const d = newDays[i]
        const zone = lookupZone(d.zone)
        await tx.day.create({
          data: {
            tripId: trip.id,
            order: i,
            day: d.day || String(i + 1),
            zone: d.zone,
            title: d.title,
            image: zone.image,
            morning: d.morning,
            lunch: d.lunch,
            afternoon: d.afternoon,
            night: d.night,
            transport: d.transport,
            cost: d.cost,
            time: d.time,
            mapQuery: d.mapQuery,
            wazeQuery: d.wazeQuery,
            advice: d.advice,
            hotelName: emptyToNull(d.hotelName),
            hotelPrice: emptyToNull(d.hotelPrice),
            hotelLink: emptyToNull(d.hotelLink),
            mealLunchName: emptyToNull(d.mealLunchName),
            mealLunchPrice: emptyToNull(d.mealLunchPrice),
            mealLunchLink: emptyToNull(d.mealLunchLink),
            mealDinnerName: emptyToNull(d.mealDinnerName),
            mealDinnerPrice: emptyToNull(d.mealDinnerPrice),
            mealDinnerLink: emptyToNull(d.mealDinnerLink),
            coordsLat: zone.lat,
            coordsLng: zone.lng,
          },
        })
      }
    })

    // 4. Save to archive
    const budgetTag = classifyBudget(prefs.budget)
    const daySummaries = newDays.map((d) => ({
      day: d.day,
      zone: d.zone,
      title: d.title,
      cost: d.cost,
    }))
    await db.savedItinerary.create({
      data: {
        title,
        destination: prefs.destination,
        dates: prefs.dates,
        travellers: prefs.travellers,
        budget: prefs.budget,
        budgetTag,
        pace: prefs.pace,
        musts: prefs.musts,
        restrictions: prefs.restrictions || null,
        daysCount: newDays.length,
        dayData: JSON.stringify(daySummaries),
      },
    })

    job.status = 'done'
    job.result = JSON.stringify({
      success: true,
      message: `Itinerario generado con ${newDays.length} días`,
      daysAdded: newDays.length,
    } as GenerateResult)
  } catch (err) {
    console.error('[generate] Generation failed:', err)
    job.status = 'error'
    job.result = JSON.stringify({
      success: false,
      message: err instanceof Error ? err.message : 'No se pudo generar el itinerario. Inténtalo de nuevo.',
      daysAdded: 0,
    } as GenerateResult)
  }
  job.updatedAt = new Date().toISOString()
}