// Server-only helpers for the Suggestions API: file handling, type coercion,
// and a tiny "ensure trip" helper so POST /api/suggestions can create a
// Suggestion even when the database is empty.

import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import type { SuggestionType, SourceKind } from '@/lib/types'
import { db } from '@/lib/db'

export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
export const UPLOAD_PUBLIC_PREFIX = '/uploads/'
export const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15 MB

export const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])
export const DOC_EXT = new Set(['pdf', 'txt', 'doc', 'docx'])
export const IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])
export const DOC_MIME = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const VALID_TYPES: SuggestionType[] = [
  'link',
  'hotel',
  'activity',
  'restaurant',
  'beach',
  'place',
  'photo',
  'doc',
  'other',
]
const VALID_AUTHORS = new Set(['Iria', 'Izan'])
const VALID_STATUSES = new Set(['pending', 'applied', 'rejected'])
const VALID_SOURCE_KINDS: SourceKind[] = [
  'instagram',
  'booking',
  'airbnb',
  'googlemaps',
  'web',
  'upload',
  'manual',
]

export function coerceType(value: unknown, fallback: SuggestionType = 'other'): SuggestionType {
  if (typeof value !== 'string') return fallback
  return (VALID_TYPES as string[]).includes(value) ? (value as SuggestionType) : fallback
}

export function coerceAuthor(value: unknown): 'Iria' | 'Izan' {
  if (typeof value === 'string' && VALID_AUTHORS.has(value)) return value as 'Iria' | 'Izan'
  return 'Iria'
}

export function coerceStatus(value: unknown): string | undefined {
  if (typeof value === 'string' && VALID_STATUSES.has(value)) return value
  return undefined
}

export function coerceSourceKind(value: unknown): SourceKind | undefined {
  if (typeof value !== 'string') return undefined
  return (VALID_SOURCE_KINDS as string[]).includes(value) ? (value as SourceKind) : undefined
}

export function coerceNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function coerceString(value: unknown, maxLength = 4000): string | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (!s) return null
  return s.length > maxLength ? s.slice(0, maxLength) : s
}

export function extFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  }
  return map[mime] || null
}

export function extFromName(name: string): string | null {
  const m = name.toLowerCase().match(/\.([a-z0-9]{2,4})$/)
  if (!m) return null
  const ext = m[1]
  if (IMAGE_EXT.has(ext) || DOC_EXT.has(ext)) return ext
  return null
}

export interface UploadedFile {
  /** Public path served by Next.js, e.g. "/uploads/abc.jpg" */
  publicPath: string
  /** Absolute path on disk */
  absPath: string
  /** Final extension (without dot) */
  ext: string
  /** true if it's an image, false if it's a document */
  isImage: boolean
}

/**
 * Saves a File/Blob to /public/uploads/<cuid>.<ext> and returns its metadata.
 * Throws an Error with a useful message if the file is invalid or too large.
 */
export async function saveUpload(file: File): Promise<UploadedFile> {
  if (!file || file.size === 0) throw new Error('Archivo vacío')
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Archivo demasiado grande (máx ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB)`)
  }

  const mime = (file.type || '').toLowerCase()
  const name = file.name || 'upload'
  let ext = extFromMime(mime)
  if (!ext) ext = extFromName(name)
  if (!ext) throw new Error('Tipo de archivo no soportado')

  const isImage = IMAGE_EXT.has(ext)
  const isDoc = DOC_EXT.has(ext)
  if (!isImage && !isDoc) throw new Error('Tipo de archivo no soportado')

  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  // Use a hash + timestamp so duplicate uploads don't collide but are still
  // reproducible-ish. We avoid pulling in `cuid` to keep deps unchanged.
  const buf = Buffer.from(await file.arrayBuffer())
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 18)
  const filename = `${Date.now()}-${hash}.${ext}`
  const absPath = path.join(UPLOAD_DIR, filename)
  await fs.writeFile(absPath, buf)

  return {
    publicPath: `${UPLOAD_PUBLIC_PREFIX}${filename}`,
    absPath,
    ext,
    isImage,
  }
}

/**
 * Removes a file from disk if its public path is inside our /uploads/ dir.
 * Used by DELETE /api/suggestions/[id]. Best-effort: never throws.
 */
export async function maybeDeleteUpload(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath) return
  if (!publicPath.startsWith(UPLOAD_PUBLIC_PREFIX)) return
  const filename = publicPath.slice(UPLOAD_PUBLIC_PREFIX.length)
  if (!filename || filename.includes('..') || filename.includes('/')) return
  const abs = path.join(UPLOAD_DIR, filename)
  try {
    await fs.unlink(abs)
  } catch {
    /* ignore: file may already be gone */
  }
}

/**
 * Returns the first Trip, or creates a minimal placeholder if none exists.
 * The app starts EMPTY: the user generates their real itinerary from the
 * planner form on Inicio. This is only a safety net so suggestion creation
 * doesn't crash if the DB is empty — the frontend blocks the flow when no
 * real trip exists.
 */
export async function ensureTrip() {
  const existing = await db.trip.findFirst({ orderBy: { createdAt: 'asc' } })
  if (existing) return existing
  return db.trip.create({
    data: {
      title: 'Borrador — genera tu itinerario en Inicio',
      destination: 'Por definir',
      dates: '',
      travellers: '',
      budget: '',
      pace: '',
      musts: '',
      restrictions: null,
    },
  })
}
