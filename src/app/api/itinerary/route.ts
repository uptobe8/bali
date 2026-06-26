import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { maybeDeleteUpload } from '@/lib/server/suggestions'

// GET /api/itinerary
// Returns the first (only) Trip with its Days ordered by `order` asc.
// If no Trip exists, returns { trip: null, days: [] } with status 200.
export async function GET() {
  try {
    const trip = await db.trip.findFirst({
      orderBy: { createdAt: 'asc' },
      include: {
        days: { orderBy: { order: 'asc' } },
      },
    })

    if (!trip) {
      return NextResponse.json({ trip: null, days: [] })
    }

    // Don't leak the Prisma relation name; flatten explicitly.
    return NextResponse.json({
      trip: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        dates: trip.dates,
        travellers: trip.travellers,
        budget: trip.budget,
        pace: trip.pace,
        musts: trip.musts,
        restrictions: trip.restrictions,
      },
      days: trip.days.map((d) => ({
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
      })),
    })
  } catch (err) {
    console.error('[GET /api/itinerary] error', err)
    return NextResponse.json({ error: 'No se pudo cargar el itinerario' }, { status: 500 })
  }
}

// DELETE /api/itinerary
// Resets the app to empty: deletes the first Trip and all its Days and
// Suggestions (cascade). Best-effort deletes uploaded suggestion files.
// Returns { ok: true }. Idempotent — returns ok even if no trip exists.
export async function DELETE() {
  try {
    const trip = await db.trip.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!trip) {
      return NextResponse.json({ ok: true })
    }
    // Best-effort: remove uploaded files tied to this trip's suggestions.
    const suggestions = await db.suggestion.findMany({
      where: { tripId: trip.id },
      select: { imageUrl: true, filePath: true },
    })
    await Promise.all(
      suggestions.flatMap((s) => [
        maybeDeleteUpload(s.imageUrl),
        maybeDeleteUpload(s.filePath),
      ]),
    )
    // Cascade delete (schema has onDelete: Cascade on Day & Suggestion).
    await db.trip.delete({ where: { id: trip.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/itinerary] error', err)
    return NextResponse.json({ error: 'No se pudo resetear el itinerario' }, { status: 500 })
  }
}
