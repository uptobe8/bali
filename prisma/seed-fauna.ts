import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Simple CSV/TSV parser for the XLSX data exported as JSONL
interface RawRow {
  id: number
  zona: string
  subzona: string
  actividad: string
  lugar_base: string
  slug: string
  categoria_fauna: string
  fauna_objetivo: string
  experiencia_app: string
  precio_orientativo_idr: string
  precio_tipo: string
  duracion_orientativa: string
  mejor_epoca: string
  mejor_hora: string
  acceso_logistica: string
  geo_query: string
  google_maps_url: string
  latitud_aprox: number | null
  longitud_aprox: number | null
  consejos_operativos: string
  seguridad_riesgos: string
  apto_ninos: string
  etica_animal: string
  prioridad_app: string
  estado_verificacion: string
  source_url: string
  source_key: string
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

function fotoForSlug(slug: string): { foto1: string; foto2: string; foto3: string } {
  return {
    foto1: `/fauna/${slug}-01.jpg`,
    foto2: `/fauna/${slug}-02.jpg`,
    foto3: `/fauna/${slug}-03.jpg`,
  }
}

function ratingFromPrioridad(p: string): number {
  if (p.includes('Muy alta')) return 4.8
  if (p.includes('Alta')) return 4.5
  if (p.includes('Media')) return 4.2
  if (p.includes('Baja')) return 4.0
  return 4.3
}

function difficultyFromCategoria(cat: string): string {
  const c = cat.toLowerCase()
  if (c.includes('buceo') || c.includes('cueva') || c.includes('safari')) return 'Medio'
  if (c.includes('parque nacional') || c.includes('selva')) return 'Medio'
  if (c.includes('nocturna') || c.includes('remoto') || c.includes('cavernicola')) return 'Difícil'
  return 'Fácil'
}

async function main() {
  // Read the JSONL export
  const jsonl = readFileSync('upload/fauna_rows.jsonl', 'utf-8').trim()
  const rows: RawRow[] = jsonl.split('\n').map(line => JSON.parse(line))

  console.log(`Processing ${rows.length} fauna items from XLSX...`)

  // Clear existing
  await db.faunaActivity.deleteMany()

  let created = 0
  for (const r of rows) {
    const region = zonaToRegion(r.zona)
    const zone = zonaToZone(r.zona)
    const subzone = subzonaClean(r.subzona)
    const fotos = fotoForSlug(r.slug)

    await db.faunaActivity.create({
      data: {
        order: r.id,
        name: r.actividad,
        zone,
        subzone,
        region,
        description: r.experiencia_app || '',
        tipoActividad: r.categoria_fauna || '',
        dificultad: difficultyFromCategoria(r.categoria_fauna || ''),
        duracion: r.duracion_orientativa || '',
        mejorEpoca: r.mejor_epoca || '',
        queVer: r.fauna_objetivo || '',
        peligro: r.seguridad_riesgos || '',
        especie: r.fauna_objetivo?.split('/')[0]?.split(',')[0]?.trim() || r.categoria_fauna || '',
        familia: r.categoria_fauna || '',
        address: r.lugar_base || '',
        lat: r.latitud_aprox ?? null,
        lng: r.longitud_aprox ?? null,
        wazeUrl: r.google_maps_url || '',
        webUrl: r.source_url || '',
        foto1: fotos.foto1,
        foto2: fotos.foto2,
        foto3: fotos.foto3,
        rating: ratingFromPrioridad(r.prioridad_app || 'Media'),
      },
    })
    created++
    if (created % 15 === 0) console.log(`  ... ${created}/${rows.length}`)
  }

  console.log(`\nDone! ${created} fauna activities seeded with photos.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())