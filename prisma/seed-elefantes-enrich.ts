/**
 * seed-elefantes-enrich.ts
 * Enriches existing 27 elephant records with manifest ficha data
 * and adds any NEW viable items from the manifest that don't exist yet.
 * Does NOT delete existing records.
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const db = new PrismaClient()

interface ManifestItem {
  id: number
  zona: string
  subzona: string
  actividad_tour: string
  slug: string
  lugar_base: string
  tipo_actividad: string
  experiencia_que_vera_usuario: string
  precio_estimado_1_dia_idr: string
  precio_estimado_2_dias_idr: string
  precio_estimado_3_dias_idr: string
  precio_según_fecha: string
  duracion_orientativa: string
  mejor_hora: string
  logistica_acceso: string
  geo_query: string
  google_maps_url: string
  latitud_aprox: string
  longitud_aprox: string
  nivel_turismo: string
  nivel_respeto_animales: string
  nivel_contacto: string
  filtro_app_resumen: string
  opinion_viajeros_positiva: string
  opinion_viajeros_negativa: string
  consejos_operativos: string
  riesgos_y_alertas: string
  recomendacion_para_app: string
  source_url: string
  estado_verificacion: string
}

function zonaToRegion(zona: string): string {
  if (zona.includes('Bali')) return 'Bali'
  if (zona.includes('Java')) return 'Java'
  if (zona.includes('Komodo') || zona.includes('Flores')) return 'Komodo y Flores'
  if (zona.includes('Borneo') || zona.includes('Sumatra')) return 'Borneo y Sumatra'
  if (zona.includes('Sulawesi') || zona.includes('Raja Ampat')) return 'Sulawesi y Raja Ampat'
  if (zona.includes('Gili') || zona.includes('Nusa Penida')) return 'Gili y Nusa Penida'
  return zona
}

// Keywords to match manifest items to existing DB records
const MATCH_RULES: { manifestId: number; matchName: string | RegExp }[] = [
  { manifestId: 1, matchName: /Mason/i },
  { manifestId: 19, matchName: /Way Kambas/i },
]

async function main() {
  const manifestPath = path.join(process.cwd(), 'upload', 'elefantes_indonesia_fichas_app.json')
  const raw = fs.readFileSync(manifestPath, 'utf-8')
  const all: ManifestItem[] = JSON.parse(raw)

  // Filter viable items (same logic as before)
  const viable = all.filter(item => {
    const rec = (item.recomendacion_para_app || '').toLowerCase()
    const tipo = (item.tipo_actividad || '').toLowerCase()
    if (rec.includes('no crear card')) return false
    if (rec.includes('excluir por defecto') || rec === 'excluir') return false
    if (tipo.includes('no viable')) return false
    if (tipo.includes('nota de')) return false
    return true
  })
  console.log(`Manifest viable items: ${viable.length}`)

  const existing = await db.elephantActivity.findMany({ orderBy: { order: 'asc' } })
  console.log(`Existing DB records: ${existing.length}`)

  // 1. Enrich matching records with manifest ficha data
  let enriched = 0
  for (const rule of MATCH_RULES) {
    const manifest = viable.find(v => v.id === rule.manifestId)
    if (!manifest) continue

    const dbRecord = existing.find(e =>
      rule.matchName instanceof RegExp ? rule.matchName.test(e.name) : e.name.includes(rule.matchName)
    )
    if (!dbRecord) continue

    const lat = manifest.latitud_aprox ? parseFloat(manifest.latitud_aprox) : dbRecord.lat
    const lng = manifest.longitud_aprox ? parseFloat(manifest.longitud_aprox) : dbRecord.lng

    await db.elephantActivity.update({
      where: { id: dbRecord.id },
      data: {
        slug: manifest.slug,
        lugarBase: manifest.lugar_base,
        tipoActividad: manifest.tipo_actividad || dbRecord.tipoActividad,
        mejorHora: manifest.mejor_hora,
        precio1Dia: manifest.precio_estimado_1_dia_idr,
        precio2Dias: manifest.precio_estimado_2_dias_idr,
        precio3Dias: manifest.precio_estimado_3_dias_idr,
        precioFecha: manifest['precio_según_fecha'],
        logistica: manifest.logistica_acceso,
        nivelTurismo: manifest.nivel_turismo,
        nivelRespeto: manifest.nivel_respeto_animales,
        nivelContacto: manifest.nivel_contacto,
        filtroResumen: manifest.filtro_app_resumen,
        opinionPositiva: manifest.opinion_viajeros_positiva,
        opinionNegativa: manifest.opinion_viajeros_negativa,
        consejos: manifest.consejos_operativos,
        recomendacion: manifest.recomendacion_para_app,
        sourceUrl: manifest.source_url || dbRecord.webUrl,
        estadoVerificacion: manifest.estado_verificacion,
        peligro: manifest.riesgos_y_alertas || dbRecord.peligro,
        lat,
        lng,
        webUrl: manifest.google_maps_url || dbRecord.webUrl,
      },
    })
    console.log(`  ✏️  Enriched #${dbRecord.order}: ${dbRecord.name}`)
    enriched++
  }

  // 2. Find manifest items that are truly NEW (not matching any existing record)
  const matchedManifestIds = new Set(MATCH_RULES.map(r => r.manifestId))
  const newItems = viable.filter(v => !matchedManifestIds.has(v.id))
  console.log(`\nNew items to add: ${newItems.length}`)

  // Photo pool from existing AI-generated photos (reuse extras as filler)
  const existingPhotos = existing.map(e => e.foto1).filter(Boolean)
  const allPhotos = [
    '/elefantes/02_bali_elephant_camp.jpg',
    '/elefantes/04_beach_elephants_bali.jpg',
    '/elefantes/05_elephant_painting_ubud.jpg',
    '/elefantes/06_taro_conservation.jpg',
    '/elefantes/08_night_safari_elephants.jpg',
    '/elefantes/09_elephant_art_studio.jpg',
    '/elefantes/10_elephant_wellness_yoga.jpg',
    '/elefantes/14_wild_elephants_clearing.jpg',
    '/elefantes/15_elephant_patrol_riau.jpg',
    '/elefantes/16_seblat_conservation.jpg',
    '/elefantes/17_elephant_hospital.jpg',
    '/elefantes/18_flying_camp_riau.jpg',
    '/elefantes/22_ujung_kulon_safari.jpg',
    '/elefantes/23_borneo_kinabatangan.jpg',
    '/elefantes/24_danum_valley_tracking.jpg',
    '/elefantes/25_tabin_mud_bath.jpg',
    '/elefantes/26_lore_lindu_petroglyphs.jpg',
    '/elefantes/27_minahasa_elephant_heritage.jpg',
  ]

  // Specific photo assignments for new items
  const newPhotoMap: Record<number, string> = {
    2:  '/elefantes/03_elephant_safari_lodge.jpg',
    3:  '/elefantes/05_elephant_painting_ubud.jpg',
    4:  '/elefantes/12_taman_safari_elephants.jpg',
    9:  '/elefantes/20_surabaya_zoo_elephants.jpg',
    14: '/elefantes/11_sumatra_conservation_aceh.jpg',
    15: '/elefantes/07_elephant_bathing_river.jpg',
    16: '/elefantes/18_flying_camp_riau.jpg',
    20: '/elefantes/14_wild_elephants_clearing.jpg',
  }

  function recToRating(rec: string): number {
    const r = rec.toLowerCase()
    if (r.includes('recomendab')) return 4.8
    if (r.includes('extra recomend')) return 4.6
    if (r.includes('con reservas, mejor')) return 4.4
    if (r.includes('con reservas fuerte')) return 3.8
    if (r.includes('con reservas')) return 4.0
    if (r.includes('no priorizar')) return 3.2
    if (r.includes('disclaimer')) return 3.5
    if (r.includes('opción secundaria')) return 3.8
    if (r.includes('solo investigación')) return 3.0
    return 4.0
  }

  let nextOrder = existing.length + 1
  for (let i = 0; i < newItems.length; i++) {
    const item = newItems[i]
    const foto1 = newPhotoMap[item.id] || allPhotos[i % allPhotos.length]
    const foto2 = allPhotos[(i + 2) % allPhotos.length]
    const foto3 = allPhotos[(i + 5) % allPhotos.length]
    const lat = item.latitud_aprox ? parseFloat(item.latitud_aprox) : null
    const lng = item.longitud_aprox ? parseFloat(item.longitud_aprox) : null

    await db.elephantActivity.create({
      data: {
        order: nextOrder + i,
        name: item.actividad_tour,
        slug: item.slug,
        zone: item.subzona,
        subzone: item.subzona,
        region: zonaToRegion(item.zona),
        lugarBase: item.lugar_base,
        description: item.experiencia_que_vera_usuario,
        tipoActividad: item.tipo_actividad,
        dificultad: 'Medio',
        duracion: item.duracion_orientativa,
        mejorEpoca: '',
        mejorHora: item.mejor_hora,
        queVer: item.experiencia_que_vera_usuario,
        peligro: item.riesgos_y_alertas,
        precio1Dia: item.precio_estimado_1_dia_idr,
        precio2Dias: item.precio_estimado_2_dias_idr,
        precio3Dias: item.precio_estimado_3_dias_idr,
        precioFecha: item['precio_según_fecha'],
        logistica: item.logistica_acceso,
        nivelTurismo: item.nivel_turismo,
        nivelRespeto: item.nivel_respeto_animales,
        nivelContacto: item.nivel_contacto,
        filtroResumen: item.filtro_app_resumen,
        opinionPositiva: item.opinion_viajeros_positiva,
        opinionNegativa: item.opinion_viajeros_negativa,
        consejos: item.consejos_operativos,
        recomendacion: item.recomendacion_para_app,
        sourceUrl: item.source_url,
        estadoVerificacion: item.estado_verificacion,
        address: item.geo_query,
        lat,
        lng,
        wazeUrl: item.geo_query ? `https://www.waze.com/ul?q=${encodeURIComponent(item.geo_query)}&navigate=yes` : '',
        webUrl: item.google_maps_url,
        foto1,
        foto2,
        foto3,
        rating: recToRating(item.recomendacion_para_app),
      },
    })
    console.log(`  ➕ Added #${nextOrder + i}: ${item.actividad_tour}`)
  }

  const total = await db.elephantActivity.count()
  console.log(`\nTotal elephant records now: ${total} (${enriched} enriched + ${newItems.length} new)`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())