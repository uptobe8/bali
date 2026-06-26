import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const region = searchParams.get('region') || ''
  const especie = searchParams.get('especie') || ''
  const busqueda = searchParams.get('busqueda') || ''

  const where: Record<string, unknown> = {}
  if (region) where.region = region
  if (especie) where.especie = especie
  if (busqueda) {
    where.OR = [
      { name: { contains: busqueda } },
      { description: { contains: busqueda } },
      { especie: { contains: busqueda } },
    ]
  }

  const fauna = await db.faunaActivity.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ fauna })
}