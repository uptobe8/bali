'use client'

import { useState, useRef, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  Upload,
  Loader2,
  ChevronDown,
  MapPin,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  createSuggestion,
  extractUrl,
  type CreateSuggestionPayload,
} from '@/lib/client/api'
import {
  SUGGESTION_TYPE_META,
  type SuggestionType,
  type SourceKind,
} from '@/lib/types'

const TYPES = Object.keys(SUGGESTION_TYPE_META) as SuggestionType[]

const ICONS: Record<string, React.ReactNode> = {
  Link: <LinkIcon className="w-4 h-4" />,
  Hotel: <Sparkles className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  UtensilsCrossed: <Sparkles className="w-4 h-4" />,
  Palmtree: <Sparkles className="w-4 h-4" />,
  MapPin: <MapPin className="w-4 h-4" />,
  Image: <ImageIcon className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Compass: <Sparkles className="w-4 h-4" />,
}

function guessSourceKind(url: string): SourceKind | undefined {
  const u = url.toLowerCase()
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('airbnb.com')) return 'airbnb'
  if (u.includes('booking.com')) return 'booking'
  if (u.includes('maps.google') || u.includes('google.com/maps'))
    return 'googlemaps'
  return 'web'
}

export function SuggestionForm() {
  const qc = useQueryClient()
  const [author, setAuthor] = useState<'Iria' | 'Izan'>('Iria')
  const [type, setType] = useState<SuggestionType>('link')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [coordsOpen, setCoordsOpen] = useState(false)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedImage, setExtractedImage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function onFileChange(f: File | null) {
    setFile(f)
    if (!f) {
      setFilePreview(null)
      return
    }
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setFilePreview(reader.result as string)
      reader.readAsDataURL(f)
    } else {
      setFilePreview(null)
    }
  }

  async function handleExtractBlur() {
    const u = url.trim()
    if (!u || extracting) return
    setExtracting(true)
    try {
      const res = await extractUrl(u)
      if (!title.trim() && res.title) setTitle(res.title)
      if (res.imageUrl) setExtractedImage(res.imageUrl)
    } catch {
      // silent — best effort
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!title.trim()) {
      toast.error('Falta el título de la aportación.')
      return
    }
    setSubmitting(true)
    try {
      const payload: CreateSuggestionPayload = {
        type,
        title: title.trim(),
        note: note.trim() || undefined,
        url: url.trim() || undefined,
        author,
        sourceKind: url.trim() ? guessSourceKind(url.trim()) : undefined,
        file: file ?? undefined,
      }
      if (lat.trim()) payload.coordsLat = Number(lat)
      if (lng.trim()) payload.coordsLng = Number(lng)
      await createSuggestion(payload)
      toast.success('Aportación subida al buzón.')
      // reset
      setTitle('')
      setNote('')
      setUrl('')
      setFile(null)
      setFilePreview(null)
      setExtractedImage(null)
      setLat('')
      setLng('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      qc.invalidateQueries({ queryKey: ['suggestions'] })
    } catch (err) {
      toast.error('No se pudo subir la aportación.', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="nusa-card-paper p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-ember" />
        <h3 className="font-display text-xl text-ink">Nueva aportación</h3>
      </div>

      {/* Author toggle */}
      <div className="mb-4">
        <Label className="kicker kicker-leaf mb-2 block">¿Quién sube esto?</Label>
        <div className="flex gap-2">
          {(['Iria', 'Izan'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAuthor(a)}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition border-2 ${
                author === a
                  ? a === 'Iria'
                    ? 'bg-nusa-coral text-white border-nusa-coral'
                    : 'bg-nusa-teal text-nusa-ink border-nusa-teal'
                  : 'bg-white text-ink-soft border-leaf/15 hover:border-leaf/40'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="mb-4">
        <Label className="kicker kicker-leaf mb-2 block">Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as SuggestionType)}>
          <SelectTrigger className="bg-white border-leaf/20 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                <span className="flex items-center gap-2">
                  {ICONS[SUGGESTION_TYPE_META[t].icon]}
                  {SUGGESTION_TYPE_META[t].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="mb-4">
        <Label htmlFor="sugg-title" className="kicker kicker-leaf mb-2 block">
          Título
        </Label>
        <Input
          id="sugg-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Clase de buceo en Gili Meno"
          className="bg-white border-leaf/20 rounded-xl"
        />
      </div>

      {/* Note */}
      <div className="mb-4">
        <Label htmlFor="sugg-note" className="kicker kicker-leaf mb-2 block">
          Nota
        </Label>
        <Textarea
          id="sugg-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Por qué te llama la atención, dónde lo viste, para qué día encaja…"
          rows={3}
          className="bg-white border-leaf/20 rounded-xl resize-none"
        />
      </div>

      {/* URL */}
      <div className="mb-4">
        <Label htmlFor="sugg-url" className="kicker kicker-leaf mb-2 block">
          Enlace (Instagram, Airbnb, web)
        </Label>
        <div className="relative">
          <Input
            id="sugg-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleExtractBlur}
            placeholder="https://…"
            className="bg-white border-leaf/20 rounded-xl pr-10"
          />
          {extracting && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-ember" />
          )}
        </div>
        {extracting && (
          <div className="text-[11px] text-ember mt-1 font-bold">
            Extrayendo título e imagen…
          </div>
        )}
        {extractedImage && !filePreview && (
          <div className="mt-2">
            <img
              src={extractedImage}
              alt="Vista previa del enlace"
              className="h-24 rounded-lg object-cover border border-leaf/15"
            />
          </div>
        )}
      </div>

      {/* File */}
      <div className="mb-4">
        <Label className="kicker kicker-leaf mb-2 block">
          Foto o documento (opcional)
        </Label>
        <label
          htmlFor="sugg-file"
          className="flex items-center justify-center gap-2 border-2 border-dashed border-leaf/25 rounded-xl py-5 cursor-pointer hover:bg-leaf/5 text-ink-soft text-sm font-bold"
        >
          <Upload className="w-4 h-4 text-ember" />
          {file ? file.name : 'Subir archivo o foto'}
        </label>
        <Input
          id="sugg-file"
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {filePreview && (
          <img
            src={filePreview}
            alt="Vista previa"
            className="mt-2 h-24 rounded-lg object-cover border border-leaf/15"
          />
        )}
        {file && !filePreview && (
          <div className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
            <FileText className="w-4 h-4 text-ember" />
            {file.name}
          </div>
        )}
      </div>

      {/* Coords (advanced) */}
      <Collapsible open={coordsOpen} onOpenChange={setCoordsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs font-black text-leaf hover:text-ember transition">
          <ChevronDown
            className={`w-3.5 h-3.5 transition ${coordsOpen ? 'rotate-180' : ''}`}
          />
          Coordenadas (avanzado)
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-ink-soft">Latitud</Label>
            <Input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="-8.8153"
              className="bg-white border-leaf/20 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-[11px] text-ink-soft">Longitud</Label>
            <Input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="115.1019"
              className="bg-white border-leaf/20 rounded-xl"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <button
        type="submit"
        disabled={submitting}
        className="nusa-btn-ember w-full mt-5 inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Subiendo…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" /> Subir al buzón
          </>
        )}
      </button>
    </form>
  )
}
