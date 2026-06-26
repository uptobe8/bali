'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { getItinerary } from '@/lib/client/api'
import { EmptyTripState } from './EmptyTripState'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Navigation,
  MapPin,
  Route,
  Download,
  ChevronRight,
  Mountain,
  RotateCcw,
  Box,
} from 'lucide-react'
import {
  wazeNavigateUrl,
  wazeCoordUrl,
  googleMapUrl,
} from '@/lib/types'

const MaplibreMap = dynamic(() => import('./MaplibreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full grid place-items-center bg-[#0a1d14] text-nusa-mist/60 text-sm">
      Cargando mapa 3D de Indonesia…
    </div>
  ),
})

export function MapaPage({
  navigate,
}: {
  navigate?: (page: string) => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['itinerary'],
    queryFn: getItinerary,
  })
  const days = data?.days ?? []
  const trip = data?.trip ?? null
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [terrainOn, setTerrainOn] = useState(true)

  const points = useMemo(
    () => days.filter((d) => d.coordsLat != null && d.coordsLng != null),
    [days]
  )
  const selected =
    days.find((d) => d.id === selectedId) ?? points[0] ?? null

  // Empty state: no trip generated yet, or trip but no days with coords
  if (!isLoading && (!trip || days.length === 0)) {
    return (
      <div className="nusa-shell-bg text-nusa-mist min-h-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-6">
            <span className="kicker kicker-sun">Mapa 3D · Indonesia</span>
            <h1 className="font-display text-3xl sm:text-5xl text-white mt-2 leading-tight">
              Tu ruta vista desde el cielo
            </h1>
            <p className="mt-3 text-white/70 max-w-2xl leading-relaxed">
              Cuando generes tu itinerario, aquí verás la ruta en 3D con
              relieve real, pines navegables y enlaces a Waze.
            </p>
          </header>
          <EmptyTripState
            theme="dark"
            icon={<MapPin className="w-7 h-7" />}
            headline="Aún no has generado tu viaje"
            text="Vuelve a Inicio, rellena el planificador con vuestros datos y pulsa «Genera tu itinerario». La IA construye el viaje día a día en unos 2-3 minutos y entonces verás la ruta en este mapa 3D."
            ctaLabel="Crear mi viaje"
            onCta={() => navigate?.('inicio') ?? window.scrollTo({ top: 0 })}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="nusa-shell-bg text-nusa-mist min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <span className="kicker kicker-sun">Mapa 3D · Indonesia</span>
          <h1 className="font-display text-3xl sm:text-5xl text-white mt-2 leading-tight">
            La ruta de los {days.length} días vista desde el cielo
          </h1>
          <p className="mt-3 text-white/70 max-w-2xl leading-relaxed">
            Vista satélite en 3D con relieve real de Bali, Lombok y las
            islas Gili. Arrastra con el ratón para rotar, inclina con el
            botón derecho y pulsa cualquier pin para abrir su día o
            lanzar Waze.
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_360px] gap-4">
          {/* Map */}
          <div className="relative">
            <div className="nusa-panel p-2 h-[460px] sm:h-[560px] lg:h-[640px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-[18px] bg-white/5" />
              ) : (
                <MaplibreMap
                  days={days}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelectedId}
                  terrainOn={terrainOn}
                />
              )}
            </div>
            {/* 3D controls overlay — top-left of the map */}
            {!isLoading && (
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 nusa-no-print">
                <button
                  onClick={() => setTerrainOn((v) => !v)}
                  className={`nusa-panel px-3 py-2 text-xs font-black inline-flex items-center gap-1.5 transition ${
                    terrainOn
                      ? 'text-nusa-jungle-2 border-nusa-jungle/50'
                      : 'text-white/70'
                  }`}
                  title="Activar/desactivar terreno 3D"
                >
                  <Mountain className="w-3.5 h-3.5" />
                  Terreno 3D
                </button>
                <button
                  onClick={() => {
                    const ev = new CustomEvent('nusa-map-reset')
                    window.dispatchEvent(ev)
                  }}
                  className="nusa-panel px-3 py-2 text-xs font-black inline-flex items-center gap-1.5 text-white/70 hover:text-nusa-teal transition"
                  title="Vista 3D inicial"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Vista 3D
                </button>
                <a
                  href="https://www.waze.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nusa-panel px-3 py-2 text-xs font-black inline-flex items-center gap-1.5 text-nusa-sun hover:text-nusa-sun/80 transition"
                  title="Descargar Waze"
                >
                  <Box className="w-3.5 h-3.5" />
                  App Waze
                </a>
              </div>
            )}
          </div>

          {/* Side panel */}
          <aside className="nusa-panel p-4 flex flex-col max-h-[640px]">
            <div className="flex items-center gap-2 text-nusa-sun mb-1">
              <Route className="w-4 h-4" />
              <span className="kicker kicker-sun">Puntos de la ruta</span>
            </div>
            <div className="text-[11px] text-white/50 mb-3">
              {points.length} días con coordenadas
            </div>

            <div className="flex-1 overflow-y-auto nusa-scroll pr-1 space-y-2">
              {points.map((d) => {
                const active = d.id === selected?.id
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      active
                        ? 'border-nusa-coral bg-nusa-coral/15'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-black ${
                          active
                            ? 'bg-nusa-coral text-white'
                            : 'bg-nusa-jungle/30 text-nusa-jungle-2'
                        }`}
                      >
                        {d.day}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">
                          {d.zone}
                        </div>
                        <div className="text-sm text-white font-bold truncate">
                          {d.title}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-white/40 transition ${
                          active ? 'translate-x-0.5 text-nusa-coral' : ''
                        }`}
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected detail */}
            {selected && (
              <div className="mt-3 rounded-xl border border-white/12 bg-gradient-to-br from-white/8 to-white/3 p-4">
                <div className="flex items-center gap-2 text-nusa-sun">
                  <MapPin className="w-4 h-4" />
                  <span className="kicker kicker-sun">
                    Día {selected.day} · {selected.zone}
                  </span>
                </div>
                <div className="font-display text-lg text-white mt-1.5 leading-tight">
                  {selected.title}
                </div>
                <div className="mt-2 text-xs text-white/70 space-y-1">
                  <div>
                    <span className="text-white/45">Transporte:</span>{' '}
                    {selected.transport}
                  </div>
                  <div>
                    <span className="text-white/45">Coste:</span> {selected.cost}
                  </div>
                  <div className="leading-relaxed pt-1 text-white/60">
                    {selected.advice}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={wazeNavigateUrl(selected.wazeQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-gradient-to-br from-nusa-jungle to-nusa-teal text-nusa-ink text-xs font-black px-3 py-2 rounded-full hover:opacity-90"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Abrir en Waze
                  </a>
                  {selected.coordsLat != null && selected.coordsLng != null && (
                    <a
                      href={wazeCoordUrl(selected.coordsLat, selected.coordsLng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-white/25 text-white text-xs font-black px-3 py-2 rounded-full hover:bg-white/10"
                    >
                      <Route className="w-3.5 h-3.5" /> Ver ruta en Waze
                    </a>
                  )}
                  <a
                    href={googleMapUrl(selected.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-white/25 text-white text-xs font-black px-3 py-2 rounded-full hover:bg-white/10"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Google Maps
                  </a>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 text-[11px] text-white/45 leading-relaxed">
              <Download className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Mapa offline de Indonesia: descarga la región en la app de
                Waze antes de viajar para usarlo sin conexión.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
