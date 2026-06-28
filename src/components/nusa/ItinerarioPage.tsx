'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getItinerary } from '@/lib/client/api'
import { getItineraryOptions, activateItineraryOption, type ItineraryOption } from '@/lib/client/itinerary-options'
import { DayDetail } from './DayDetail'
import { EmptyTripState } from './EmptyTripState'
import { Skeleton } from '@/components/ui/skeleton'
import { Plane, Compass, WalletCards, CheckCircle2, RotateCcw, GitCompareArrows } from 'lucide-react'
import type { Day, Trip } from '@/lib/types'

type ItineraryVariant = {
  id: 'economica' | 'media' | 'premium' | string
  label: string
  tag: string
  description: string
  totalEstimate: string
  trip: Trip
  days: Day[]
}

export function ItinerarioPage({
  navigate,
}: {
  navigate?: (page: string) => void
}) {
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itinerary'],
    queryFn: getItinerary,
  })
  const { data: optionsData } = useQuery({
    queryKey: ['itinerary-options'],
    queryFn: getItineraryOptions,
    retry: false,
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>('media')

  const variants = (((data as unknown as { variants?: ItineraryVariant[] })?.variants) ?? [])
    .filter((v) => v?.trip && Array.isArray(v.days) && v.days.length > 0)
  const activeVariant =
    variants.find((v) => v.id === selectedVariantId) ??
    variants.find((v) => v.id === 'media') ??
    variants[0] ??
    null

  const baseDays = data?.days ?? []
  const baseTrip = data?.trip ?? null
  const days = activeVariant?.days ?? baseDays
  const trip = activeVariant?.trip ?? baseTrip
  const selected = days.find((d) => d.id === selectedId) ?? days[0] ?? null
  const options = optionsData?.options ?? []
  const activeOption = options.find((o) => trip?.budget?.toLowerCase().includes(o.label.toLowerCase())) ?? null

  const activateMutation = useMutation({
    mutationFn: activateItineraryOption,
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ['itinerary'] })
      await qc.invalidateQueries({ queryKey: ['itinerary-options'] })
      setSelectedId(null)
      toast.success('Opción cargada', { description: res.message })
    },
    onError: (err) => {
      toast.error('No se pudo cargar la opción', {
        description: err instanceof Error ? err.message : undefined,
      })
    },
  })

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
            text="Vuelve a Inicio, rellena el planificador con vuestros datos y pulsa «Genera tu itinerario». La IA construye las opciones en unos 2-3 minutos."
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
        <header className="mb-8">
          <span className="kicker kicker-ember">Itinerario día a día</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">
            {days.length === 0 && options.length >= 3 ? 'Elige tu versión' : trip?.title ?? 'Indonesia · Bali'}
          </h1>
          <p className="mt-3 text-ink-soft max-w-2xl leading-relaxed">
            {days.length === 0 && options.length >= 3
              ? 'Compara las tres propuestas generadas y carga una como itinerario principal.'
              : `${trip?.dates}. Cada día con alojamiento, comidas, transporte, presupuesto y enlaces a Waze y Google Maps.`}
          </p>
          <hr className="nusa-divider mt-5" />
        </header>

        {isLoading && <ItinerarioSkeleton />}

        {isError && (
          <div className="nusa-card-paper p-6 text-ink-soft">
            No pudimos cargar el itinerario. Reintenta en unos segundos.
          </div>
        )}

        {options.length >= 3 && (
          <section className="mb-8" id="comparar-opciones">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <WalletCards className="w-5 h-5 text-ember" />
                <div>
                  <div className="kicker kicker-ember">Comparar opciones</div>
                  <p className="text-sm text-ink-soft mt-1">
                    Económica, media y premium respetan destino, duración, viajeros, ritmo, intereses y restricciones. Cambian coste, hoteles, comidas y logística.
                  </p>
                </div>
              </div>
              {days.length > 0 && (
                <button
                  onClick={() => document.getElementById('comparar-opciones')?.scrollIntoView({ behavior: 'smooth' })}
                  className="nusa-btn-ghost inline-flex items-center gap-2 self-start sm:self-auto"
                >
                  <GitCompareArrows className="w-4 h-4" /> Comparar opciones
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {options.map((o) => {
                const active = trip?.budget?.toLowerCase().includes(o.label.toLowerCase())
                return (
                  <article
                    key={o.id}
                    className={`rounded-2xl border p-5 bg-white transition ${active ? 'border-ember shadow-[0_12px_34px_rgba(232,119,34,0.18)]' : 'border-leaf/12'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-display text-2xl text-ink">{o.label}</div>
                        <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${o.recommended ? 'bg-ember text-white' : 'bg-leaf/10 text-leaf'}`}>
                          {o.tag}{o.recommended ? ' · recomendada' : ''}
                        </span>
                      </div>
                      {active && <CheckCircle2 className="w-5 h-5 text-ember shrink-0" />}
                    </div>

                    <div className="mt-4 text-sm font-black text-ember">{o.totalEstimate}</div>
                    <div className="mt-1 text-xs font-bold text-ink/60">{o.perDayEstimate}</div>
                    <p className="mt-3 text-sm text-ink-soft leading-relaxed">{o.description}</p>

                    <div className="mt-4 rounded-xl bg-leaf/5 p-3">
                      <div className="text-[11px] font-black uppercase tracking-wider text-leaf">Qué cambia respecto a media</div>
                      <p className="mt-1 text-sm text-ink-soft leading-relaxed">{o.differenceFromMedium}</p>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm">
                      <div>
                        <div className="font-black text-ink">Mejoras</div>
                        <ul className="mt-1 list-disc pl-5 text-ink-soft space-y-1">
                          {o.upgrades.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="font-black text-ink">Sacrificios</div>
                        <ul className="mt-1 list-disc pl-5 text-ink-soft space-y-1">
                          {o.tradeoffs.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-2">
                      <button
                        onClick={() => activateMutation.mutate(o.id)}
                        disabled={activateMutation.isPending}
                        className="nusa-btn-ember w-full disabled:opacity-60"
                      >
                        {active ? 'Volver a cargar esta opción' : 'Usar esta opción como itinerario'}
                      </button>
                      <button
                        onClick={() => toast.message('Regeneración selectiva', { description: 'Para regenerar solo esta opción, usa Inicio manteniendo los mismos datos y elige después esta versión.' })}
                        className="nusa-btn-ghost w-full inline-flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" /> Regenerar solo esta opción
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {days.length > 0 && activeOption && (
          <section className="mb-6 nusa-leaf-box">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="kicker kicker-sun">Presupuesto activo</div>
                <div className="font-display text-2xl text-white mt-1">{activeOption.label}</div>
                <p className="mt-1 text-white/80 text-sm">{activeOption.totalEstimate}</p>
              </div>
              <span className="inline-flex self-start rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-black text-nusa-sun">
                {activeOption.perDayEstimate}
              </span>
            </div>
          </section>
        )}

        {variants.length >= 3 && options.length === 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <WalletCards className="w-5 h-5 text-ember" />
              <div>
                <div className="kicker kicker-ember">Elige versión de presupuesto</div>
                <p className="text-sm text-ink-soft mt-1">Las 3 opciones respetan destino, duración, viajeros, ritmo, intereses y restricciones seleccionadas.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {variants.map((v) => {
                const active = activeVariant?.id === v.id
                return (
                  <button key={v.id} onClick={() => { setSelectedVariantId(v.id); setSelectedId(null) }} className={`text-left rounded-2xl border p-4 transition ${active ? 'bg-white border-ember shadow-[0_12px_34px_rgba(232,119,34,0.18)]' : 'bg-white/65 border-leaf/12 hover:bg-white'}`} aria-pressed={active}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-display text-2xl text-ink">{v.label}</div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${active ? 'bg-ember text-white' : 'bg-leaf/10 text-leaf'}`}>{v.tag}</span>
                    </div>
                    <div className="mt-2 text-sm font-black text-ember">{v.totalEstimate}</div>
                    <p className="mt-2 text-sm text-ink-soft leading-relaxed">{v.description}</p>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {days.length === 0 && options.length === 0 && !isLoading && !isError && (
          <div className="nusa-card-paper p-10 text-center text-ink-soft">
            <WalletCards className="w-8 h-8 mx-auto text-ember mb-3" />
            Genera el viaje desde Inicio para ver las tres opciones de presupuesto.
          </div>
        )}

        {days.length > 0 && (
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            <aside>
              <div className="lg:sticky lg:top-24">
                <div className="kicker kicker-leaf mb-3">Los {days.length} días</div>
                <div className="flex lg:flex-col gap-2 overflow-x-auto nusa-scroll-paper pb-2 lg:pb-0 lg:max-h-[70vh] lg:overflow-y-auto">
                  {days.map((d) => {
                    const active = d.id === selected?.id
                    return (
                      <button key={d.id} onClick={() => setSelectedId(d.id)} className={`shrink-0 lg:shrink text-left rounded-xl border p-3 transition min-w-[220px] lg:min-w-0 ${active ? 'border-ember bg-white shadow-[0_10px_28px_rgba(232,119,34,0.18)]' : 'border-leaf/12 bg-white/60 hover:bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${d.image})` }} />
                          <div className="min-w-0">
                            <div className="text-[11px] font-black text-ember uppercase tracking-wider">Día {d.day} · {d.zone.split('·')[0].trim()}</div>
                            <div className="font-display text-sm text-ink leading-tight truncate">{d.title}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            <div>
              {selected ? (
                <DayDetail key={selected.id} day={selected} days={days} onSelect={setSelectedId} />
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
