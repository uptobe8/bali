'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getItinerary } from '@/lib/client/api'
import { DayDetail } from './DayDetail'
import { EmptyTripState } from './EmptyTripState'
import { Skeleton } from '@/components/ui/skeleton'
import { Plane, Compass } from 'lucide-react'

export function ItinerarioPage({
  navigate,
}: {
  navigate?: (page: string) => void
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itinerary'],
    queryFn: getItinerary,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const days = data?.days ?? []
  const trip = data?.trip ?? null
  const selected =
    days.find((d) => d.id === selectedId) ?? days[0] ?? null

  // Empty state: no trip generated yet
  if (!isLoading && !isError && !trip) {
    return (
      <div className="nusa-paper min-h-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <header className="mb-8">
            <span className="kicker kicker-ember">Itinerario día a día</span>
            <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">
              Tu viaje, contado día por día
            </h1>
            <hr className="nusa-divider mt-5" />
          </header>
          <EmptyTripState
            theme="light"
            icon={<Compass className="w-7 h-7" />}
            headline="Aún no has generado tu viaje"
            text="Vuelve a Inicio, rellena el planificador con vuestros datos y pulsa «Genera tu itinerario». La IA construye el viaje día a día en unos 2-3 minutos."
            ctaLabel="Crear mi viaje"
            onCta={() => navigate?.('inicio') ?? window.scrollTo({ top: 0 })}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="nusa-paper min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <header className="mb-8">
          <span className="kicker kicker-ember">Itinerario día a día</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">
            {trip?.title ?? 'Indonesia · Bali · Gili Meno · Padang Padang'}
          </h1>
          <p className="mt-3 text-ink-soft max-w-2xl leading-relaxed">
            {trip?.dates}. Cada día con su alojamiento, sus comidas, su
            transporte y sus enlaces vivos a Waze y a Google Maps. Una
            guía editorial para saborear el viaje antes de pisar Bali.
          </p>
          <hr className="nusa-divider mt-5" />
        </header>

        {isLoading && <ItinerarioSkeleton />}

        {isError && (
          <div className="nusa-card-paper p-6 text-ink-soft">
            No pudimos cargar el itinerario. Reintenta en unos segundos.
          </div>
        )}

        {days.length > 0 && (
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Day list */}
            <aside>
              <div className="lg:sticky lg:top-24">
                <div className="kicker kicker-leaf mb-3">
                  Los {days.length} días
                </div>
                <div className="flex lg:flex-col gap-2 overflow-x-auto nusa-scroll-paper pb-2 lg:pb-0 lg:max-h-[70vh] lg:overflow-y-auto">
                  {days.map((d) => {
                    const active = d.id === selected?.id
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedId(d.id)}
                        className={`shrink-0 lg:shrink text-left rounded-xl border p-3 transition min-w-[220px] lg:min-w-0 ${
                          active
                            ? 'border-ember bg-white shadow-[0_10px_28px_rgba(232,119,34,0.18)]'
                            : 'border-leaf/12 bg-white/60 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0"
                            style={{ backgroundImage: `url(${d.image})` }}
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-black text-ember uppercase tracking-wider">
                              Día {d.day} · {d.zone.split('·')[0].trim()}
                            </div>
                            <div className="font-display text-sm text-ink leading-tight truncate">
                              {d.title}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            {/* Day detail */}
            <div>
              {selected ? (
                <DayDetail
                  key={selected.id}
                  day={selected}
                  days={days}
                  onSelect={setSelectedId}
                />
              ) : (
                <div className="nusa-card-paper p-10 text-center text-ink-soft">
                  <Plane className="w-8 h-8 mx-auto text-ember mb-3" />
                  Selecciona un día para ver el detalle.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ItinerarioSkeleton() {
  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-leaf/10" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-[360px] rounded-2xl bg-leaf/10" />
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-leaf/10" />
          ))}
        </div>
      </div>
    </div>
  )
}
