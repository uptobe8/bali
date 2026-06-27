import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hydrateStoredDays, optionByTag } from '@/lib/server/itinerary-options'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const option = await db.savedItinerary.findUnique({ where: { id } })
    if (!option) {
      return NextResponse.json({ error: 'Opción no encontrada' }, { status: 404 })
    }

    const level = optionByTag(option.budgetTag)
    const title = `${option.destination} · ${option.dates} · ${level.label}`

    const trip = await db.trip.upsert({
      where: { id: 'current' },
      create: {
        id: 'current',
        title,
        destination: option.destination,
        dates: option.dates,
        travellers: option.travellers,
        budget: level.label,
        pace: option.pace,
        musts: option.musts,
        restrictions: option.restrictions || null,
      },
      update: {
        title,
        destination: option.destination,
        dates: option.dates,
        travellers: option.travellers,
        budget: level.label,
        pace: option.pace,
        musts: option.musts,
        restrictions: option.restrictions || null,
      },
    })

    const days = hydrateStoredDays(option.dayData, trip.id)
    await db.$transaction(async (tx) => {
      await tx.day.deleteMany({ where: { tripId: trip.id } })
      for (const day of days) {
        await tx.day.create({ data: day })
      }
    })

    return NextResponse.json({
      success: true,
      message: `${level.label} activada como itinerario principal`,
      daysAdded: days.length,
    })
  } catch (err) {
    console.error('[POST /api/itinerary-options/[id]/activate] error', err)
    return NextResponse.json({ error: 'No se pudo activar la opción' }, { status: 500 })
  }
}
