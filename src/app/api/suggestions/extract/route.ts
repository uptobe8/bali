import { NextResponse } from 'next/server'
import { extractUrlMetadata } from '@/lib/server/extractor'

// POST /api/suggestions/extract
// Input JSON: { url: string }
// Best-effort metadata extraction for any URL (Instagram, Booking, Airbnb,
// Google Maps, generic web page). Never throws — always returns 200 with a
// result object (possibly empty fields).
export async function POST(request: Request) {
  let url = ''
  try {
    const body = await request.json().catch(() => ({}))
    if (body && typeof body === 'object' && typeof (body as Record<string, unknown>).url === 'string') {
      url = ((body as Record<string, unknown>).url as string).trim()
    }
  } catch {
    /* fall through to validation below */
  }

  if (!url) {
    return NextResponse.json(
      { error: 'Falta el campo "url"' },
      { status: 400 },
    )
  }
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: 'La URL debe empezar por http:// o https://' },
      { status: 400 },
    )
  }

  try {
    const meta = await extractUrlMetadata(url)
    return NextResponse.json({
      title: meta.title,
      description: meta.description,
      imageUrl: meta.imageUrl,
      sourceKind: meta.sourceKind,
    })
  } catch (err) {
    // Per the contract: never throw — return an empty result with 200.
    console.error('[POST /api/suggestions/extract] error', err)
    return NextResponse.json({
      title: '',
      description: '',
      imageUrl: '',
      sourceKind: 'web',
    })
  }
}
