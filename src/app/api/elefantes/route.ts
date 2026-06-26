import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const region = searchParams.get('region') || ''
  const dificultad = searchParams.get('dificultad') || ''
  const busqueda = searchParams.get('busqueda') || ''

  const where: Record<string, unknown> = {}
  if (region) where.region = region
  if (dificultad) where.dificultad = dificultad
  if (busqueda) {
    where.OR = [
      { name: { contains: busqueda } },
      { description: { contains: busqueda } },
    ]
  }

  const elephants = await db.elephantActivity.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ elephants })
}