'use client'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPlayas } from '@/lib/client/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Search, ExternalLink, MapPin, ShieldAlert, Lightbulb } from 'lucide-react'
import type { Playa } from '@/lib/types'
import { PLAYA_REGIONS, PLAYA_PERFILES } from '@/lib/types'

const PRIORIDAD_STYLE: Record<string, string> = { alta: 'bg-nusa-jungle text-white', media: 'bg-nusa-sun text-ink', baja: 'bg-ink/20 text-ink/60' }

function PhotoGallery({ fotos, name }: { fotos: string[]; name: string }) {
  const [active, setActive] = useState(fotos[0] || '')
  useEffect(() => { setActive(fotos[0] || '') }, [fotos.join('|')])
  if (!active) return null
  return (
    <div className="mt-4">
      <img src={active} alt={name} className="w-full h-56 object-cover rounded-lg bg-paper-2" />
      {fotos.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 nusa-scroll-paper">
          {fotos.map((f, i) => (
            <button key={`${f}-${i}`} type="button" onClick={() => setActive(f)} className={`shrink-0 rounded-lg overflow-hidden border-2 ${active === f ? 'border-nusa-teal' : 'border-transparent'}`} aria-label={`Ver foto ${i + 1} de ${name}`}>
              <img src={f} alt={`${name} ${i + 1}`} className="w-20 h-20 object-cover bg-paper-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailSheet({ item, open, onOpenChange }: { item: Playa | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!item) return null
  const fotos = [item.foto1, item.foto2, item.foto3].filter(Boolean)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-paper text-ink nusa-scroll border-l-2 border-nusa-teal/30">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-ink">{item.name}</SheetTitle>
        </SheetHeader>
        <PhotoGallery fotos={fotos} name={item.name} />
        <div className="mt-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-nusa-teal/10 text-nusa-teal">{item.zone}</Badge>
            <Badge variant="secondary" className={PRIORIDAD_STYLE[item.prioridad] || ''}>{item.prioridad.toUpperCase()}</Badge>
            {item.perfilPlaya && <Badge variant="secondary" className="bg-nusa-jungle/10 text-nusa-jungle">{item.perfilPlaya}</Badge>}
          </div>
          <p className="text-ink/80 leading-relaxed">{item.descripcion}</p>
          {item.mejorHora && <p><span className="font-bold text-ink">Mejor hora:</span> {item.mejorHora}</p>}
          {item.banio && <p><span className="font-bold text-ink">Baño:</span> {item.banio}</p>}
          {item.acceso && <p><span className="font-bold text-ink">Acceso:</span> {item.acceso}</p>}
          {item.caracteristicas && <div className="flex flex-wrap gap-1">{item.caracteristicas.split(',').map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c.trim()}</Badge>)}</div>}
          {item.seguridad && (
            <div className={`rounded-lg p-3 ${item.seguridad.toLowerCase().includes('peligro') || item.seguridad.toLowerCase().includes('corriente') ? 'bg-red-50 border border-red-200' : 'bg-paper-2'}`}>
              <p className="text-xs font-bold flex items-center gap-1 text-red-700"><ShieldAlert className="w-3.5 h-3.5" />Seguridad</p>
              <p className={`mt-1 ${item.seguridad.toLowerCase().includes('peligro') || item.seguridad.toLowerCase().includes('corriente') ? 'text-red-800' : 'text-ink/70'}`}>{item.seguridad}</p>
            </div>
          )}
          {item.consejos && (
            <div className="bg-nusa-sun/10 rounded-lg p-3">
              <p className="text-xs font-bold flex items-center gap-1 text-nusa-sun"><Lightbulb className="w-3.5 h-3.5" />Consejos</p>
              <p className="mt-1 text-ink/80">{item.consejos}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2 flex-wrap">
            {item.wazeUrl && <Button size="sm" className="nusa-btn-primary" asChild><a href={item.wazeUrl} target="_blank" rel="noopener"><MapPin className="w-4 h-4 mr-1" />Waze</a></Button>}
            {item.googleMapsUrl && <Button size="sm" variant="outline" className="border-leaf text-leaf hover:bg-leaf/10" asChild><a href={item.googleMapsUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Google Maps</a></Button>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function PlayasPage() {
  const { data, isLoading } = useQuery({ queryKey: ['playas'], queryFn: () => getPlayas() })
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [perfil, setPerfil] = useState('')
  const [selected, setSelected] = useState<Playa | null>(null)

  const playas = data?.playas ?? []
  const filtered = playas.filter(p => {
    if (region && p.region !== region) return false
    if (perfil && p.perfilPlaya !== perfil) return false
    if (search) { const s = search.toLowerCase(); if (!p.name.toLowerCase().includes(s) && !p.descripcion.toLowerCase().includes(s) && !p.caracteristicas.toLowerCase().includes(s)) return false }
    return true
  })

  return (
    <div className="nusa-paper min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <span className="kicker" style={{ color: 'var(--color-nusa-teal)' }}>Playas de Indonesia</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">{playas.length} playas catalogadas</h1>
        </header>
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <Input placeholder="Buscar playa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-paper-2 border-paper-2/50 focus:border-nusa-teal" />
          </div>
          <select value={region} onChange={e => setRegion(e.target.value)} className="nusa-select text-sm">
            <option value="">Todas las regiones</option>
            {PLAYA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={perfil} onChange={e => setPerfil(e.target.value)} className="nusa-select text-sm">
            <option value="">Todos los perfiles</option>
            {PLAYA_PERFILES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(p)} className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-paper-2/50 transition-all">
                <div className="h-40 bg-gradient-to-br from-nusa-teal/20 to-nusa-sea/10 relative overflow-hidden">
                  {p.foto1 ? <img src={p.foto1} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🏖️</div>}
                  <div className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-bold ${PRIORIDAD_STYLE[p.prioridad] || 'bg-ink/20'}`}>{p.prioridad}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg text-ink leading-snug">{p.name}</h3>
                  <p className="text-sm text-ink/60 mt-1">{p.zone} · {p.subzone}</p>
                  {p.caracteristicas && <div className="flex flex-wrap gap-1 mt-2">{p.caracteristicas.split(',').slice(0, 3).map((c, j) => <Badge key={j} variant="outline" className="text-[10px] px-1.5 py-0">{c.trim()}</Badge>)}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && <p className="text-center text-ink/50 py-12">No se encontraron playas con esos filtros.</p>}
      </div>
      <DetailSheet item={selected} open={!!selected} onOpenChange={v => !v && setSelected(null)} />
    </div>
  )
}
