'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getElefantes } from '@/lib/client/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { Search, Star, Clock, ExternalLink, MapPin, ShieldAlert, ThumbsUp, ThumbsDown, Lightbulb, DollarSign, Truck, Heart, Hand } from 'lucide-react'
import type { ElephantActivity } from '@/lib/types'
import { ALL_REGIONS } from '@/lib/types'

function respetoColor(nivel: string): string {
  const n = nivel.toLowerCase()
  if (n.includes('alto')) return 'text-green-700 bg-green-100 border-green-200'
  if (n.includes('medio-alto')) return 'text-emerald-700 bg-emerald-100 border-emerald-200'
  if (n.includes('medio')) return 'text-amber-700 bg-amber-100 border-amber-200'
  if (n.includes('bajo')) return 'text-red-700 bg-red-100 border-red-200'
  return 'text-ink/70 bg-ink/5 border-ink/10'
}

function recomendacionStyle(rec: string): string {
  const r = rec.toLowerCase()
  if (r.includes('recomendab')) return 'bg-green-100 text-green-800 border-green-200'
  if (r.includes('con reservas')) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (r.includes('no priorizar')) return 'bg-gray-100 text-gray-600 border-gray-200'
  if (r.includes('disclaimer')) return 'bg-orange-100 text-orange-800 border-orange-200'
  if (r.includes('solo investigación')) return 'bg-purple-100 text-purple-700 border-purple-200'
  if (r.includes('opción secundaria')) return 'bg-blue-100 text-blue-700 border-blue-200'
  return 'bg-ink/5 text-ink/70 border-ink/10'
}

