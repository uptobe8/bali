import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guide
// Returns all GuideEntry rows ordered by `category` then `order`.
export async function GET() {
  try {
    const entries = await db.guideEntry.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })
    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        category: e.category,
        zone: e.zone,
        title: e.title,
        text: e.text,
        price: e.price,
        time: e.time,
        link: e.link,
        wazeQuery: e.wazeQuery,
        image: e.image,
        order: e.order,
      })),
    })
  } catch (err) {
    console.error('[GET /api/guide] error', err)
    return NextResponse.json({ error: 'No se pudo cargar la guía' }, { status: 500 })
  }
}
