// Server-only best-effort metadata extraction for any URL.
// Used by POST /api/suggestions (when only a `url` is provided) and by
// POST /api/suggestions/extract.  Never throws — always returns a result.

import type { SourceKind } from '@/lib/types'

export interface ExtractResult {
  title: string
  description: string
  imageUrl: string
  sourceKind: SourceKind
}

const FETCH_TIMEOUT_MS = 8000
const MAX_BYTES = 1_500_000 // 1.5 MB of HTML is plenty for OG tags

export function detectSourceKind(url: string): SourceKind {
  const u = url.toLowerCase()
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('booking.com')) return 'booking'
  if (u.includes('airbnb.')) return 'airbnb'
  if (u.includes('google.com/maps') || u.includes('maps.app.goo.gl') || u.includes('waze.com')) return 'googlemaps'
  return 'web'
}

function pickMeta(html: string, prop: string): string {
  // Match <meta property="og:..." content="..."> or <meta name="og:..." content="...">
  // case-insensitive, supports single/double quotes.
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*content=["']([^"']*)["']`,
    'i',
  )
  const m = html.match(re)
  if (m && m[1]) return m[1].trim()
  // Try content first, then property/name (some sites put content before property)
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`,
    'i',
  )
  const m2 = html.match(re2)
  if (m2 && m2[1]) return m2[1].trim()
  return ''
}

function pickTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (m && m[1]) return m[1].trim()
  return ''
}

function decodeEntities(s: string): string {
  if (!s) return s
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)))
}

function absoluteUrl(maybeUrl: string, baseUrl: string): string {
  if (!maybeUrl) return ''
  try {
    return new URL(maybeUrl, baseUrl).toString()
  } catch {
    return maybeUrl
  }
}

export async function extractUrlMetadata(url: string): Promise<ExtractResult> {
  const sourceKind = detectSourceKind(url)
  const empty: ExtractResult = { title: '', description: '', imageUrl: '', sourceKind }

  if (!url || !/^https?:\/\//i.test(url)) return empty

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    })
    if (!res.ok) return empty
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      // Not an HTML page — best-effort: title = URL, no description, no image.
      return { title: '', description: '', imageUrl: '', sourceKind }
    }
    // Stream the first MAX_BYTES only — avoids downloading huge pages.
    let html = ''
    if (res.body) {
      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let total = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        html += decoder.decode(value, { stream: true })
        if (total >= MAX_BYTES) {
          try { await reader.cancel() } catch { /* noop */ }
          break
        }
      }
      html += decoder.decode()
    } else {
      html = await res.text()
    }

    const ogTitle = pickMeta(html, 'og:title')
    const ogDesc = pickMeta(html, 'og:description')
    const ogImage = pickMeta(html, 'og:image')
    const ogImageSecure = pickMeta(html, 'og:image:secure_url')
    const twitterTitle = pickMeta(html, 'twitter:title')
    const twitterImage = pickMeta(html, 'twitter:image')
    const titleTag = pickTitle(html)

    const title = decodeEntities(ogTitle || twitterTitle || titleTag || '').trim()
    const description = decodeEntities(ogDesc || '').trim()
    let imageUrl = decodeEntities(ogImageSecure || ogImage || twitterImage || '').trim()
    if (imageUrl) imageUrl = absoluteUrl(imageUrl, url)

    return { title, description, imageUrl, sourceKind }
  } catch {
    return empty
  } finally {
    clearTimeout(timer)
  }
}
