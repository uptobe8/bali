import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { OPTION_LEVELS, optionSummary } from '@/lib/server/itinerary-options'

export async function GET() {
  try {
    const trip = await db.trip.findUnique({ where: { id: 'current' } })
    if (!trip) return NextResponse.json({ options: [] })

    const rows = await db.savedItinerary.findMany({
      where: {
        destination: trip.destination,
        dates: trip.dates,
        travellers: trip.travellers,
        pace: trip.pace,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    const byTag = new Map<string, (typeof rows)[number]>()
    for (const row of rows) {
      const sameMusts = row.musts === trip.musts
      const sameRestrictions = (row.restrictions || null) === (trip.restrictions || null)
      const allowed = ['barato', 'medio', 'premium'].includes(row.budgetTag)
      if (sameMusts && sameRestrictions && allowed && !byTag.has(row.budgetTag)) {
        byTag.set(row.budgetTag, row)
      }
    }

    const options = []
    for (const level of OPTION_LEVELS) {
      const row = byTag.get(level.budgetTag)
      if (row) options.push(optionSummary(row))
    }

    return NextResponse.json({ options })
  } catch (err) {
    console.error('[GET /api/itinerary-options] error', err)
    return NextResponse.json({ error: 'No se pudieron cargar las opciones' }, { status: 500 })
  }
}
