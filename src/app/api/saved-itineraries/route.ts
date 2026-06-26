import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const budgetTag = searchParams.get('budgetTag') || ''

  const where: Record<string, unknown> = {}
  if (budgetTag) where.budgetTag = budgetTag

  const itineraries = await db.savedItinerary.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ itineraries })
}