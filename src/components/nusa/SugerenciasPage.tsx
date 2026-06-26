'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Inbox, Loader2, Sparkles } from 'lucide-react'
import { getSuggestions, applySuggestions } from '@/lib/client/api'
import { SuggestionForm } from './SuggestionForm'
import { SuggestionCard } from './SuggestionCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { SuggestionStatus } from '@/lib/types'

type StatusFilter = 'all' | SuggestionStatus
type AuthorFilter = 'all' | 'Iria' | 'Izan'

export function SugerenciasPage({ onApplied }: { onApplied: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['suggestions'],
    queryFn: getSuggestions,
  })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [authorFilter, setAuthorFilter] = useState<AuthorFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)

  const all = data?.suggestions ?? []

  const filtered = useMemo(() => {
    return all
      .filter((s) => (statusFilter === 'all' ? true : s.status === statusFilter))
      .filter((s) => (authorFilter === 'all' ? true : s.author === authorFilter))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [all, statusFilter, authorFilter])

  const counts = useMemo(() => {
    return {
      all: all.length,
      pending: all.filter((s) => s.status === 'pending').length,
      applied: all.filter((s) => s.status === 'applied').length,
      rejected: all.filter((s) => s.status === 'rejected').length,
    }
  }, [all])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedIds = useMemo(
    () =>
      Array.from(selected).filter((id) =>
        all.find((s) => s.id === id && s.status === 'pending')
      ),
    [selected, all]
  )

  async function handleBulkApply() {
    if (selectedIds.length === 0 || applying) return
    setApplying(true)
    try {
      const res = await applySuggestions(selectedIds)
      toast.success(res.message, {
        description: `${res.applied} aplicadas · ${res.daysAdded} días añadidos.`,
      })
      setSelected(new Set())
      await qc.invalidateQueries({ queryKey: ['suggestions'] })
      await qc.invalidateQueries({ queryKey: ['itinerary'] })
      onApplied()
    } catch (e) {
      toast.error('No se pudo regenerar el itinerario.', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="nusa-paper min-h-full pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <span className="kicker kicker-ember">Zona de Izan & Iria</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">
            Lo que vais encontrando por ahí
          </h1>
          <p className="mt-3 text-ink-soft max-w-2xl leading-relaxed">
            Esta es vuestra sección. Subid enlaces de Instagram, hoteles,
            fotos, documentos, actividades, playas o lo que veáis por ahí.
            Más tarde lo aplicamos al itinerario y se regenera con lo
            elegido. Marca varias aportaciones y pulsa el botón ember para
            regenerar el viaje.
          </p>
          <hr className="nusa-divider mt-5" />
        </header>

        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          {/* Form (sticky on desktop) */}
          <div className="lg:sticky lg:top-24 self-start">
            <SuggestionForm />
          </div>

          {/* List */}
          <div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <FilterGroup
                label="Estado"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
                options={[
                  { value: 'all', label: `Todas (${counts.all})` },
                  { value: 'pending', label: `Pendientes (${counts.pending})` },
                  { value: 'applied', label: `Aplicadas (${counts.applied})` },
                  { value: 'rejected', label: `Rechazadas (${counts.rejected})` },
                ]}
              />
              <FilterGroup
                label="Autor"
                value={authorFilter}
                onChange={(v) => setAuthorFilter(v as AuthorFilter)}
                options={[
                  { value: 'all', label: 'Ambos' },
                  { value: 'Iria', label: 'Iria' },
                  { value: 'Izan', label: 'Izan' },
                ]}
              />
            </div>

            {isLoading && (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-2xl bg-leaf/10" />
                ))}
              </div>
            )}

            {isError && (
              <div className="nusa-card-paper p-6 text-ink-soft">
                No pudimos cargar el buzón. Reintenta en unos segundos.
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="nusa-card-paper p-10 text-center text-ink-soft">
                <Inbox className="w-8 h-8 mx-auto text-ember mb-3" />
                No hay aportaciones con este filtro todavía.
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  selected={selected.has(s.id)}
                  onToggleSelect={toggle}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk apply bar — sits above the app footer pager */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 nusa-no-print">
          <div className="mx-auto max-w-3xl px-4">
            <div className="nusa-panel px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
              <div className="flex items-center gap-2 text-white">
                <span className="w-7 h-7 rounded-full bg-nusa-sun text-nusa-ink grid place-items-center font-black text-sm">
                  {selectedIds.length}
                </span>
                <span className="text-sm font-bold">
                  {selectedIds.length === 1
                    ? '1 aportación seleccionada'
                    : `${selectedIds.length} seleccionadas`}
                </span>
              </div>
              <button
                onClick={handleBulkApply}
                disabled={applying}
                className="nusa-btn-primary inline-flex items-center gap-2 text-sm"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerando itinerario…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Aplicar y regenerar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* success decoration when applying */}
      {applying && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/30 backdrop-blur-sm nusa-no-print">
          <div className="nusa-panel px-8 py-6 flex items-center gap-3 text-white">
            <Loader2 className="w-6 h-6 animate-spin text-nusa-sun" />
            <div>
              <div className="font-display text-lg">Regenerando itinerario</div>
              <div className="text-xs text-white/60">
                Aplicando las aportaciones de Iria e Izan…
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {applying ? 'Regenerando itinerario' : ''}
      </div>
    </div>
  )
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="kicker kicker-leaf mr-1 hidden sm:inline">{label}</span>
      <div className="flex flex-wrap gap-1 bg-paper-2 border border-leaf/15 rounded-full p-1">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition ${
              value === o.value
                ? 'bg-leaf text-white'
                : 'text-ink-soft hover:bg-leaf/10'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
