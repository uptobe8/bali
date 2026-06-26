'use client'

import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Map as MapIcon,
  Inbox,
  Compass,
  Palmtree,
  Star,
  ArrowRight,
  Sparkles,
  Loader2,
  RotateCcw,
  Trash2,
  CalendarDays,
  Users,
  Wallet,
  Gauge,
  Layers,
  Wand2,
  Bed,
  UtensilsCrossed,
  Plane,
  Check,
  Mountain,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  getItinerary,
  getGuide,
  getSuggestions,
  generateItinerary,
  resetItinerary,
} from '@/lib/client/api'
import type { PlanPreferences } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Curated gallery photos — varied zones and subjects
// ─────────────────────────────────────────────────────────────────────────────

const GALLERY_PHOTOS = [
  { src: '/playas/padang-padang-beach-01.jpg', label: 'Padang Padang, Bali' },
  { src: '/playas/kelingking-beach-01.jpg', label: 'Kelingking, Nusa Penida' },
  { src: '/actividades/1-bali-espiritualidad-y-naturaleza/1-bali-ubud-sur-norte/e-bike-mountain-bike-por-arrozales-de-ubud/e-bike-mountain-bike-por-arrozales-de-ubud-01.jpg', label: 'Arrozales de Tegallalang, Ubud' },
  { src: '/playas/atuh-beach-01.jpg', label: 'Atuh Beach, Nusa Penida' },
  { src: '/actividades/3-komodo-y-flores-tierra-de-dragones/3-2-flores-interior/trekking-a-wae-rebo/trekking-a-wae-rebo-01.jpg', label: 'Wae Rebo, Flores' },
  { src: '/playas/long-beach-pink-beach-padar-01.jpg', label: 'Pink Beach, Komodo' },
  { src: '/actividades/2-java-el-corazon-volcanico/2-2-bromo-ijen/trekking-amanecer-volcan-bromo/trekking-amanecer-volcan-bromo-01.jpg', label: 'Volcán Bromo, Java' },
  { src: '/playas/dreamland-beach-01.jpg', label: 'Dreamland, Bali' },
  { src: '/actividades/5-sulawesi-y-raja-ampat-el-indonesia-mas-puro/5-3-islas-togean/snorkel-kadidiri-karina-beach/snorkel-kadidiri-karina-beach-01.jpg', label: 'Islas Togean' },
  { src: '/playas/angels-billabong-01.jpg', label: 'Angels Billabong, Bali' },
  { src: '/actividades/4-borneo-y-sumatra-selva-y-fauna/4-2-pangkalan-bun-kalimantan/trekking-corto-camp-leakey-pondok-tanggui/trekking-corto-camp-leakey-pondok-tanggui-01.jpg', label: 'Orangutanes, Borneo' },
  { src: '/actividades/6-islas-cercanas-gili-y-nusa-penida/6-1-gili-trawangan/vuelta-en-bici-a-gili-trawangan/vuelta-en-bici-a-gili-trawangan-01.jpg', label: 'Gili Trawangan' },
]

// ─────────────────────────────────────────────────────────────────────────────
// All selectable options
// ─────────────────────────────────────────────────────────────────────────────

const DESTINO_OPTIONS = [
  'Bali + islas Gili (Ubud, Gili Meno, Padang Padang)',
  'Bali completa (Ubud, Uluwatu, Canggu, Nusa Penida)',
  'Bali sur (Uluwatu, Canggu, Seminyak)',
  'Bali + Lombok',
  'Bali + Komodo (Flores)',
  'Java (Yogyakarta, Bromo, Ijen)',
  'Sumatra (Bukit Lawang, Lago Toba)',
  'Raja Ampat (Papúa)',
  'Tailandia (Bangkok + islas)',
  'Japón (Tokio, Kioto, Osaka)',
  'Vietnam (Hanoi, Ha Long, Hoi An)',
  'Maldivas',
  'Grecia (Cícladas)',
  'Marruecos (Marrakech, desierto)',
  'Islandia',
]

const DURACION_OPTIONS = [
  '5 días',
  '7 días',
  '10 días',
  '12 días',
  '14 días',
  '16 días',
  '21 días',
  '30 días',
]

