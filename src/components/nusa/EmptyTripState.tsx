'use client'

import { Compass, ArrowRight } from 'lucide-react'

/**
 * Friendly empty-state shown on Itinerario / Mapa / Resumen / Sugerencias
 * when no trip has been generated yet. Uses the dark `.nusa-panel` or the
 * light `.nusa-card-paper` to match the page it lives on.
 */
export function EmptyTripState({
  theme,
  icon,
  headline = 'Aún no has generado tu viaje',
  text = 'Vuelve a Inicio, rellena el planificador con vuestros datos y pulsa «Genera tu itinerario». La IA construye el viaje día a día en unos 2-3 minutos.',
  ctaLabel = 'Crear mi viaje',
  onCta,
}: {
  theme: 'dark' | 'light'
  icon?: React.ReactNode
  headline?: string
  text?: string
  ctaLabel?: string
  onCta: () => void
}) {
  const isDark = theme === 'dark'
  const panelClass = isDark ? 'nusa-panel' : 'nusa-card-paper'
  const headingClass = isDark
    ? 'text-white font-display text-2xl sm:text-3xl'
    : 'text-ink font-display text-2xl sm:text-3xl'
  const textClass = isDark ? 'text-white/70' : 'text-ink-soft'
  const iconWrapClass = isDark
    ? 'w-14 h-14 rounded-2xl grid place-items-center bg-gradient-to-br from-nusa-jungle/30 to-nusa-teal/30 text-nusa-sun'
    : 'w-14 h-14 rounded-2xl grid place-items-center bg-leaf/10 text-ember'

  return (
    <div className="grid place-items-center py-12 sm:py-16 px-4">
      <div
        className={`${panelClass} p-8 sm:p-10 max-w-xl w-full text-center flex flex-col items-center`}
      >
        <div className={iconWrapClass}>
          {icon ?? <Compass className="w-7 h-7" />}
        </div>
        <h2 className={`${headingClass} mt-4 leading-tight`}>{headline}</h2>
        <p className={`mt-3 text-sm leading-relaxed max-w-md ${textClass}`}>
          {text}
        </p>
        <button
          onClick={onCta}
          className="nusa-btn-primary inline-flex items-center gap-2 mt-6 text-base px-6 py-3.5"
        >
          <Compass className="w-5 h-5" /> {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
