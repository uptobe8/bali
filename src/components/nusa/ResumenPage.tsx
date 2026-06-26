'use client'

import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  Users,
  Wallet,
  Gauge,
  Route,
  Inbox,
  Download,
  Printer,
  Check,
  Sparkles,
} from 'lucide-react'
import { getItinerary, getSuggestions } from '@/lib/client/api'
import { EmptyTripState } from './EmptyTripState'
import { toast } from 'sonner'

export function ResumenPage({
  navigate,
}: {
  navigate?: (page: string) => void
}) {
  const { data: itin } = useQuery({ queryKey: ['itinerary'], queryFn: getItinerary })
  const { data: sugg } = useQuery({ queryKey: ['suggestions'], queryFn: getSuggestions })

  const trip = itin?.trip ?? null
  const days = itin?.days ?? []
  const appliedCount =
    sugg?.suggestions.filter((s) => s.status === 'applied').length ?? 0

  const zones = Array.from(
    new Set(days.map((d) => d.zone.split('·')[0].trim()))
  )

  // Empty state: no trip generated yet
  if (!trip) {
    return (
      <div className="nusa-paper min-h-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <header className="mb-8">
            <span className="kicker kicker-ember">Resumen y decisión</span>
            <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">
              La foto final del viaje
            </h1>
            <hr className="nusa-divider mt-5" />
          </header>
          <EmptyTripState
            theme="light"
            icon={<Sparkles className="w-7 h-7" />}
            headline="Aún no has generado tu viaje"
            text="Vuelve a Inicio, rellena el planificador con vuestros datos y pulsa «Genera tu itinerario». Cuando la IA termine, aquí tendrás el resumen con fechas, viajeros, presupuesto y ruta — listo para descargar."
            ctaLabel="Crear mi viaje"
            onCta={() => navigate?.('inicio') ?? window.scrollTo({ top: 0 })}
          />
        </div>
      </div>
    )
  }

  function downloadTxt() {
    if (!trip) return
    const lines: string[] = []
    lines.push('NUSA TRAVEL OS — RESUMEN DEL VIAJE')
    lines.push('='.repeat(48))
    lines.push('')
    lines.push(`Título: ${trip.title}`)
    lines.push(`Destino: ${trip.destination}`)
    lines.push(`Fechas: ${trip.dates}`)
    lines.push(`Viajeros: ${trip.travellers}`)
    lines.push(`Presupuesto: ${trip.budget}`)
    lines.push(`Ritmo: ${trip.pace}`)
    lines.push(`Imprescindibles: ${trip.musts}`)
    if (trip.restrictions) lines.push(`Restricciones: ${trip.restrictions}`)
    lines.push('')
    lines.push('ITINERARIO DÍA A DÍA')
    lines.push('-'.repeat(48))
    days.forEach((d) => {
      lines.push('')
      lines.push(`Día ${d.day} · ${d.zone} — ${d.title}`)
      lines.push(`  Mañana:    ${d.morning}`)
      lines.push(`  Comida:    ${d.lunch}`)
      lines.push(`  Tarde:     ${d.afternoon}`)
      lines.push(`  Noche:     ${d.night}`)
      lines.push(`  Transporte: ${d.transport}`)
      lines.push(`  Coste:      ${d.cost}`)
      lines.push(`  Horario:    ${d.time}`)
      if (d.hotelName) lines.push(`  Hotel:      ${d.hotelName} (${d.hotelPrice ?? '—'})`)
      if (d.mealLunchName) lines.push(`  Comida:     ${d.mealLunchName} (${d.mealLunchPrice ?? '—'})`)
      if (d.mealDinnerName) lines.push(`  Cena:       ${d.mealDinnerName} (${d.mealDinnerPrice ?? '—'})`)
      lines.push(`  Consejo:    ${d.advice}`)
    })
    lines.push('')
    lines.push(`Sugerencias aplicadas al itinerario: ${appliedCount}`)
    lines.push('')
    lines.push('Generado por Nusa Travel OS')
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nusa-travel-resumen.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Resumen descargado.')
  }

  return (
    <div className="nusa-paper min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <span className="kicker kicker-ember">Resumen y decisión</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">
            {trip.title}
          </h1>
          <p className="mt-3 text-ink-soft max-w-2xl leading-relaxed">
            La foto final del viaje: fechas, viajeros, presupuesto, ritmo
            y la ruta comprimida. Listo para descargar, imprimir o
            llevarse en la mochila.
          </p>
          <hr className="nusa-divider mt-5" />
        </header>

        {/* Decision card */}
        <div
          className="rounded-3xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #0b3d2e 0%, #16604a 45%, #e87722 120%)',
          }}
        >
          <div className="relative z-[1]">
            <div className="flex items-center gap-2 text-nusa-sun">
              <Sparkles className="w-5 h-5" />
              <span className="kicker kicker-sun">Veredicto del viaje</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl mt-2 leading-tight max-w-2xl">
              Un viaje que mezcla selva, mar y montaña sin levantar el pie
              del acelerador — con días colchón para respirar.
            </h2>
            <p className="mt-3 text-white/85 max-w-2xl leading-relaxed">
              Bali central para templos y arrozales, Gili Meno para
              snorkel y atardeceres, Uluwatu para playas y beach clubs, y
              dos noches finales en villa de montaña con piscina. Agosto
              seco, presupuesto equilibrado y todo enlazado a Waze.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 bg-white/15 border border-white/25 px-3 py-1.5 rounded-full text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-nusa-sun" /> Gili Meno
              </span>
              <span className="inline-flex items-center gap-1 bg-white/15 border border-white/25 px-3 py-1.5 rounded-full text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-nusa-sun" /> Padang Padang
              </span>
              <span className="inline-flex items-center gap-1 bg-white/15 border border-white/25 px-3 py-1.5 rounded-full text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-nusa-sun" /> Snorkel con tortugas
              </span>
              <span className="inline-flex items-center gap-1 bg-white/15 border border-white/25 px-3 py-1.5 rounded-full text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-nusa-sun" /> Villa final con piscina
              </span>
            </div>
          </div>
        </div>

        {/* Summary grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard
            icon={<CalendarDays className="w-5 h-5" />}
            label="Fechas"
            value={trip?.dates ?? '—'}
          />
          <SummaryCard
            icon={<Users className="w-5 h-5" />}
            label="Viajeros"
            value={trip?.travellers ?? '—'}
          />
          <SummaryCard
            icon={<Wallet className="w-5 h-5" />}
            label="Presupuesto"
            value={trip?.budget ?? '—'}
          />
          <SummaryCard
            icon={<Gauge className="w-5 h-5" />}
            label="Ritmo"
            value={trip?.pace ?? '—'}
          />
          <SummaryCard
            icon={<Route className="w-5 h-5" />}
            label="Ruta"
            value={zones.join(' → ')}
          />
          <SummaryCard
            icon={<Inbox className="w-5 h-5" />}
            label="Sugerencias aplicadas"
            value={`${appliedCount} aportaciones integradas en el itinerario`}
          />
        </div>

        {/* Musts */}
        {trip?.musts && (
          <div className="nusa-leaf-box mt-6">
            <div className="flex items-center gap-2 text-nusa-sun">
              <Sparkles className="w-4 h-4" />
              <span className="kicker kicker-sun">Imprescindibles</span>
            </div>
            <p className="mt-2 text-white/90 leading-relaxed">{trip.musts}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3 nusa-no-print">
          <button
            onClick={downloadTxt}
            className="nusa-btn-ember inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Descargar resumen
          </button>
          <button
            onClick={() => window.print()}
            className="nusa-btn-ghost inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="nusa-card-paper p-5">
      <div className="flex items-center gap-2 text-ember">
        {icon}
        <span className="kicker kicker-ember">{label}</span>
      </div>
      <div className="mt-2 text-ink font-display text-base sm:text-lg leading-snug">
        {value}
      </div>
    </div>
  )
}
