'use client'

import {
  Link as LinkIcon,
  Hotel,
  Sparkles,
  UtensilsCrossed,
  Palmtree,
  MapPin,
  Image as ImageIcon,
  FileText,
  Compass,
  ExternalLink,
  Trash2,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Checkbox } from '@/components/ui/checkbox'
import {
  patchSuggestion,
  deleteSuggestion,
} from '@/lib/client/api'
import {
  SUGGESTION_TYPE_META,
  type Suggestion,
  type SuggestionType,
} from '@/lib/types'

const ICONS: Record<string, React.ReactNode> = {
  Link: <LinkIcon className="w-4 h-4" />,
  Hotel: <Hotel className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  UtensilsCrossed: <UtensilsCrossed className="w-4 h-4" />,
  Palmtree: <Palmtree className="w-4 h-4" />,
  MapPin: <MapPin className="w-4 h-4" />,
  Image: <ImageIcon className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
}

const STATUS_STYLE: Record<Suggestion['status'], string> = {
  pending: 'bg-nusa-sun/20 text-nusa-sun border-nusa-sun/40',
  applied: 'bg-nusa-jungle/20 text-nusa-jungle-2 border-nusa-jungle/40',
  rejected: 'bg-black/10 text-ink-soft/60 border-black/15',
}
const STATUS_LABEL: Record<Suggestion['status'], string> = {
  pending: 'Pendiente',
  applied: 'Aplicada',
  rejected: 'Rechazada',
}

interface Props {
  suggestion: Suggestion
  selected: boolean
  onToggleSelect: (id: string) => void
}

export function SuggestionCard({ suggestion, selected, onToggleSelect }: Props) {
  const s = suggestion
  const qc = useQueryClient()
  const [acting, setActing] = useState<null | 'apply' | 'reject' | 'delete'>(null)
  const meta = SUGGESTION_TYPE_META[s.type as SuggestionType] ?? SUGGESTION_TYPE_META.other
  const isPending = s.status === 'pending'

  async function invalidate() {
    await qc.invalidateQueries({ queryKey: ['suggestions'] })
  }

  async function onApply() {
    setActing('apply')
    try {
      await patchSuggestion(s.id, { status: 'applied' })
      toast.success('Aportación marcada como aplicada.')
      await invalidate()
    } catch (e) {
      toast.error('No se pudo aplicar.', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setActing(null)
    }
  }

  async function onReject() {
    setActing('reject')
    try {
      await patchSuggestion(s.id, { status: 'rejected' })
      toast.success('Aportación rechazada.')
      await invalidate()
    } catch (e) {
      toast.error('No se pudo rechazar.', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setActing(null)
    }
  }

  async function onDelete() {
    if (!confirm('¿Eliminar esta aportación del buzón?')) return
    setActing('delete')
    try {
      await deleteSuggestion(s.id)
      toast.success('Aportación eliminada.')
      await invalidate()
    } catch (e) {
      toast.error('No se pudo eliminar.', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setActing(null)
    }
  }

  const authorColor =
    s.author === 'Iria'
      ? 'bg-nusa-coral/15 text-nusa-coral border-nusa-coral/40'
      : 'bg-nusa-teal/15 text-nusa-teal border-nusa-teal/40'

  return (
    <article
      className={`nusa-card-paper p-4 transition ${
        selected ? 'nusa-selected-ring' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {isPending && (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(s.id)}
            className="mt-1 border-leaf/40 data-[state=checked]:bg-ember data-[state=checked]:border-ember"
            aria-label="Seleccionar para aplicar"
          />
        )}
        <div className="flex-1 min-w-0">
          {/* Top row: type + author + status */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="inline-flex items-center gap-1 nusa-chip nusa-chip-leaf !text-leaf !bg-leaf/10 !border-leaf/25">
              {ICONS[meta.icon]}
              {meta.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-black ${authorColor}`}>
              {s.author}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full border text-[11px] font-black ${STATUS_STYLE[s.status]}`}>
              {STATUS_LABEL[s.status]}
            </span>
            {s.sourceKind && (
              <span className="text-[10px] uppercase tracking-wider text-ink-soft/50 font-bold">
                {s.sourceKind}
              </span>
            )}
          </div>

          <h3 className="font-display text-lg text-ink leading-tight">
            {s.title}
          </h3>
          {s.note && (
            <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">
              {s.note}
            </p>
          )}

          {(s.imageUrl || s.filePath) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {s.imageUrl && (
                <img
                  src={s.imageUrl}
                  alt={s.title}
                  className="h-20 rounded-lg object-cover border border-leaf/15"
                />
              )}
              {s.filePath && (
                <a
                  href={s.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold border border-leaf/20 text-leaf px-3 py-2 rounded-lg hover:bg-leaf/5"
                >
                  <FileText className="w-3.5 h-3.5" /> Ver documento
                </a>
              )}
            </div>
          )}

          {s.url && (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-leaf hover:text-ember transition break-all"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[260px]">{s.url}</span>
            </a>
          )}

          {(s.coordsLat != null || s.coordsLng != null) && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-ink-soft/60">
              <MapPin className="w-3 h-3" />
              {s.coordsLat?.toFixed(4)}, {s.coordsLng?.toFixed(4)}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {isPending && (
              <button
                onClick={onApply}
                disabled={acting !== null}
                className="inline-flex items-center gap-1 text-xs font-black bg-leaf text-white px-3 py-1.5 rounded-full hover:opacity-90 disabled:opacity-50"
              >
                {acting === 'apply' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Aplicar
              </button>
            )}
            {s.status !== 'rejected' && (
              <button
                onClick={onReject}
                disabled={acting !== null}
                className="inline-flex items-center gap-1 text-xs font-black border border-black/15 text-ink-soft px-3 py-1.5 rounded-full hover:bg-black/5 disabled:opacity-50"
              >
                {acting === 'reject' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                Rechazar
              </button>
            )}
            <button
              onClick={onDelete}
              disabled={acting !== null}
              className="inline-flex items-center gap-1 text-xs font-black border border-nusa-coral/30 text-nusa-coral px-3 py-1.5 rounded-full hover:bg-nusa-coral/5 disabled:opacity-50"
            >
              {acting === 'delete' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
