import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureTrip } from '@/lib/server/suggestions'
import { lookupZone } from '@/lib/server/zones'
import {
  regenerateItineraryWithLlm,
  findAppliedDayIndex,
  type LlmDay,
} from '@/lib/server/llm-itinerary'
import type { Suggestion, Day, ApplyResult } from '@/lib/types'

// POST /api/suggestions/apply
// Input JSON: { suggestionIds: string[] }
// 1. Loads the selected suggestions and the current itinerary (trip + days).
// 2. Uses the z-ai-web-dev-sdk LLM (server-side) to regenerate the 16-day
//    itinerary incorporating the new suggestions.
// 3. Replaces all Day rows for the trip with the regenerated ones, filling
//    `image` and `coordsLat`/`coordsLng` from a server-side zone lookup.
// 4. Marks all selected suggestions as status = "applied" and sets
//    `appliedToDay` to the index of the first day that mentions them.
// 5. Returns ApplyResult.
export async function POST(request: Request) {
  let suggestionIds: string[] = []
  try {
    const body = await request.json().catch(() => ({}))
    const raw = (body && typeof body === 'object' ? (body as Record<string, unknown>).suggestionIds : null)
    if (Array.isArray(raw)) {
      suggestionIds = raw.filter((x): x is string => typeof x === 'string' && x.length > 0)
    }
  } catch {
    /* fall through to validation */
  }

  if (suggestionIds.length === 0) {
    return NextResponse.json(
      { error: 'Debes enviar al menos un id en "suggestionIds"' },
      { status: 400 },
    )
  }

  try {
    const trip = await ensureTrip()
    const [selectedRows, currentDays] = await Promise.all([
      db.suggestion.findMany({ where: { id: { in: suggestionIds } } }),
      db.day.findMany({ where: { tripId: trip.id }, orderBy: { order: 'asc' } }),
    ])

    if (selectedRows.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron las sugerencias indicadas' },
        { status: 404 },
      )
    }

    // Map Prisma rows → typed plain objects for the LLM helper.
    const selected: Suggestion[] = selectedRows.map((s) => ({
      id: s.id,
      tripId: s.tripId,
      type: s.type as Suggestion['type'],
      title: s.title,
      note: s.note,
      url: s.url,
      author: s.author,
      imageUrl: s.imageUrl,
      filePath: s.filePath,
      sourceKind: s.sourceKind,
      status: s.status as Suggestion['status'],
      appliedToDay: s.appliedToDay,
      coordsLat: s.coordsLat,
      coordsLng: s.coordsLng,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }))
    const days: Day[] = currentDays.map((d) => ({
      id: d.id,
      tripId: d.tripId,
      order: d.order,
      day: d.day,
      zone: d.zone,
      title: d.title,
      image: d.image,
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
      hotelName: d.hotelName,
      hotelPrice: d.hotelPrice,
      hotelLink: d.hotelLink,
      mealLunchName: d.mealLunchName,
      mealLunchPrice: d.mealLunchPrice,
      mealLunchLink: d.mealLunchLink,
      mealDinnerName: d.mealDinnerName,
      mealDinnerPrice: d.mealDinnerPrice,
      mealDinnerLink: d.mealDinnerLink,
      coordsLat: d.coordsLat,
      coordsLng: d.coordsLng,
    }))

    // --- LLM regeneration ---
    let newDays: LlmDay[]
    try {
      newDays = await regenerateItineraryWithLlm(days, selected, {
        destination: trip.destination,
        dates: trip.dates,
        travellers: trip.travellers,
        budget: trip.budget,
        pace: trip.pace,
        musts: trip.musts,
        restrictions: trip.restrictions,
      })
    } catch (err) {
      console.error('[POST /api/suggestions/apply] LLM regeneration failed:', err)
      // Fallback: mark suggestions applied, keep the itinerary unchanged.
      await db.suggestion.updateMany({
        where: { id: { in: selected.map((s) => s.id) } },
        data: { status: 'applied' },
      })
      const fallback: ApplyResult = {
        success: true,
        message:
          'Sugerencias marcadas como aplicadas. El itinerario no se ha regenerado esta vez.',
        applied: selected.length,
        daysAdded: 0,
      }
      return NextResponse.json(fallback)
    }

    // --- Replace all Day rows for the trip ---
    // We delete and recreate so the order/contents are exactly what the LLM
    // produced.  All within a transaction.
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

    // --- Mark suggestions as applied + best-effort appliedToDay ---
    await Promise.all(
      selected.map(async (s) => {
        let appliedToDay: number | null = null
        for (const d of newDays) {
          const idx = findAppliedDayIndex(d, s)
          if (idx !== null) {
            appliedToDay = idx
            break
          }
        }
        await db.suggestion.update({
          where: { id: s.id },
          data: { status: 'applied', appliedToDay },
        })
      }),
    )

    const result: ApplyResult = {
      success: true,
      message: `Itinerario regenerado con ${selected.length} sugerencia${selected.length === 1 ? '' : 's'} aplicada${selected.length === 1 ? '' : 's'}`,
      applied: selected.length,
      daysAdded: newDays.length,
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('[POST /api/suggestions/apply] error', err)
    return NextResponse.json(
      { error: 'No se pudo aplicar las sugerencias al itinerario' },
      { status: 500 },
    )
  }
}

function emptyToNull(s: string): string | null {
  return s && s.trim() ? s : null
}
