import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const region = searchParams.get('region') || ''
  const subzona = searchParams.get('subzona') || ''
  const perfil = searchParams.get('perfil') || ''
  const busqueda = searchParams.get('busqueda') || ''

  const where: Record<string, unknown> = {}
  if (region) where.region = region
  if (subzona) where.subzone = subzona
  if (perfil) where.perfilPlaya = perfil
  if (busqueda) {
    where.OR = [
      { name: { contains: busqueda } },
      { descripcion: { contains: busqueda } },
      { caracteristicas: { contains: busqueda } },
    ]
  }

  const playas = await db.playa.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({ playas })
}