const EPOCA_OPTIONS = [
  'Cualquier época',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
  'Semana Santa',
  'Navidades',
]

const TIPO_VIAJEROS_OPTIONS = [
  'Pareja',
  'Familia con niños',
  'Familia con adolescentes',
  'Pareja + hijos adultos',
  'Grupo de amigos',
  'Viaje en solitario',
  'Multigeneracional (abuelos + nietos)',
  'Luna de miel',
]

const NUM_VIAJEROS_OPTIONS = [
  '1 persona',
  '2 personas',
  '3 personas',
  '4 personas',
  '5 personas',
  '6 personas',
  '7 o más personas',
]

const PRESUPUESTO_OPTIONS = [
  'Económico (mochilero)',
  'Equilibrado (bonito sin tirar el dinero)',
  'Premium (hoteles especiales)',
  'Lujo controlado',
]

const RITMO_OPTIONS = [
  'Muy relajado (pocos traslados)',
  'Relajado con algún plan',
  'Equilibrado (activo sin paliza)',
  'Activo (muchas experiencias)',
  'Muy activo (a tope)',
]

const ALOJAMIENTO_OPTIONS = [
  'Hostales y B&B',
  'Hoteles locales',
  'Hoteles boutique',
  'Resorts',
  'Villas privadas con piscina',
  'Mixto (varios tipos)',
]

const TRANSPORTE_OPTIONS = [
  'Coche privado con conductor',
  'Mixto (privado + público)',
  'Transporte público y apps',
  'Vuelos internos + traslados',
  'Ferry entre islas',
  'Coche de alquiler',
]

const COMIDA_OPTIONS = [
  'Street food y mercados',
  'Warungs y locales típicos',
  'Restaurantes de gama media',
  'Alta cocina y restaurantes de autor',
  'Mixto (de todo un poco)',
]

const CIERRE_OPTIONS = [
  'Villa privada con piscina',
  'Hotel playa todo incluido',
  'Resort de lujo',
  'Ciudad con ambiente',
  'Naturaleza y desconexión',
  'Sin preferencia',
]

const INTERESES_OPTIONS = [
  'Playas y calas',
  'Snorkel y buceo',
  'Surf',
  'Selva y naturaleza',
  'Arrozales',
  'Templos y cultura',
  'Cascadas',
  'Volcanes y montaña',
  'Gastronomía local',
  'Vida nocturna y beach clubs',
  'Bienestar y spa',
  'Compras y mercados',
  'Aventura (quad, rafting, tirolina)',
  'Fotografía',
  'Encuentro con fauna (tortugas, monos)',
  'Clases (cocina, surf, yoga)',
]

const RESTRICCIONES_OPTIONS = [
  'Evitar traslados largos',
  'Evitar días sobrecargados',
  'Solo precios confirmados (nada orientativo)',
  'Hoteles con cancelación gratuita',
  'Evitar zonas muy masificadas',
  'Movilidad reducida / accesibilidad',
  'Dieta vegetariana o vegana',
  'Presupuesto muy controlado',
  'Evitar vuelos internos',
  'Viaje sin coche (a pie / transporte público)',
]

// ─────────────────────────────────────────────────────────────────────────────
// Structured planner state + composer into PlanPreferences.
// ─────────────────────────────────────────────────────────────────────────────

interface PlannerState {
  destino: string
  duracion: string
  epoca: string
  tipoViajeros: string
  numViajeros: string
  presupuesto: string
  ritmo: string
  alojamiento: string
  transporte: string
  comida: string
  cierre: string
  intereses: string[]
  restricciones: string[]
}

const DEFAULT_PLANNER: PlannerState = {
  destino: 'Bali + islas Gili (Ubud, Gili Meno, Padang Padang)',
  duracion: '16 días',
  epoca: 'Agosto',
  tipoViajeros: 'Pareja + hijos adultos',
  numViajeros: '4 personas',
  presupuesto: 'Equilibrado (bonito sin tirar el dinero)',
  ritmo: 'Equilibrado (activo sin paliza)',
  alojamiento: 'Hoteles boutique',
  transporte: 'Coche privado con conductor',
  comida: 'Mixto (de todo un poco)',
  cierre: 'Villa privada con piscina',
  intereses: [
    'Playas y calas',
    'Snorkel y buceo',
    'Arrozales',
    'Templos y cultura',
    'Cascadas',
    'Vida nocturna y beach clubs',
    'Encuentro con fauna (tortugas, monos)',
  ],
  restricciones: [
    'Evitar traslados largos',
    'Evitar días sobrecargados',
    'Solo precios confirmados (nada orientativo)',
  ],
}

