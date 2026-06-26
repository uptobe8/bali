import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const region = searchParams.get('region') || ''
  const categoria = searchParams.get('categoria') || ''
  const dificultad = searchParams.get('dificultad') || ''
  const busqueda = searchParams.get('busqueda') || ''

  const where: Record<string, unknown> = {}
  if (region) where.region = region
  if (categoria) where.category = categoria
  if (dificultad) where.difficulty = dificultad
  if (busqueda) {
    where.OR = [
      { name: { contains: busqueda } },
      { description: { contains: busqueda } },
      { category: { contains: busqueda } },
    ]
  }

  const activities = await db.activity.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ activities })
}