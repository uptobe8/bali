import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const zona = searchParams.get('zona') || ''
  const tipo = searchParams.get('tipo') || ''
  const precio = searchParams.get('precio') || ''
  const busqueda = searchParams.get('busqueda') || ''

  const where: Record<string, unknown> = {}
  if (zona) where.region = zona
  if (tipo) where.type = tipo
  if (precio) where.priceLevel = parseInt(precio)
  if (busqueda) {
    where.OR = [
      { name: { contains: busqueda } },
      { description: { contains: busqueda } },
      { signatureDish: { contains: busqueda } },
      { cuisine: { contains: busqueda } },
    ]
  }

  const restaurants = await db.gastronomyRestaurant.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ restaurants })
}