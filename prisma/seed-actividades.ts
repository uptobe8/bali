/**
 * seed-actividades.ts — Import 99 adventure activities from manifest
 * Photos: public/actividades/{zona-folder}/{subzona-folder}/{slug}/{slug}-01.jpg
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const db = new PrismaClient()

function zonaToRegion(zona: string): string {
  if (zona.includes('Bali')) return 'Bali'
  if (zona.includes('Java')) return 'Java'
  if (zona.includes('Komodo') || zona.includes('Flores')) return 'Komodo y Flores'
  if (zona.includes('Borneo') || zona.includes('Sumatra')) return 'Borneo y Sumatra'
  if (zona.includes('Sulawesi') || zona.includes('Raja Ampat')) return 'Sulawesi y Raja Ampat'
  if (zona.includes('Gili') || zona.includes('Nusa Penida')) return 'Gili y Nusa Penida'
  return zona
}

function prioridadToRating(p: string): number {
  const pl = p.toLowerCase()
  if (pl.includes('muy alta')) return 4.8
  if (pl.includes('alta')) return 4.5
  if (pl.includes('media-alta')) return 4.2
  if (pl.includes('media')) return 4.0
  if (pl.includes('baja-media')) return 3.7
  if (pl.includes('baja')) return 3.4
  return 4.0
}

function findPhotos(slug: string): string[] {
  const base = path.join(process.cwd(), 'public', 'actividades')
  // Recursively search for slug folder
  const fotos: string[] = []
  function search(dir: string, depth: number) {
    if (depth > 5) return
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === '__MACOSX' || entry.name.startsWith('.')) continue
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === slug) {
            // Found the slug folder - get jpgs
            const jpgs = fs.readdirSync(full).filter(f => f.endsWith('.jpg')).sort()
            for (const j of jpgs) {
              // Store as web-accessible path (relative to public/)
              const relPath = full.replace(base + '/', '')
              fotos.push(`/actividades/${relPath}/${j}`)
            }
            return
          }
          search(full, depth + 1)
        }
      }
    } catch {}
  }
  search(base, 0)
  return fotos
}

interface Row {
  id: string
  zona: string
  subzona: string
  actividad: string
  lugar_base: string
  slug: string
  categoria_aventura: string
  experiencia_app: string
  precio_orientativo_idr: string
  precio_tipo: string
  duracion_orientativa: string
  dificultad: string
  mejor_epoca: string
  mejor_hora: string
  acceso_logistica: string
  geo_query: string
  google_maps_url: string
  latitud_aprox: string
  longitud_aprox: string
  consejos_operativos: string
  seguridad_riesgos: string
  apto_ninos: string
  prioridad_app: string
  estado_verificacion: string
  fuente_tipo: string
  source_key: string
  source_url: string
}

async function main() {
  const lines = fs.readFileSync(path.join(process.cwd(), 'upload', 'actividades_rows.jsonl'), 'utf-8').trim().split('\n')
  const rows: Row[] = lines.map(l => JSON.parse(l))
  console.log(`Loaded ${rows.length} activities from manifest`)

  // Build photo index upfront
  const photoMap = new Map<string, string[]>()
  for (const row of rows) {
    const fotos = findPhotos(row.slug)
    if (fotos.length > 0) photoMap.set(row.slug, fotos)
  }
  console.log(`Found photos for ${photoMap.size} activities`)

  let created = 0
  for (const row of rows) {
    const fotos = photoMap.get(row.slug) || []
    const lat = row.latitud_aprox && !isNaN(parseFloat(row.latitud_aprox)) ? parseFloat(row.latitud_aprox) : null
    const lng = row.longitud_aprox && !isNaN(parseFloat(row.longitud_aprox)) ? parseFloat(row.longitud_aprox) : null

    await db.activity.create({
      data: {
        order: parseInt(row.id),
        name: row.actividad,
        slug: row.slug,
        zone: row.zona,
        subzone: row.subzona,
        region: zonaToRegion(row.zona),
        lugarBase: row.lugar_base,
        description: row.experiencia_app,
        duration: row.duracion_orientativa,
        difficulty: row.dificultad || 'Media',
        priceRange: row.precio_orientativo_idr,
        precioTipo: row.precio_tipo,
        category: row.categoria_aventura,
        mejorEpoca: row.mejor_epoca,
        mejorHora: row.mejor_hora,
        logistica: row.acceso_logistica,
        consejos: row.consejos_operativos,
        seguridad: row.seguridad_riesgos,
        aptoNinos: row.apto_ninos,
        prioridad: row.prioridad_app,
        estadoVerificacion: row.estado_verificacion,
        sourceKey: row.source_key,
        sourceUrl: row.source_url,
        address: row.geo_query,
        lat,
        lng,
        wazeUrl: row.geo_query ? `https://www.waze.com/ul?q=${encodeURIComponent(row.geo_query)}&navigate=yes` : '',
        webUrl: row.google_maps_url,
        imageUrl1: fotos[0] || '',
        imageUrl2: fotos[1] || '',
        imageUrl3: fotos[2] || '',
        imageUrl4: fotos[3] || '',
        rating: prioridadToRating(row.prioridad_app),
      },
    })
    created++
    if (created % 20 === 0) console.log(`  ${created}/${rows.length}...`)
  }

  console.log(`\nDone! Seeded ${created} activities.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())