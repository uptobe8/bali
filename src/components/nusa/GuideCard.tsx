'use client'

import { Navigation, ExternalLink, Compass } from 'lucide-react'
import type { GuideEntry } from '@/lib/types'
import { wazeNavigateUrl, googleMapUrl } from '@/lib/types'

export function GuideCard({ entry }: { entry: GuideEntry }) {
  return (
    <article className="nusa-card-paper overflow-hidden flex flex-col">
      {entry.image && (
        <div
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${entry.image})` }}
          aria-hidden
        />
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="nusa-chip nusa-chip-leaf !text-leaf !bg-leaf/10 !border-leaf/25">
            {entry.zone}
          </span>
          {entry.price && entry.price !== '—' && (
            <span className="nusa-chip nusa-chip-sun">{entry.price}</span>
          )}
          {entry.time && entry.time !== '—' && (
            <span className="nusa-chip nusa-chip-blue">{entry.time}</span>
          )}
        </div>
        <h3 className="font-display text-lg text-ink leading-tight">
          {entry.title}
        </h3>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed flex-1">
          {entry.text}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.wazeQuery && (
            <a
              href={wazeNavigateUrl(entry.wazeQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-black bg-gradient-to-br from-nusa-jungle to-nusa-teal text-nusa-ink px-3 py-1.5 rounded-full hover:opacity-90"
            >
              <Navigation className="w-3.5 h-3.5" /> Waze
            </a>
          )}
          {entry.link && (
            <a
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-black border border-leaf/25 text-leaf px-3 py-1.5 rounded-full hover:bg-leaf/5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Web
            </a>
          )}
          <a
            href={googleMapUrl(`${entry.title} ${entry.zone}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-black border border-leaf/25 text-leaf px-3 py-1.5 rounded-full hover:bg-leaf/5"
          >
            <Compass className="w-3.5 h-3.5" /> Mapa
          </a>
        </div>
      </div>
    </article>
  )
}
