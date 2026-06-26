import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  ensureTrip,
  coerceType,
  coerceAuthor,
  coerceSourceKind,
  coerceNumber,
  coerceString,
  saveUpload,
  MAX_FILE_BYTES,
} from '@/lib/server/suggestions'
import { extractUrlMetadata } from '@/lib/server/extractor'
import type { SuggestionType } from '@/lib/types'

// GET /api/suggestions
// Returns all Suggestion rows ordered by `createdAt` desc.
export async function GET() {
  try {
    const suggestions = await db.suggestion.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        id: s.id,
        tripId: s.tripId,
        type: s.type,
        title: s.title,
        note: s.note,
        url: s.url,
        author: s.author,
        imageUrl: s.imageUrl,
        filePath: s.filePath,
        sourceKind: s.sourceKind,
        status: s.status,
        appliedToDay: s.appliedToDay,
        coordsLat: s.coordsLat,
        coordsLng: s.coordsLng,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('[GET /api/suggestions] error', err)
    return NextResponse.json({ error: 'No se pudieron cargar las sugerencias' }, { status: 500 })
  }
}

function mapSuggestion(s: Awaited<ReturnType<typeof db.suggestion.create>>) {
  return {
    id: s.id,
    tripId: s.tripId,
    type: s.type,
    title: s.title,
    note: s.note,
    url: s.url,
    author: s.author,
    imageUrl: s.imageUrl,
    filePath: s.filePath,
    sourceKind: s.sourceKind,
    status: s.status,
    appliedToDay: s.appliedToDay,
    coordsLat: s.coordsLat,
    coordsLng: s.coordsLng,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

// POST /api/suggestions
// Accept multipart/form-data (with optional file) OR application/json.
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    const trip = await ensureTrip()

    let fields: Record<string, string> = {}
    let file: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      for (const [key, value] of form.entries()) {
        if (typeof value === 'string') {
          fields[key] = value
        } else if (value instanceof File) {
          // Only keep the first file we see.
          if (!file) file = value
        }
      }
    } else if (contentType.includes('application/json')) {
      try {
        const body = await request.json()
        if (body && typeof body === 'object') {
          for (const [k, v] of Object.entries(body)) {
            fields[k] = v === null || v === undefined ? '' : String(v)
          }
        }
      } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
      }
    } else {
      return NextResponse.json(
        { error: 'Content-Type no soportado. Usa multipart/form-data o application/json.' },
        { status: 400 },
      )
    }

    // Quick pre-check on size for JSON-less requests we can't measure, but for
    // multipart the File.size is authoritative and saveUpload() enforces it.
    if (file && file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Archivo demasiado grande (máx ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB)` },
        { status: 413 },
      )
    }

    const clientType = coerceType(fields.type, 'other')
    const author = coerceAuthor(fields.author)
    const note = coerceString(fields.note)
    const url = coerceString(fields.url)
    const coordsLat = coerceNumber(fields.coordsLat)
    const coordsLng = coerceNumber(fields.coordsLng)
    let clientSourceKind = coerceSourceKind(fields.sourceKind)

    let title = (fields.title || '').trim()
    let imageUrl: string | null = null
    let filePath: string | null = null
    let type: SuggestionType = clientType
    let sourceKind: string | null = clientSourceKind ?? null

    // --- File upload branch ---
    if (file) {
      let uploaded
      try {
        uploaded = await saveUpload(file)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'No se pudo guardar el archivo'
        const status = msg.includes('grande') ? 413 : 400
        return NextResponse.json({ error: msg }, { status })
      }
      if (uploaded.isImage) {
        imageUrl = uploaded.publicPath
        if (type === 'other') type = 'photo'
      } else {
        filePath = uploaded.publicPath
        if (type === 'other') type = 'doc'
      }
      if (!sourceKind) sourceKind = 'upload'
      // If the client didn't send a title, fall back to the original filename.
      if (!title) title = file.name || (uploaded.isImage ? 'Foto subida' : 'Documento subido')
    } else if (url) {
      // --- URL-only branch: best-effort metadata extraction ---
      if (!sourceKind || sourceKind !== 'upload') {
        try {
          const meta = await extractUrlMetadata(url)
          if (!title && meta.title) title = meta.title
          if (!imageUrl && meta.imageUrl) imageUrl = meta.imageUrl
          if (!sourceKind) sourceKind = meta.sourceKind
        } catch {
          /* ignore — extraction is best-effort */
        }
      }
      if (type === 'other') type = 'link'
    }

    if (!title) {
      title = url ? 'Sugerencia' : 'Sugerencia sin título'
    }

    const created = await db.suggestion.create({
      data: {
        tripId: trip.id,
        type,
        title,
        note,
        url,
        author,
        imageUrl,
        filePath,
        sourceKind,
        status: 'pending',
        coordsLat: coordsLat ?? null,
        coordsLng: coordsLng ?? null,
      },
    })

    return NextResponse.json({ suggestion: mapSuggestion(created) }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/suggestions] error', err)
    return NextResponse.json({ error: 'No se pudo crear la sugerencia' }, { status: 500 })
  }
}
