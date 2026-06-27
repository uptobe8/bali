import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateItineraryFromPreferences } from '@/lib/server/llm-itinerary'
import { OPTION_LEVELS, buildOptionDays } from '@/lib/server/itinerary-options'
import type { PlanPreferences, GenerateResult } from '@/lib/types'

interface GenerationJob {
  id: string
  status: 'pending' | 'generating' | 'done' | 'error'
  result: string | null
  createdAt: string
  updatedAt: string
}

const activeJobs = new Map<string, GenerationJob>()

function getJobKey(): string {
  return 'current'
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
    return NextResponse.json({ error: 'Cuerpo de la petición inválido' }, { status: 400 })
  }

  if (!prefs.destination || !prefs.dates) {
    return NextResponse.json({ error: 'Indica al menos el destino y las fechas del viaje' }, { status: 400 })
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

export async function GET() {
  const key = getJobKey()
  const job = activeJobs.get(key)
  if (!job) return NextResponse.json({ status: 'idle' })
  const result = job.result ? JSON.parse(job.result) : null
  return NextResponse.json({ status: job.status, result })
}

async function runGeneration(prefs: PlanPreferences, jobKey: string): Promise<void> {
  const job = activeJobs.get(jobKey)
  if (!job) return

  job.status = 'generating'
  job.updatedAt = new Date().toISOString()

  const baseTitle = `${prefs.destination} · ${prefs.dates}`

  try {
    const trip = await db.trip.upsert({
      where: { id: 'current' },
      create: {
        id: 'current',
        title: `${baseTitle} · elige versión`,
        destination: prefs.destination,
        dates: prefs.dates,
        travellers: prefs.travellers,
        budget: 'Pendiente de elegir opción',
        pace: prefs.pace,
        musts: prefs.musts,
        restrictions: prefs.restrictions || null,
      },
      update: {
        title: `${baseTitle} · elige versión`,
        destination: prefs.destination,
        dates: prefs.dates,
        travellers: prefs.travellers,
        budget: 'Pendiente de elegir opción',
        pace: prefs.pace,
        musts: prefs.musts,
        restrictions: prefs.restrictions || null,
      },
    })

    console.log('[generate] Calling LLM once for base route:', prefs.destination, prefs.dates)
    const baseDays = await generateItineraryFromPreferences(prefs)
    console.log('[generate] LLM returned', baseDays.length, 'base days')

    await db.$transaction(async (tx) => {
      await tx.day.deleteMany({ where: { tripId: trip.id } })
      for (const level of OPTION_LEVELS) {
        const days = buildOptionDays(baseDays, level)
        await tx.savedItinerary.create({
          data: {
            title: `${baseTitle} · ${level.label}`,
            destination: prefs.destination,
            dates: prefs.dates,
            travellers: prefs.travellers,
            budget: level.label,
            budgetTag: level.budgetTag,
            pace: prefs.pace,
            musts: prefs.musts,
            restrictions: prefs.restrictions || null,
            daysCount: days.length,
            dayData: JSON.stringify(days),
          },
        })
      }
    })

    job.status = 'done'
    job.result = JSON.stringify({
      success: true,
      message: `Se han generado 3 versiones: económica, media y premium. Elige una para cargarla como itinerario activo.`,
      daysAdded: 0,
      optionsCreated: 3,
    } as GenerateResult & { optionsCreated: number })
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