function DetailSheet({ item, open, onOpenChange }: { item: ElephantActivity | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!item) return null
  const fotos = [item.foto1, item.foto2, item.foto3].filter(Boolean)
  const hasFicha = !!(item.precio1Dia || item.nivelRespeto || item.opinionPositiva)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-paper text-ink nusa-scroll border-l-2 border-ember/30">
        <SheetHeader><SheetTitle className="font-display text-xl sm:text-2xl text-ink leading-tight">🐘 {item.name}</SheetTitle></SheetHeader>

        {/* Photos */}
        {fotos[0] ? (
          <div className="mt-4">
            <img src={fotos[0]} alt={item.name} className="w-full h-48 object-cover rounded-lg" />
            {fotos.length > 1 && (
              <div className="flex gap-2 mt-2">
                {fotos.slice(1).map((f, i) => <img key={i} src={f} alt="" className="w-20 h-20 object-cover rounded-lg" />)}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-ember/20 to-nusa-sun/10 rounded-lg mt-4 flex items-center justify-center text-6xl">🐘</div>
        )}

        <div className="mt-4 space-y-4">
          {/* Top badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-ember/10 text-ember">{item.tipoActividad || 'Experiencia'}</Badge>
            <Badge variant="secondary" className="bg-nusa-jungle/10 text-nusa-jungle">{item.region}</Badge>
            {item.mejorHora && <Badge variant="outline" className="border-leaf/30 text-leaf">🕐 {item.mejorHora}</Badge>}
          </div>

          {/* Description */}
          <p className="text-ink/80 leading-relaxed text-sm">{item.description}</p>

          {/* What to see */}
          {item.queVer && !item.precio1Dia && (
            <div>
              <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">Qué ver</p>
              <p className="text-sm text-ink/80">{item.queVer}</p>
            </div>
          )}

          {/* ── FICHA DEL MANIFEST ── */}
          {hasFicha && (
            <>
              <Separator className="bg-ember/20" />

              {/* Nivel de respeto animal */}
              {item.nivelRespeto && (
                <div className={`rounded-lg border p-3 ${respetoColor(item.nivelRespeto)}`}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
                    <Heart className="w-3.5 h-3.5" /> Nivel de respeto animal
                  </div>
                  <p className="text-sm">{item.nivelRespeto}</p>
                </div>
              )}

              {/* Nivel de contacto */}
              {item.nivelContacto && (
                <div className="rounded-lg border border-ink/10 p-3 bg-paper-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">
                    <Hand className="w-3.5 h-3.5" /> Nivel de contacto
                  </div>
                  <p className="text-sm text-ink/80">{item.nivelContacto}</p>
                </div>
              )}

              {/* Recomendación editorial */}
              {item.recomendacion && (
                <Badge variant="outline" className={`text-xs px-3 py-1.5 border ${recomendacionStyle(item.recomendacion)}`}>
                  {item.recomendacion}
                </Badge>
              )}

              {/* Precios */}
              {(item.precio1Dia || item.precio2Dias || item.precio3Dias) && (
                <div className="rounded-lg border border-ink/10 p-3 bg-paper-2">
                  <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Precios orientativos (IDR)
                  </p>
                  {item.precio1Dia && <p className="text-sm"><span className="text-ink/50">1 día:</span> {item.precio1Dia}</p>}
                  {item.precio2Dias && <p className="text-sm"><span className="text-ink/50">2 días:</span> {item.precio2Dias}</p>}
                  {item.precio3Dias && <p className="text-sm"><span className="text-ink/50">3 días:</span> {item.precio3Dias}</p>}
                  {item.precioFecha && <p className="text-xs text-ink/40 mt-1">📅 {item.precioFecha}</p>}
                </div>
              )}

              {/* Logística */}
              {item.logistica && (
                <div>
                  <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> Cómo llegar
                  </p>
                  <p className="text-sm text-ink/80">{item.logistica}</p>
                </div>
              )}

              {/* Duración */}
              {(item.duracion || item.mejorEpoca) && (
                <div className="flex gap-4">
                  {item.duracion && <p className="flex items-center gap-1.5 text-sm"><Clock className="w-4 h-4 text-ink/40" />{item.duracion}</p>}
                  {item.mejorEpoca && <p className="text-sm text-ink/60">📅 {item.mejorEpoca}</p>}
                </div>
              )}

              {/* Opiniones de viajeros */}
              {(item.opinionPositiva || item.opinionNegativa) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-ink/60 uppercase tracking-wider">Opiniones de viajeros</p>
                  {item.opinionPositiva && (
                    <div className="flex gap-2 text-sm">
                      <ThumbsUp className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-ink/80">{item.opinionPositiva}</p>
                    </div>
                  )}
                  {item.opinionNegativa && (
                    <div className="flex gap-2 text-sm">
                      <ThumbsDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-ink/70">{item.opinionNegativa}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Consejos operativos */}
              {item.consejos && (
                <div className="rounded-lg border border-nusa-sun/30 bg-nusa-sun/5 p-3">
                  <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-nusa-sun" /> Consejos
                  </p>
                  <p className="text-sm text-ink/80">{item.consejos}</p>
                </div>
              )}

              {/* Riesgos / Seguridad */}
              {item.peligro && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Riesgos y alertas
                  </p>
                  <p className="text-sm text-red-800">{item.peligro}</p>
                </div>
              )}

              {/* Estado verificación */}
              {item.estadoVerificacion && (
                <p className="text-xs text-ink/40 italic">{item.estadoVerificacion}</p>
              )}
            </>
          )}

          {/* ── FICHA ORIGINAL (sin manifest) ── */}
          {!hasFicha && (
            <>
              {item.queVer && (
                <div>
                  <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">Qué ver</p>
                  <p className="text-sm text-ink/80">{item.queVer}</p>
                </div>
              )}
              {item.mejorEpoca && <p className="text-sm"><strong>Mejor época:</strong> {item.mejorEpoca}</p>}
              {item.duracion && <p className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-ink/40" /><strong>Duración:</strong> {item.duracion}</p>}
              {item.peligro && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-700">⚠️ Nota de seguridad</p>
                  <p className="mt-1 text-sm text-red-800">{item.peligro}</p>
                </div>
              )}
            </>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-nusa-sun text-nusa-sun" /><span className="font-bold">{item.rating.toFixed(1)}</span></div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {item.wazeUrl && <Button size="sm" className="nusa-btn-primary" asChild><a href={item.wazeUrl} target="_blank" rel="noopener"><MapPin className="w-4 h-4 mr-1" />Waze</a></Button>}
            {item.webUrl && <Button size="sm" variant="outline" className="border-leaf text-leaf hover:bg-leaf/10" asChild><a href={item.webUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Maps</a></Button>}
            {item.sourceUrl && !item.webUrl?.includes('google.com') && <Button size="sm" variant="outline" className="border-ink/20 text-ink/60 hover:bg-ink/5" asChild><a href={item.sourceUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Fuente</a></Button>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ElefantesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['elefantes'], queryFn: () => getElefantes() })
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [selected, setSelected] = useState<ElephantActivity | null>(null)

  const elephants = data?.elephants ?? []
  const filtered = elephants.filter(e => {
    if (region && e.region !== region) return false
    if (search) { const s = search.toLowerCase(); if (!e.name.toLowerCase().includes(s) && !e.description.toLowerCase().includes(s)) return false }
    return true
  })

  return (
    <div className="nusa-paper min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <span className="kicker kicker-ember">Experiencias con elefantes</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">{elephants.length} encuentros</h1>
        </header>
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" /><Input placeholder="Buscar experiencia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-paper-2 border-paper-2/50 focus:border-ember" /></div>
          <select value={region} onChange={e => setRegion(e.target.value)} className="nusa-select text-sm"><option value="">Todas las regiones</option>{ALL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((e, i) => {
              const hasFicha = !!(e.precio1Dia || e.nivelRespeto || e.opinionPositiva)
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(e)} className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-paper-2/50 transition-all">
                  <div className="h-40 bg-gradient-to-br from-ember/20 to-nusa-sun/10 relative overflow-hidden">
                    {e.foto1 ? <img src={e.foto1} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-5xl">🐘</div>}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-xs font-bold text-ink flex items-center gap-1"><Star className="w-3 h-3 fill-nusa-sun text-nusa-sun" />{e.rating.toFixed(1)}</div>
                    {hasFicha && <div className="absolute top-3 left-3 bg-ember/90 text-white rounded-full px-2 py-0.5 text-xs font-bold">Ficha completa</div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg text-ink leading-snug">{e.name}</h3>
                    <p className="text-sm text-ink/60 mt-1">{e.zone}{e.subzone ? ` · ${e.subzone}` : ''}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs bg-ember/10 text-ember">{e.tipoActividad || 'Experiencia'}</Badge>
                      {e.nivelRespeto && <Badge variant="secondary" className={`text-xs border ${respetoColor(e.nivelRespeto)}`}>{e.nivelRespeto.split('/')[0].trim()}</Badge>}
                      {e.mejorHora && <span className="text-xs text-ink/50">🕐 {e.mejorHora}</span>}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
        {!isLoading && filtered.length === 0 && <p className="text-center text-ink/50 py-12">Sin resultados.</p>}
      </div>
      <DetailSheet item={selected} open={!!selected} onOpenChange={v => !v && setSelected(null)} />
    </div>
  )
}