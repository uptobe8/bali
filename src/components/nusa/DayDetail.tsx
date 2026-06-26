'use client'

import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Hotel,
  UtensilsCrossed,
  Navigation,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wallet,
  Compass,
  Lightbulb,
  Car,
} from 'lucide-react'
import type { Day } from '@/lib/types'
import { wazeNavigateUrl, googleMapUrl } from '@/lib/types'

interface Props {
  day: Day
  days: Day[]
  onSelect: (id: string) => void
}

export function DayDetail({ day, days, onSelect }: Props) {
  const idx = days.findIndex((d) => d.id === day.id)
  const prev = idx > 0 ? days[idx - 1] : null
  const next = idx < days.length - 1 ? days[idx + 1] : null

  const schedule = [
    { label: 'Mañana', icon: <Sunrise className="w-4 h-4" />, text: day.morning },
    { label: 'Comida', icon: <Sun className="w-4 h-4" />, text: day.lunch },
    { label: 'Tarde', icon: <Sunset className="w-4 h-4" />, text: day.afternoon },
    { label: 'Noche', icon: <Moon className="w-4 h-4" />, text: day.night },
  ]

  const hasHotel = day.hotelName && day.hotelName !== '—' && !day.hotelName.startsWith('—')

  return (
    <article className="nusa-rise">
      {/* Hero */}
      <div
        className="nusa-hero rounded-2xl h-[280px] sm:h-[360px] relative overflow-hidden"
        style={{ backgroundImage: `url(${day.image})` }}
      >
        <div className="absolute inset-0 z-[1] flex flex-col justify-end p-5 sm:p-7">
          <span className="kicker kicker-sun">
            Día {day.day} · {day.zone}
          </span>
          <h2 className="font-display text-2xl sm:text-4xl text-white mt-2 leading-tight max-w-2xl">
            {day.title}
          </h2>
        </div>
      </div>

      <hr className="nusa-divider my-6" />

      {/* Schedule grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {schedule.map((s) => (
          <div key={s.label} className="nusa-card-paper p-4">
            <div className="flex items-center gap-2 text-leaf">
              <span className="text-ember">{s.icon}</span>
              <span className="kicker kicker-leaf">{s.label}</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Hotel + meals row */}
      <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Hotel — leaf box */}
        <div className="nusa-leaf-box">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Hotel className="w-5 h-5 text-nusa-sun" />
              <span className="kicker kicker-sun">Alojamiento</span>
            </div>
            <div className="nusa-stars text-base">★★★★★</div>
          </div>
          {hasHotel ? (
            <>
              <h4 className="font-display text-xl mt-2">{day.hotelName}</h4>
              <div className="flex items-center justify-between gap-3 mt-2">
                <span className="text-sm text-white/80">{day.hotelPrice ?? '—'}</span>
                {day.hotelLink && (
                  <a
                    href={day.hotelLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-black bg-nusa-sun text-nusa-ink px-3 py-1.5 rounded-full hover:opacity-90"
                  >
                    Reservar <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="mt-2 text-white/70 text-sm">
              Sin alojamiento fijo para esta noche — jornada en tránsito.
            </div>
          )}
        </div>

        {/* Meals */}
        <div className="grid gap-3">
          <MealCard
            label="Comida"
            name={day.mealLunchName}
            price={day.mealLunchPrice}
            link={day.mealLunchLink}
          />
          <MealCard
            label="Cena"
            name={day.mealDinnerName}
            price={day.mealDinnerPrice}
            link={day.mealDinnerLink}
          />
        </div>
      </div>

      {/* Transport card */}
      <div className="mt-6 nusa-card-paper p-5">
        <div className="flex items-center gap-2 text-leaf mb-3">
          <Car className="w-4 h-4 text-ember" />
          <span className="kicker kicker-ember">Transporte del día</span>
        </div>
        <p className="text-ink-soft leading-relaxed">{day.transport}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={wazeNavigateUrl(day.wazeQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-gradient-to-br from-nusa-jungle to-nusa-teal text-nusa-ink font-black text-sm px-4 py-2 rounded-full hover:opacity-90"
          >
            <Navigation className="w-4 h-4" /> Abrir en Waze
          </a>
          <a
            href={googleMapUrl(day.mapQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 nusa-btn-ghost text-sm"
          >
            <Compass className="w-4 h-4" /> Ver en mapa
          </a>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetaCard icon={<Clock className="w-4 h-4" />} label="Horario" value={day.time} />
        <MetaCard icon={<Car className="w-4 h-4" />} label="Transporte" value={day.transport.split('·')[0].trim()} />
        <MetaCard icon={<Wallet className="w-4 h-4" />} label="Coste" value={day.cost} />
        <MetaCard icon={<Lightbulb className="w-4 h-4" />} label="Consejo" value={day.advice} />
      </div>

      {/* Prev/Next */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          disabled={!prev}
          onClick={() => prev && onSelect(prev.id)}
          className="nusa-btn-ghost inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Día anterior</span>
          <span className="sm:hidden">Anterior</span>
        </button>
        <div className="text-xs text-ink-soft/60 font-bold">
          {idx + 1} / {days.length}
        </div>
        <button
          disabled={!next}
          onClick={() => next && onSelect(next.id)}
          className="nusa-btn-ember inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Día siguiente</span>
          <span className="sm:hidden">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </article>
  )
}

function MealCard({
  label,
  name,
  price,
  link,
}: {
  label: string
  name: string | null
  price: string | null
  link: string | null
}) {
  return (
    <div className="nusa-card-paper p-4">
      <div className="flex items-center gap-2 text-ember">
        <UtensilsCrossed className="w-4 h-4" />
        <span className="kicker kicker-ember">{label}</span>
      </div>
      {name ? (
        <div className="mt-1.5 flex items-start justify-between gap-2">
          <div>
            <div className="font-display text-base text-ink">{name}</div>
            <div className="text-xs text-ink-soft/70 mt-0.5">{price ?? '—'}</div>
          </div>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${name}`}
              className="text-leaf hover:text-ember transition shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      ) : (
        <div className="mt-1.5 text-sm text-ink-soft/60">—</div>
      )}
    </div>
  )
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-leaf/15 bg-paper-2/60 p-3">
      <div className="flex items-center gap-2 text-ember">
        {icon}
        <span className="kicker kicker-ember">{label}</span>
      </div>
      <div className="text-xs text-ink-soft mt-1.5 leading-relaxed">{value}</div>
    </div>
  )
}
