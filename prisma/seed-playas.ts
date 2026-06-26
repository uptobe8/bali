import { readFileSync, existsSync, readdirSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface RawRow {
  id: number
  zona_principal: string
  subzona: string
  playa: string
  slug: string
  area: string
  tipo_caracteristicas: string
  mejor_hora: string
  bano: string
  acceso: string
  precio_entrada_2026: string
  seguridad_riesgos: string
  consejos_app: string
  geo_query_para_app: string
  google_maps_url: string
  latitud: number | null
  longitud: number | null
  geo_estado: string
  foto_1: string
  foto_2: string
  foto_3: string
  verificacion_precio: string
  prioridad_app: string
  perfil_recomendado: string
  notas_fuente: string
}

function zonaToRegion(zona: string): string {
  if (zona.includes('Bali')) return 'Bali'
  if (zona.includes('Java')) return 'Java'
  if (zona.includes('Komodo') || zona.includes('Flores')) return 'Komodo y Flores'
  if (zona.includes('Borneo') || zona.includes('Sumatra')) return 'Borneo y Sumatra'
  if (zona.includes('Sulawesi') || zona.includes('Raja Ampat')) return 'Sulawesi y Raja Ampat'
  if (zona.includes('Gili') || zona.includes('Nusa Penida')) return 'Gili y Nusa Penida'
  return 'Bali'
}

function zonaToZone(zona: string): string {
  return zona.split(':')[0].replace(/^\d+\.\s*/, '').trim()
}

function subzonaClean(subzona: string): string {
  return subzona.replace(/^\d+\.\d+\s*/, '').trim()
}

// Fuzzy match slug to actual files in public/playas/
const playaFiles = readdirSync('public/playas/')

function findFoto(slug: string, suffix: string): string {
  // Exact match first
  const exact = `${slug}${suffix}`
  if (playaFiles.includes(exact)) return `/playas/${exact}`

  // Fuzzy: find any file starting with the slug prefix
  const matches = playaFiles.filter(f => f.startsWith(slug + '-') && f.endsWith(suffix))
  if (matches.length > 0) return `/playas/${matches[0]}`

  // Try matching by first 2-3 words of slug
  const words = slug.split('-').slice(0, 3).join('-')
  const fuzzy = playaFiles.filter(f => f.startsWith(words + '-') && f.endsWith(suffix))
  if (fuzzy.length > 0) return `/playas/${fuzzy[0]}`

  return ''
}

function prioridadToRating(p: string): number {
  const pl = p.toLowerCase()
  if (pl.includes('muy alta')) return 4.8
  if (pl.includes('alta')) return 4.6
  if (pl.includes('media')) return 4.3
  if (pl.includes('baja')) return 4.0
  return 4.3
}

async function main() {
  const raw = JSON.parse(readFileSync('upload/playas_data.json', 'utf-8')) as RawRow[]
  console.log(`Processing ${raw.length} playas...`)

  await db.playa.deleteMany()

  let created = 0
  let withPhotos = 0

  for (const r of raw) {
    const region = zonaToRegion(r.zona_principal)
    const zone = zonaToZone(r.zona_principal)
    const subzone = subzonaClean(r.subzona)

    const foto1 = findFoto(r.slug, '-01.jpg')
    const foto2 = findFoto(r.slug, '-02.jpg')
    const foto3 = findFoto(r.slug, '-03.jpg')

    if (foto1) withPhotos++

    await db.playa.create({
      data: {
        order: Number(r.id),
        name: r.playa,
        zone,
        subzone,
        region,
        ubicacion: r.area || '',
        descripcion: r.tipo_caracteristicas || '',
        mejorHora: r.mejor_hora || '',
        banio: r.bano || '',
        acceso: r.acceso || '',
        seguridad: r.seguridad_riesgos || '',
        caracteristicas: r.tipo_caracteristicas || '',
        area: r.area || '',
        consejos: r.consejos_app || '',
        prioridad: r.prioridad_app || 'media',
        perfilPlaya: r.perfil_recomendado || '',
        address: r.geo_query_para_app || '',
        lat: r.latitud ?? null,
        lng: r.longitud ?? null,
        wazeUrl: r.google_maps_url || '',
        googleMapsUrl: r.google_maps_url || '',
        foto1,
        foto2,
        foto3,
      },
    })
    created++
    if (created % 20 === 0) console.log(`  ... ${created}/${raw.length}`)
  }

  console.log(`\nDone! ${created} playas seeded.`)
  console.log(`With photos: ${withPhotos}/${created}`)
  console.log(`Without photos: ${created - withPhotos}/${created}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())