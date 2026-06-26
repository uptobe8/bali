import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  coerceType,
  coerceStatus,
  coerceSourceKind,
  coerceNumber,
  coerceString,
  maybeDeleteUpload,
} from '@/lib/server/suggestions'

// PATCH /api/suggestions/[id]
// Accepts JSON with any subset of: type, title, note, url, author, sourceKind,
// status, appliedToDay, coordsLat, coordsLng, imageUrl, filePath.
// Returns the updated suggestion, or 404 if not found.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const existing = await db.suggestion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 })
    }

    let body: Record<string, unknown> = {}
    try {
      const parsed = await request.json()
      if (parsed && typeof parsed === 'object') {
        body = parsed as Record<string, unknown>
      }
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}

    if ('type' in body) {
      const t = coerceType(body.type, 'other')
      data.type = t
    }
    if ('title' in body) {
      const title = coerceString(body.title)
      if (title === null) {
        return NextResponse.json({ error: 'El título no puede estar vacío' }, { status: 400 })
      }
      data.title = title
    }
    if ('note' in body) data.note = coerceString(body.note)
    if ('url' in body) data.url = coerceString(body.url)
    if ('sourceKind' in body) {
      const sk = coerceSourceKind(body.sourceKind)
      data.sourceKind = sk ?? null
    }
    if ('status' in body) {
      const st = coerceStatus(body.status)
      if (!st) {
        return NextResponse.json(
          { error: 'Estado no válido (esperado: pending | applied | rejected)' },
          { status: 400 },
        )
      }
      data.status = st
    }
    if ('appliedToDay' in body) {
      const v = body.appliedToDay
      if (v === null) {
        data.appliedToDay = null
      } else {
        const n = coerceNumber(v)
        data.appliedToDay = n ?? null
      }
    }
    if ('coordsLat' in body) {
      data.coordsLat = body.coordsLat === null ? null : coerceNumber(body.coordsLat) ?? null
    }
    if ('coordsLng' in body) {
      data.coordsLng = body.coordsLng === null ? null : coerceNumber(body.coordsLng) ?? null
    }
    if ('imageUrl' in body) {
      data.imageUrl = body.imageUrl === null ? null : coerceString(body.imageUrl)
    }
    if ('filePath' in body) {
      data.filePath = body.filePath === null ? null : coerceString(body.filePath)
    }

    const updated = await db.suggestion.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      suggestion: {
        id: updated.id,
        tripId: updated.tripId,
        type: updated.type,
        title: updated.title,
        note: updated.note,
        url: updated.url,
        author: updated.author,
        imageUrl: updated.imageUrl,
        filePath: updated.filePath,
        sourceKind: updated.sourceKind,
        status: updated.status,
        appliedToDay: updated.appliedToDay,
        coordsLat: updated.coordsLat,
        coordsLng: updated.coordsLng,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (err) {
    console.error('[PATCH /api/suggestions/[id]] error', err)
    return NextResponse.json({ error: 'No se pudo actualizar la sugerencia' }, { status: 500 })
  }
}

// DELETE /api/suggestions/[id]
// Removes the row and also deletes any uploaded file under /uploads/.
// Returns { ok: true } or 404 if not found.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const existing = await db.suggestion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 })
    }

    await db.suggestion.delete({ where: { id } })

    // Best-effort cleanup of any uploaded file.
    await maybeDeleteUpload(existing.imageUrl)
    await maybeDeleteUpload(existing.filePath)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/suggestions/[id]] error', err)
    return NextResponse.json({ error: 'No se pudo eliminar la sugerencia' }, { status: 500 })
  }
}