function buildPrefs(s: PlannerState): PlanPreferences {
  const fecha =
    s.epoca === 'Cualquier época'
      ? s.duracion
      : `${s.duracion} · ${s.epoca}`
  const travellers = `${s.tipoViajeros} · ${s.numViajeros}`

  const interesPart =
    s.intereses.length > 0
      ? `Intereses e imprescindibles: ${s.intereses.join(', ')}.`
      : 'Intereses: a elegir por la IA según el destino.'
  const musts = [
    interesPart,
    `Alojamiento preferido: ${s.alojamiento}.`,
    `Transporte: ${s.transporte}.`,
    `Comidas: ${s.comida}.`,
    `Cierre del viaje: ${s.cierre}.`,
  ].join(' ')

  const restricciones =
    s.restricciones.length > 0
      ? s.restricciones.join(', ')
      : 'Ninguna en especial'

  return {
    destination: s.destino,
    dates: fecha,
    travellers,
    budget: s.presupuesto,
    pace: s.ritmo,
    musts,
    restrictions: restricciones,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function InicioPage({
  navigate,
}: {
  navigate: (page: string) => void
}) {
  const qc = useQueryClient()
  const { data: itin } = useQuery({
    queryKey: ['itinerary'],
    queryFn: getItinerary,
  })
  const { data: guide } = useQuery({ queryKey: ['guide'], queryFn: getGuide })
  const { data: sugg } = useQuery({
    queryKey: ['suggestions'],
    queryFn: getSuggestions,
  })

  const trip = itin?.trip ?? null
  const days = itin?.days ?? []
  const hasTrip = !!trip

  const [planner, setPlanner] = useState<PlannerState>(DEFAULT_PLANNER)
  const [generating, setGenerating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Ambient audio state
  const audioRef = useRef<HTMLAudioElement>(null)
  const [soundOn, setSoundOn] = useState(false)

  // Gallery carousel
  const galleryRef = useRef<HTMLDivElement>(null)
  const [galleryIdx, setGalleryIdx] = useState(0)

  const guideCount = guide?.entries.length ?? 42
  const suggCount = sugg?.suggestions.length ?? 0
  const dayCount = hasTrip ? days.length : 0
  const zoneCount = hasTrip
    ? new Set(days.map((d) => d.zone.split('·')[0].trim())).size
    : 0

  function setSelect<K extends keyof PlannerState>(
    key: K,
    value: PlannerState[K]
  ) {
    setPlanner((p) => ({ ...p, [key]: value }))
  }

  function togglePill(key: 'intereses' | 'restricciones', value: string) {
    setPlanner((p) => {
      const arr = p[key]
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value]
      return { ...p, [key]: next }
    })
  }

  async function handleGenerate() {
    if (generating) return
    const prefs = buildPrefs(planner)
    setGenerating(true)
    try {
      const res = await generateItinerary(prefs)
      if (!res.success) {
        toast.error('No se ha generado el itinerario', {
          description: res.message,
        })
        return
      }
      toast.success('¡Itinerario listo!', {
        description:
          res.daysAdded > 0
            ? `${res.daysAdded} días generados por la IA.`
            : res.message,
      })
      await qc.invalidateQueries({ queryKey: ['itinerary'] })
      await qc.invalidateQueries({ queryKey: ['suggestions'] })
      navigate('itinerario')
    } catch (e) {
      toast.error('No se pudo generar el itinerario', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setGenerating(false)
    }
  }

  async function handleReset() {
    if (resetting) return
    setResetting(true)
    try {
      await resetItinerary()
      await qc.invalidateQueries({ queryKey: ['itinerary'] })
      await qc.invalidateQueries({ queryKey: ['suggestions'] })
      setPlanner(DEFAULT_PLANNER)
      setShowResetConfirm(false)
      toast.success('Viaje borrado', {
        description: 'El planificador está listo para un viaje nuevo.',
      })
    } catch (e) {
      toast.error('No se pudo borrar el viaje', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setResetting(false)
    }
  }

  function scrollGallery(dir: 'left' | 'right') {
    const el = galleryRef.current
    if (!el) return
    const cardW = el.firstElementChild?.getBoundingClientRect().width ?? 280
    const scrollAmt = cardW * 2 + 16
    el.scrollBy({ left: dir === 'right' ? scrollAmt : -scrollAmt, behavior: 'smooth' })
  }

  return (
    <div className="nusa-shell-bg text-nusa-mist">
      {/* Loading overlay — full screen while the LLM builds the itinerary */}
      {generating && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm nusa-no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Generando itinerario"
        >
          <div className="nusa-panel px-8 py-7 flex flex-col items-center gap-3 max-w-sm text-center">
            <Loader2 className="w-8 h-8 animate-spin text-nusa-sun" />
            <div className="font-display text-xl text-white">
              Generando tu itinerario…
            </div>
            <div className="text-sm text-white/70 leading-relaxed">
              La IA está construyendo el viaje día a día. Esto tarda unos
              2-3 minutos.
            </div>
          </div>
        </div>
      )}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {generating
          ? 'Generando tu itinerario. La IA está construyendo el viaje día a día. Esto tarda unos 2-3 minutos.'
          : hasTrip
            ? 'Tienes un viaje generado. Puedes ver el itinerario, regenerarlo o empezar de cero.'
            : 'Aún no has generado un viaje. Selecciona las opciones y pulsa Genera tu itinerario.'}
      </div>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-6 sm:pt-10 pb-20">

        {/* ─── HERO IMAGE + AMBIENT SOUND ─── */}
        <div className="nusa-panel p-2 sm:p-3 nusa-rise">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <img
              src="/hero-bali.jpg"
              alt="Vista aérea panorámica de Bali, Indonesia, con aguas turquesas, arrozales y montañas volcánicas"
              className="w-full h-[280px] sm:h-[400px] lg:h-[480px] object-cover"
            />
            {/* Ambient jungle sound */}
            <audio ref={audioRef} src="/sounds/jungle-ambient.mp3" loop preload="none" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

            {/* Content over image */}
            <div className="absolute inset-0 z-[1] flex flex-col justify-end p-5 sm:p-8 lg:p-10">
              <span className="kicker kicker-sun text-xs sm:text-sm">
                Nusa Travel OS · Planificador de viajes
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white mt-2 leading-[1.08] max-w-2xl">
                Crea tu viaje a medida, día a día.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                Elige cómo es el viaje que queréis. Nuestra IA genera un itinerario completo con hoteles, restaurantes, transportes, playas y precios, todo enlazado a Waze.
              </p>

              {/* Metrics over hero */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl">
                <HeroMetric value={dayCount} label="días de viaje" />
                <HeroMetric value={zoneCount} label="zonas clave" />
                <HeroMetric value={guideCount} label="entradas de guía" />
                <HeroMetric value="IA" label="generación con IA" />
              </div>
            </div>

            {/* Sound toggle — ambient jungle audio */}
            <button
              onClick={() => {
                const a = audioRef.current
                if (!a) return
                if (soundOn) {
                  a.pause()
                  a.currentTime = 0
                } else {
                  a.volume = 0.35
                  a.play().catch(() => {})
                }
                setSoundOn(!soundOn)
              }}
              className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full backdrop-blur-sm transition grid place-items-center ${soundOn ? 'bg-nusa-jungle/60 text-white hover:bg-nusa-jungle/80' : 'bg-black/40 text-white/80 hover:text-white hover:bg-black/60'}`}
              aria-label={soundOn ? 'Silenciar sonido ambiente' : 'Activar sonido ambiente'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ─── PHOTO GALLERY ─── */}
        <div className="mt-8 nusa-rise">
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <span className="kicker kicker-sun text-sm">Indonesia en imágenes</span>
              <h2 className="font-display text-xl sm:text-2xl text-white mt-0.5">Descubre lo que te espera</h2>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => scrollGallery('left')}
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/12 text-white/70 hover:text-white transition grid place-items-center"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollGallery('right')}
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/12 text-white/70 hover:text-white transition grid place-items-center"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            ref={galleryRef}
            className="flex gap-4 overflow-x-auto nusa-scroll snap-x snap-mandatory pb-2 -mx-1 px-1"
          >
            {GALLERY_PHOTOS.map((photo, i) => (
              <div
                key={i}
                className="relative shrink-0 w-[260px] sm:w-[300px] snap-start rounded-2xl overflow-hidden group cursor-pointer"
              >
                <img
                  src={photo.src}
                  alt={photo.label}
                  className="w-full h-[180px] sm:h-[200px] object-cover group-hover:scale-105 transition-transform duration-500"
                  loading={i < 4 ? 'eager' : 'lazy'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="text-sm font-bold text-white leading-snug">{photo.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* If a trip exists: current trip summary card — direct, no "Tu viaje actual" label */}
        {hasTrip && trip && (
          <div className="nusa-panel p-5 sm:p-6 mt-8 nusa-rise">
            <h2 className="font-display text-2xl sm:text-3xl text-white leading-tight">
              {trip.title}
            </h2>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <TripMeta
                icon={<MapIcon className="w-4 h-4" />}
                label="Destino"
                value={trip.destination}
              />
              <TripMeta
                icon={<CalendarDays className="w-4 h-4" />}
                label="Fechas"
                value={trip.dates}
              />
              <TripMeta
                icon={<Users className="w-4 h-4" />}
                label="Viajeros"
                value={trip.travellers}
              />
              <TripMeta
                icon={<Layers className="w-4 h-4" />}
                label="Días generados"
                value={`${days.length} días`}
              />
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <TripMeta
                icon={<Wallet className="w-4 h-4" />}
                label="Presupuesto"
                value={trip.budget}
              />
              <TripMeta
                icon={<Gauge className="w-4 h-4" />}
                label="Ritmo"
                value={trip.pace}
              />
            </div>
            {trip.musts && (
              <div className="mt-3 rounded-xl border border-white/12 bg-white/5 p-3">
                <div className="kicker kicker-sun mb-1">Imprescindibles</div>
                <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
                  {trip.musts}
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                onClick={() => navigate('itinerario')}
                className="nusa-btn-primary inline-flex items-center gap-2"
              >
                <Compass className="w-4 h-4" /> Ver itinerario
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="nusa-btn-secondary inline-flex items-center gap-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Regenerar con estos datos
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={resetting}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-nusa-coral/40 text-nusa-coral font-black text-sm hover:bg-nusa-coral/10 transition"
              >
                <Trash2 className="w-4 h-4" /> Empezar de cero
              </button>
            </div>

            {suggCount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-nusa-jungle-2 animate-pulse" />
                {suggCount} aportaciones en el buzón esperando aplicación
              </div>
            )}
          </div>
        )}

        {/* Planner form — always titled "Configura tu viaje" */}
        <div
          id="planner-form"
          className="nusa-panel p-5 sm:p-7 mt-8 nusa-rise scroll-mt-24"
        >
          <div className="flex items-center gap-2 text-nusa-teal mb-1">
            <Wand2 className="w-4 h-4" />
            <span className="kicker kicker-sun">Planificador</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-white leading-tight">
            Configura tu viaje
          </h2>
          <p className="mt-2 text-sm text-white/65 leading-relaxed max-w-2xl">
            Todo es seleccionable: elige destino, duración, viajeros,
            presupuesto, ritmo, alojamiento, transporte, comidas, intereses
            y restricciones. Viene con un ejemplo de Indonesia para que solo
            tengas que pulsar «Genera tu itinerario».
          </p>

          <div className="mt-6 grid lg:grid-cols-2 gap-5">
            <SelectField
              label="Destino"
              icon={<MapIcon className="w-3.5 h-3.5" />}
              value={planner.destino}
              onChange={(v) => setSelect('destino', v)}
              options={DESTINO_OPTIONS}
            />
            <SelectField
              label="Duración"
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              value={planner.duracion}
              onChange={(v) => setSelect('duracion', v)}
              options={DURACION_OPTIONS}
            />
            <SelectField
              label="Época del año"
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              value={planner.epoca}
              onChange={(v) => setSelect('epoca', v)}
              options={EPOCA_OPTIONS}
            />
            <SelectField
              label="Quiénes viajan"
              icon={<Users className="w-3.5 h-3.5" />}
              value={planner.tipoViajeros}
              onChange={(v) => setSelect('tipoViajeros', v)}
              options={TIPO_VIAJEROS_OPTIONS}
            />
            <SelectField
              label="Número de viajeros"
              icon={<Users className="w-3.5 h-3.5" />}
              value={planner.numViajeros}
              onChange={(v) => setSelect('numViajeros', v)}
              options={NUM_VIAJEROS_OPTIONS}
            />
            <SelectField
              label="Presupuesto"
              icon={<Wallet className="w-3.5 h-3.5" />}
              value={planner.presupuesto}
              onChange={(v) => setSelect('presupuesto', v)}
              options={PRESUPUESTO_OPTIONS}
            />
            <SelectField
              label="Ritmo"
              icon={<Gauge className="w-3.5 h-3.5" />}
              value={planner.ritmo}
              onChange={(v) => setSelect('ritmo', v)}
              options={RITMO_OPTIONS}
            />
            <SelectField
              label="Alojamiento"
              icon={<Bed className="w-3.5 h-3.5" />}
              value={planner.alojamiento}
              onChange={(v) => setSelect('alojamiento', v)}
              options={ALOJAMIENTO_OPTIONS}
            />
            <SelectField
              label="Transporte"
              icon={<Plane className="w-3.5 h-3.5" />}
              value={planner.transporte}
              onChange={(v) => setSelect('transporte', v)}
              options={TRANSPORTE_OPTIONS}
            />
            <SelectField
              label="Comidas"
              icon={<UtensilsCrossed className="w-3.5 h-3.5" />}
              value={planner.comida}
              onChange={(v) => setSelect('comida', v)}
              options={COMIDA_OPTIONS}
            />
            <SelectField
              label="Cierre del viaje"
              icon={<Mountain className="w-3.5 h-3.5" />}
              value={planner.cierre}
              onChange={(v) => setSelect('cierre', v)}
              options={CIERRE_OPTIONS}
            />

            {/* Intereses — multi-select toggle pills */}
            <div className="lg:col-span-2">
              <PillGroup
                label="Intereses e imprescindibles"
                hint="Selecciona todos los que queráis."
                options={INTERESES_OPTIONS}
                selected={planner.intereses}
                onToggle={(v) => togglePill('intereses', v)}
                tone="jungle"
              />
            </div>

            {/* Restricciones — multi-select toggle pills */}
            <div className="lg:col-span-2">
              <PillGroup
                label="Restricciones y cosas a evitar"
                hint="Opcional. Marca lo que aplique."
                options={RESTRICCIONES_OPTIONS}
                selected={planner.restricciones}
                onToggle={(v) => togglePill('restricciones', v)}
                tone="coral"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="nusa-btn-primary inline-flex items-center justify-center gap-2 text-base px-6 py-3.5"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {hasTrip ? 'Regenera tu itinerario' : 'Genera tu itinerario'}
                </>
              )}
            </button>
            <p className="text-xs text-white/55 leading-relaxed max-w-md">
              La generación tarda unos 2-3 minutos. La IA construye el
              itinerario completo desde cero con tus selecciones.
            </p>
          </div>
        </div>

        {/* Lower band: nav tiles */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <NavTile
            onClick={() => navigate('guia')}
            icon={<Palmtree className="w-5 h-5" />}
            kicker="Guía viva"
            title="Restaurantes, playas y actividades"
            text="42 entradas con precio, horario y enlace directo a Waze. Siempre disponibles, viaje o no."
          />
          <NavTile
            onClick={() => navigate('mapa')}
            icon={<MapIcon className="w-5 h-5" />}
            kicker="Mapa 3D"
            title="Indonesia vista desde el cielo"
            text="Mapa satélite en 3D con relieve real, ruta de tu viaje y pines navegables."
          />
          <NavTile
            onClick={() => navigate('sugerencias')}
            icon={<Inbox className="w-5 h-5" />}
            kicker="Izan & Iria"
            title="Lo que van encontrando por ahí"
            text="Subid enlaces, fotos, hoteles y actividades. Después los aplicamos al itinerario."
          />
        </div>
      </section>

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm nusa-no-print p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar borrado del viaje"
        >
          <div className="nusa-panel p-6 max-w-md w-full">
            <div className="flex items-center gap-2 text-nusa-coral mb-1">
              <Trash2 className="w-5 h-5" />
              <span className="kicker kicker-sun">Empezar de cero</span>
            </div>
            <h3 className="font-display text-xl text-white mt-1">
              ¿Borrar el viaje actual?
            </h3>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Se eliminarán el itinerario, los días generados y todas las
              aportaciones del buzón de Izan &amp; Iria. La guía viva se
              mantiene. No se puede deshacer.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="nusa-btn-secondary inline-flex items-center gap-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-nusa-coral text-white font-black text-sm hover:opacity-90 transition"
              >
                {resetting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Sí, borrar el viaje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local styles for nusa-input + pills */}
      <style jsx>{`
        :global(.nusa-input) {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #f7fff7;
          border-radius: 12px;
          padding: 11px 36px 11px 14px;
          font-size: 14px;
          font-family: var(--font-manrope), system-ui, sans-serif;
          outline: none;
          transition: 0.18s ease;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2300d5ff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 14px;
        }
        :global(.nusa-input:focus) {
          border-color: rgba(0, 213, 255, 0.6);
          background-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 3px rgba(0, 213, 255, 0.18);
        }
        :global(.nusa-input option) {
          color: #f7fff7;
          background: #06281d;
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function HeroMetric({
  value,
  label,
}: {
  value: number | string
  label: string
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-black/30 backdrop-blur-sm px-3 py-2">
      <div className="font-display text-xl sm:text-2xl text-white">{value}</div>
      <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/55 font-bold mt-0.5">
        {label}
      </div>
    </div>
  )
}

function TripMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/5 p-3">
      <div className="flex items-center gap-1.5 text-nusa-teal">
        {icon}
        <span className="kicker kicker-sun">{label}</span>
      </div>
      <div className="mt-1 text-sm text-white font-bold leading-snug">
        {value}
      </div>
    </div>
  )
}

function SelectField({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string
  icon?: React.ReactNode
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 kicker kicker-sun mb-1.5 text-white/80">
        {icon}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="nusa-input"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function PillGroup({
  label,
  hint,
  options,
  selected,
  onToggle,
  tone,
}: {
  label: string
  hint?: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  tone: 'jungle' | 'coral'
}) {
  const activeCls =
    tone === 'jungle'
      ? 'bg-gradient-to-br from-nusa-jungle to-nusa-teal text-nusa-ink border-transparent shadow-[0_8px_22px_rgba(0,200,117,0.28)]'
      : 'bg-gradient-to-br from-nusa-coral to-nusa-sun text-nusa-ink border-transparent shadow-[0_8px_22px_rgba(255,75,47,0.26)]'
  const idleCls =
    'bg-white/6 border-white/15 text-white/75 hover:bg-white/12 hover:text-white'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="kicker kicker-sun text-white/80">{label}</label>
        {hint && <span className="text-[11px] text-white/45">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-bold transition ${
                active ? activeCls : idleCls
              }`}
            >
              {active && <Check className="w-3.5 h-3.5" />}
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NavTile({
  onClick,
  icon,
  kicker,
  title,
  text,
}: {
  onClick: () => void
  icon: React.ReactNode
  kicker: string
  title: string
  text: string
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-white/12 bg-white/5 hover:bg-white/10 transition p-5 group"
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-nusa-jungle/30 to-nusa-teal/30 text-nusa-teal">
          {icon}
        </div>
        <span className="kicker kicker-sun">{kicker}</span>
      </div>
      <div className="font-display text-lg text-white mt-3">{title}</div>
      <div className="text-sm text-white/60 mt-1">{text}</div>
      <div className="mt-3 inline-flex items-center gap-1 text-nusa-teal text-xs font-bold group-hover:gap-2 transition-all">
        Abrir <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </button>
  )
}