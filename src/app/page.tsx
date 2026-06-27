'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Leaf, ChevronLeft, ChevronRight } from 'lucide-react'
import { QueryProvider } from '@/components/nusa/QueryProvider'
import { InicioPage } from '@/components/nusa/InicioPage'
import { ItinerarioPage } from '@/components/nusa/ItinerarioPage'
import { GuiaPage } from '@/components/nusa/GuiaPage'
import { GastronomiaPage } from '@/components/nusa/GastronomiaPage'
import { PlayasPage } from '@/components/nusa/PlayasPage'
import { ActividadesPage } from '@/components/nusa/ActividadesPage'
import { ElefantesPage } from '@/components/nusa/ElefantesPage'
import { FaunaPage } from '@/components/nusa/FaunaPage'
import { MapaPage } from '@/components/nusa/MapaPage'
import { SugerenciasPage } from '@/components/nusa/SugerenciasPage'
import { ResumenPage } from '@/components/nusa/ResumenPage'
import { Toaster } from 'sonner'

type PageId =
  | 'inicio'
  | 'itinerario'
  | 'guia'
  | 'gastronomia'
  | 'playas'
  | 'actividades'
  | 'elefantes'
  | 'fauna'
  | 'mapa'
  | 'sugerencias'
  | 'resumen'

const PAGES: { id: PageId; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'itinerario', label: 'Itinerario' },
  { id: 'guia', label: 'Guía' },
  { id: 'gastronomia', label: 'Gastronomía' },
  { id: 'playas', label: 'Playas' },
  { id: 'actividades', label: 'Actividades' },
  { id: 'elefantes', label: 'Elefantes' },
  { id: 'fauna', label: 'Fauna' },
  { id: 'mapa', label: 'Mapa' },
  { id: 'sugerencias', label: 'Izan & Iria' },
  { id: 'resumen', label: 'Resumen' },
]

function Shell() {
  const [page, setPage] = useState<PageId>('inicio')
  const navigate = useCallback((p: string) => setPage(p as PageId), [])
  const idx = PAGES.findIndex((p) => p.id === page)

  const go = useCallback((dir: number) => {
    setPage((prev) => {
      const i = PAGES.findIndex((p) => p.id === prev)
      const n = (i + dir + PAGES.length) % PAGES.length
      return PAGES[n].id
    })
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [go])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [page])

  return (
    <div className="min-h-screen flex flex-col bg-[#03100b] text-nusa-mist">
      <header className="sticky top-0 z-50 bg-[#041813]/90 backdrop-blur-md border-b border-white/10 nusa-no-print">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <button onClick={() => navigate('inicio')} className="flex items-center gap-2 shrink-0 group self-start" aria-label="Nusa Travel OS — inicio">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-nusa-jungle to-nusa-teal text-nusa-ink shadow-lg group-hover:scale-105 transition">
              <Leaf className="w-5 h-5" />
            </span>
            <span className="hidden sm:block leading-tight">
              <span className="block font-display text-base text-white">Nusa Travel OS</span>
              <span className="block kicker kicker-sun">Indonesia · Bali</span>
            </span>
          </button>
          <nav className="nusa-mobile-nav w-full sm:w-auto sm:ml-auto flex items-center gap-1.5 overflow-x-auto nusa-scroll py-1" aria-label="Navegación principal">
            {PAGES.map((p) => (
              <button key={p.id} onClick={() => navigate(p.id)} className={`nusa-nav-pill ${p.id === page ? 'active' : ''}`} aria-current={p.id === page ? 'page' : undefined}>
                {p.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
            {page === 'inicio' && <InicioPage navigate={navigate} />}
            {page === 'itinerario' && <ItinerarioPage navigate={navigate} />}
            {page === 'guia' && <GuiaPage />}
            {page === 'gastronomia' && <GastronomiaPage />}
            {page === 'playas' && <PlayasPage />}
            {page === 'actividades' && <ActividadesPage />}
            {page === 'elefantes' && <ElefantesPage />}
            {page === 'fauna' && <FaunaPage />}
            {page === 'mapa' && <MapaPage navigate={navigate} />}
            {page === 'sugerencias' && <SugerenciasPage onApplied={() => navigate('itinerario')} />}
            {page === 'resumen' && <ResumenPage navigate={navigate} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-auto bg-[#041813]/95 backdrop-blur-md border-t border-white/10 nusa-no-print">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={() => go(-1)} className="nusa-btn-secondary inline-flex items-center gap-1.5 text-sm !py-2.5 !px-3 sm:!px-4" aria-label="Página anterior">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Anterior</span>
          </button>
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            {PAGES.map((p) => (
              <button key={p.id} onClick={() => navigate(p.id)} className={`nusa-dot shrink-0 ${p.id === page ? 'active' : ''}`} aria-label={`Ir a ${p.label}`} aria-current={p.id === page ? 'page' : undefined} />
            ))}
            <span className="ml-3 text-[11px] text-white/55 font-bold hidden sm:block">{PAGES[idx].label} · {idx + 1}/{PAGES.length}</span>
          </div>
          <button onClick={() => go(1)} className="nusa-btn-secondary inline-flex items-center gap-1.5 text-sm !py-2.5 !px-3 sm:!px-4" aria-label="Página siguiente">
            <span className="hidden sm:inline">Siguiente</span><ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
      <Toaster position="top-center" richColors closeButton theme="dark" />
    </div>
  )
}

export default function Home() {
  return (
    <QueryProvider>
        <Shell />
    </QueryProvider>
  )
}
