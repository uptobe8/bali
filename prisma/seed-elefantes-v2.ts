/**
 * Seed Elefantes v2 — reemplaza los 27 registros generados por IA
 * con los 10 items viables del manifest real del usuario.
 *
 * Campos mapeados del manifest JSON:
 *   actividad_tour → name
 *   slug → slug
 *   zona → zone
 *   subzona → subzone
 *   lugar_base → lugarBase
 *   experiencia_que_vera_usuario → description
 *   tipo_actividad → tipoActividad
 *   duracion_orientativa → duracion
 *   mejor_hora → mejorHora
 *   geo_query → address
 *   google_maps_url → webUrl
 *   precio_estimado_*_dia_idr → precio1Dia / precio2Dias / precio3Dias
 *   precio_según_fecha → precioFecha
 *   logistica_acceso → logistica
 *   nivel_turismo → nivelTurismo
 *   nivel_respeto_animales → nivelRespeto
 *   nivel_contacto → nivelContacto
 *   filtro_app_resumen → filtroResumen
 *   opinion_viajeros_positiva → opinionPositiva
 *   opinion_viajeros_negativa → opinionNegativa
 *   consejos_operativos → consejos
 *   riesgos_y_alertas → peligro
 *   recomendacion_para_app → recomendacion
 *   source_url → sourceUrl
 *   estado_verificacion → estadoVerificacion
 */

import { PrismaClient } from '@prisma/client'

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

// Map existing AI-generated photos to manifest items
const PHOTO_MAP: Record<number, string> = {
  1:  '/elefantes/01_mason_elephant_park.jpg',
  2:  '/elefantes/03_elephant_safari_lodge.jpg',
  3:  '/elefantes/05_elephant_painting_ubud.jpg',
  4:  '/elefantes/12_taman_safari_elephants.jpg',
  9:  '/elefantes/20_surabaya_zoo_elephants.jpg',
  14: '/elefantes/11_sumatra_conservation_aceh.jpg',
  15: '/elefantes/07_elephant_bathing_river.jpg',
  16: '/elefantes/18_flying_camp_riau.jpg',
  19: '/elefantes/13_way_kambas_safari.jpg',
  20: '/elefantes/14_wild_elephants_clearing.jpg',
}

// Secondary photos for filler
const EXTRA_PHOTOS = [
  '/elefantes/06_taro_conservation.jpg',
  '/elefantes/08_night_safari_elephants.jpg',
  '/elefantes/09_elephant_art_studio.jpg',
  '/elefantes/10_elephant_wellness_yoga.jpg',
  '/elefantes/17_elephant_hospital.jpg',
  '/elefantes/15_elephant_patrol_riau.jpg',
  '/elefantes/16_seblat_conservation.jpg',
  '/elefantes/22_ujung_kulon_safari.jpg',
  '/elefantes/23_borneo_kinabatangan.jpg',
  '/elefantes/24_danum_valley_tracking.jpg',
]

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
  if (r.includes('excluir')) return 2.0
  return 4.0
}

async function main() {
  // 1. Delete all existing records
  const deleted = await db.elephantActivity.deleteMany({})
  console.log(`Deleted ${deleted.count} old elephant records`)

  // 2. Load manifest
  const fs = await import('fs')
  const path = await import('path')
  const manifestPath = path.join(process.cwd(), 'upload', 'elefantes_indonesia_fichas_app.json')
  const raw = fs.readFileSync(manifestPath, 'utf-8')
  const all: ManifestItem[] = JSON.parse(raw)
  console.log(`Loaded ${all.length} items from manifest`)

  // 3. Filter viable items
  const viable = all.filter(item => {
    const rec = (item.recomendacion_para_app || '').toLowerCase()
    const tipo = (item.tipo_actividad || '').toLowerCase()
    if (rec.includes('no crear card')) return false
    if (rec.includes('excluir por defecto') || rec === 'excluir') return false
    if (tipo.includes('no viable')) return false
    if (tipo.includes('nota de')) return false
    return true
  })
  console.log(`Viable items: ${viable.length}`)

  // 4. Seed
  for (let i = 0; i < viable.length; i++) {
    const item = viable[i]
    const manifestId = item.id
    const foto1 = PHOTO_MAP[manifestId] || `/elefantes/02_bali_elephant_camp.jpg`
    const foto2 = EXTRA_PHOTOS[i % EXTRA_PHOTOS.length]
    const foto3 = EXTRA_PHOTOS[(i + 3) % EXTRA_PHOTOS.length]

    const lat = item.latitud_aprox ? parseFloat(item.latitud_aprox) : null
    const lng = item.longitud_aprox ? parseFloat(item.longitud_aprox) : null

    const record = await db.elephantActivity.create({
      data: {
        order: i + 1,
        name: item.actividad_tour,
        slug: item.slug,
        zone: item.zona,
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
    console.log(`  ${i + 1}. ${record.name} → ${record.region}`)
  }

  console.log('\nDone! Seeded', viable.length, 'elephant activities.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())