'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFauna } from '@/lib/client/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Search, Star, Clock, ExternalLink, MapPin, PawPrint } from 'lucide-react'
import type { FaunaActivity } from '@/lib/types'
import { ALL_REGIONS, ACTIVITY_DIFFICULTIES } from '@/lib/types'

const FAUNA_FAMILIAS = [
  'Primates', 'Aves', 'Fauna marina', 'Reptiles', 'Mamíferos marinos',
  'Buceo', 'Insectos', 'Fauna terrestre / safari', 'Fauna nocturna',
  'Conservación marina', 'Conservación / tortugas', 'Tortugas / costa',
  'Elefantes / cautiverio', 'Fauna doméstica / cultura', 'Mamíferos voladores',
  'Mariposas / karst', 'Fauna intermareal', 'Fauna acuática singular',
  'Cueva / fauna secundaria', 'Selva / fauna secundaria',
]

function getEmoji(familia: string): string {
  const f = familia.toLowerCase()
  if (f.includes('primate') || f.includes('macaco') || f.includes('mono')) return '🐒'
  if (f.includes('ave') || f.includes('bird')) return '🦜'
  if (f.includes('marina') || f.includes('marino') || f.includes('buceo') || f.includes('snorkel') || f.includes('manta') || f.includes('tiburón') || f.includes('delfín')) return '🐠'
  if (f.includes('reptil') || f.includes('komodo') || f.includes('tortuga')) return '🦎'
  if (f.includes('elefante')) return '🐘'
  if (f.includes('insecto') || f.includes('mariposa')) return '🦋'
  if (f.includes('nocturna') || f.includes('murciélago') || f.includes('volador')) return '🦇'
  if (f.includes('cueva')) return '🕳️'
  if (f.includes('selva') || f.includes('terrestre') || f.includes('safari')) return '🐅'
  if (f.includes('intermareal') || f.includes('acuática')) return '🦀'
  if (f.includes('conservación')) return '🌿'
  if (f.includes('doméstica') || f.includes('cultura')) return '🐔'
  return '🦎'
}

function DetailSheet({ item, open, onOpenChange }: { item: FaunaActivity | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!item) return null
  const fotos = [item.foto1, item.foto2, item.foto3].filter(Boolean)
  const emoji = getEmoji(item.familia)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-paper text-ink nusa-scroll border-l-2 border-ember/30">
        <SheetHeader><SheetTitle className="font-display text-2xl text-ink">{emoji} {item.name}</SheetTitle></SheetHeader>
        {fotos[0] ? <img src={fotos[0]} alt={item.name} className="w-full h-52 object-cover rounded-lg mt-4" /> : <div className="w-full h-52 bg-gradient-to-br from-ember/20 to-nusa-sun/10 rounded-lg mt-4 flex items-center justify-center text-6xl">{emoji}</div>}
        {fotos.length > 1 && <div className="flex gap-2 mt-2 overflow-x-auto nusa-scroll">{fotos.slice(1).map((f, i) => <img key={i} src={f} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0" />)}</div>}
        <div className="mt-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-ember/10 text-ember">{item.tipoActividad || 'Fauna'}</Badge>
            <Badge variant="secondary" className="bg-nusa-jungle/10 text-nusa-jungle">{item.dificultad}</Badge>
            <Badge variant="secondary" className="bg-nusa-teal/10 text-nusa-teal">{item.zone}</Badge>
            {item.especie && <Badge variant="secondary" className="bg-amber-100 text-amber-800">{item.especie}</Badge>}
          </div>
          <p className="text-ink/80 leading-relaxed">{item.description}</p>
          {item.queVer && <p><strong>Fauna objetivo:</strong> {item.queVer}</p>}
          {item.mejorEpoca && <p><strong>Mejor época:</strong> {item.mejorEpoca}</p>}
          {item.duracion && <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-ink/50" /><strong>Duración:</strong> {item.duracion}</p>}
          {item.peligro && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-xs font-bold text-red-700">⚠️ Seguridad</p><p className="mt-1 text-red-800">{item.peligro}</p></div>}
          <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-nusa-sun text-nusa-sun" /><span className="font-bold">{item.rating.toFixed(1)}</span></div>
          <div className="flex gap-2 pt-2">
            {item.wazeUrl && <Button size="sm" className="nusa-btn-primary" asChild><a href={item.wazeUrl} target="_blank" rel="noopener"><MapPin className="w-4 h-4 mr-1" />Mapa</a></Button>}
            {item.webUrl && <Button size="sm" variant="outline" className="border-leaf text-leaf hover:bg-leaf/10" asChild><a href={item.webUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Fuente</a></Button>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function FaunaPage() {
  const { data, isLoading } = useQuery({ queryKey: ['fauna'], queryFn: () => getFauna() })
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [diff, setDiff] = useState('')
  const [selected, setSelected] = useState<FaunaActivity | null>(null)

  const fauna = data?.fauna ?? []
  const filtered = fauna.filter(f => {
    if (region && f.region !== region) return false
    if (diff && f.dificultad !== diff) return false
    if (search) {
      const s = search.toLowerCase()
      if (!f.name.toLowerCase().includes(s) && !f.description.toLowerCase().includes(s) && !f.especie.toLowerCase().includes(s)) return false
    }
    return true
  })

  return (
    <div className="nusa-paper min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <span className="kicker" style={{ color: 'var(--color-nusa-ember)' }}>Fauna de Indonesia</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">
            <PawPrint className="w-8 h-8 sm:w-10 sm:h-10 inline mr-2 -mt-1 text-ember" />
            {fauna.length} experiencias
          </h1>
        </header>
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <Input placeholder="Buscar especie o actividad..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-paper-2 border-paper-2/50 focus:border-ember" />
          </div>
          <select value={region} onChange={e => setRegion(e.target.value)} className="nusa-select text-sm">
            <option value="">Todas las regiones</option>
            {ALL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={diff} onChange={e => setDiff(e.target.value)} className="nusa-select text-sm">
            <option value="">Dificultad</option>
            {ACTIVITY_DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((f, i) => {
              const emoji = getEmoji(f.familia)
              return (
                <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => setSelected(f)} className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-paper-2/50 transition-all">
                  <div className="h-40 bg-gradient-to-br from-ember/20 to-nusa-sun/10 relative overflow-hidden">
                    {f.foto1
                      ? <img src={f.foto1} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl">{emoji}</div>
                    }
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-xs font-bold text-ink flex items-center gap-1">
                      <Star className="w-3 h-3 fill-nusa-sun text-nusa-sun" />{f.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base text-ink leading-snug line-clamp-2">{f.name}</h3>
                    <p className="text-sm text-ink/60 mt-1">{f.zone} · {f.subzone}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs bg-ember/10 text-ember">{f.tipoActividad || 'Fauna'}</Badge>
                      {f.duracion && <span className="text-xs text-ink/50">🕐 {f.duracion}</span>}
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