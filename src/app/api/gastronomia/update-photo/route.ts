import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, imageUrl } = await req.json()
    if (!name || !imageUrl) {
      return NextResponse.json({ error: 'name and imageUrl required' }, { status: 400 })
    }
    const updated = await db.gastronomyRestaurant.updateMany({
      where: { name },
      data: { imageUrl }
    })
    return NextResponse.json({ ok: true, count: updated.count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}