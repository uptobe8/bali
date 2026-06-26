'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getActividades, getFauna } from '@/lib/client/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { Search, Star, Clock, Mountain, ExternalLink, MapPin, Lightbulb, ShieldAlert, Baby, DollarSign, Truck, Calendar, Sun } from 'lucide-react'
import type { Activity, FaunaActivity } from '@/lib/types'
import { ALL_REGIONS } from '@/lib/types'

function diffColor(d: string): string {
  const l = d.toLowerCase()
  if (l.includes('muy alta') || l.includes('alta')) return 'bg-red-100 text-red-700 border-red-200'
  if (l.includes('media-alta')) return 'bg-orange-100 text-orange-700 border-orange-200'
  if (l.includes('media')) return 'bg-amber-100 text-amber-700 border-amber-200'
  if (l.includes('baja-media')) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

function ActivityCard({ item, index, onSelect }: { item: Activity; index: number; onSelect: (a: Activity) => void }) {
  const photos = [item.imageUrl1, item.imageUrl2, item.imageUrl3, item.imageUrl4].filter(Boolean)
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.5) }}
      onClick={() => onSelect(item)} className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-paper-2/50 transition-all">
      <div className="h-40 bg-gradient-to-br from-nusa-jungle/20 to-leaf/10 relative overflow-hidden flex">
        {photos[0] ? <img src={photos[0]} alt={item.name} className="w-1/2 h-full object-cover" /> : <div className="w-1/2 h-full flex items-center justify-center text-3xl">🎯</div>}
        {photos[1] && <img src={photos[1]} alt="" className="w-1/2 h-full object-cover" />}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-xs font-bold text-ink flex items-center gap-1"><Star className="w-3 h-3 fill-nusa-sun text-nusa-sun" />{item.rating.toFixed(1)}</div>
        {item.prioridad && item.prioridad.toLowerCase().includes('muy alta') && <div className="absolute top-3 left-3 bg-nusa-sun text-ink rounded-full px-2 py-0.5 text-xs font-bold">Top</div>}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-ink leading-snug">{item.name}</h3>
        <p className="text-sm text-ink/60 mt-1">{item.subzone?.replace(/^\d+\.\d+\s*/, '') || item.zone?.replace(/^\d+\.\s*/, '')}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary" className="text-xs bg-nusa-jungle/10 text-nusa-jungle">{item.category}</Badge>
          <Badge variant="secondary" className={`text-xs border ${diffColor(item.difficulty)}`}>{item.difficulty}</Badge>
          {item.duration && <span className="text-xs text-ink/50 flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration}</span>}
        </div>
        {item.priceRange && <p className="text-sm font-bold text-nusa-jungle mt-2">{item.priceRange}</p>}
      </div>
    </motion.div>
  )
}

function ActivityDetail({ item, open, onOpenChange }: { item: Activity | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!item) return null
  const photos = [item.imageUrl1, item.imageUrl2, item.imageUrl3, item.imageUrl4].filter(Boolean)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-paper text-ink nusa-scroll border-l-2 border-nusa-jungle/30">
        <SheetHeader><SheetTitle className="font-display text-xl text-ink leading-tight">🎯 {item.name}</SheetTitle></SheetHeader>
        {photos[0] && <img src={photos[0]} alt={item.name} className="w-full h-48 object-cover rounded-lg mt-4" />}
        {photos.length > 1 && <div className="flex gap-2 mt-2 overflow-x-auto nusa-scroll">{photos.slice(1).map((f, i) => <img key={i} src={f} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0" />)}</div>}
        <div className="mt-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-nusa-jungle/10 text-nusa-jungle">{item.category}</Badge>
            <Badge variant="secondary" className={`border ${diffColor(item.difficulty)}`}>{item.difficulty}</Badge>
            <Badge variant="secondary" className="bg-nusa-teal/10 text-nusa-teal">{item.region}</Badge>
            {item.mejorHora && <Badge variant="outline" className="border-leaf/30 text-leaf">🕐 {item.mejorHora}</Badge>}
            {item.aptoNinos && <Badge variant="outline" className="border-blue-200 text-blue-600"><Baby className="w-3 h-3 mr-1" />{item.aptoNinos}</Badge>}
          </div>
          <p className="text-ink/80 leading-relaxed text-sm">{item.description}</p>

          <Separator className="bg-nusa-jungle/20" />

          {/* Precio */}
          {item.priceRange && (
            <div className="rounded-lg border border-ink/10 p-3 bg-paper-2">
              <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Precio</p>
              <p className="text-sm font-bold text-nusa-jungle">{item.priceRange}</p>
              {item.precioTipo && <p className="text-xs text-ink/40 mt-0.5">{item.precioTipo}</p>}
            </div>
          )}

          {/* Info rápida */}
          <div className="grid grid-cols-2 gap-3">
            {item.duration && (
              <div className="flex items-start gap-2 text-sm"><Clock className="w-4 h-4 text-ink/40 mt-0.5 shrink-0" /><div><span className="text-ink/50 text-xs block">Duración</span>{item.duration}</div></div>
            )}
            {item.mejorEpoca && (
              <div className="flex items-start gap-2 text-sm"><Calendar className="w-4 h-4 text-ink/40 mt-0.5 shrink-0" /><div><span className="text-ink/50 text-xs block">Mejor época</span>{item.mejorEpoca}</div></div>
            )}
          </div>

          {/* Cómo llegar */}
          {item.logistica && (
            <div>
              <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Cómo llegar</p>
              <p className="text-sm text-ink/80">{item.logistica}</p>
            </div>
          )}

          {/* Consejos */}
          {item.consejos && (
            <div className="rounded-lg border border-nusa-sun/30 bg-nusa-sun/5 p-3">
              <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-nusa-sun" /> Consejos</p>
              <p className="text-sm text-ink/80">{item.consejos}</p>
            </div>
          )}

          {/* Seguridad */}
          {item.seguridad && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-1"><ShieldAlert className="w-3.5 h-3.5" /> Seguridad y riesgos</p>
              <p className="text-sm text-red-800">{item.seguridad}</p>
            </div>
          )}

          {item.estadoVerificacion && <p className="text-xs text-ink/40 italic">{item.estadoVerificacion}</p>}

          <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-nusa-sun text-nusa-sun" /><span className="font-bold">{item.rating.toFixed(1)}</span></div>
          <div className="flex gap-2 pt-2">
            {item.wazeUrl && <Button size="sm" className="nusa-btn-primary" asChild><a href={item.wazeUrl} target="_blank" rel="noopener"><MapPin className="w-4 h-4 mr-1" />Waze</a></Button>}
            {item.webUrl && <Button size="sm" variant="outline" className="border-leaf text-leaf hover:bg-leaf/10" asChild><a href={item.webUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Maps</a></Button>}
            {item.sourceUrl && !item.sourceUrl.includes('google.com') && <Button size="sm" variant="outline" className="border-ink/20 text-ink/60 hover:bg-ink/5" asChild><a href={item.sourceUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Fuente</a></Button>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function FaunaCard({ item, index, onSelect }: { item: FaunaActivity; index: number; onSelect: (f: FaunaActivity) => void }) {
  return (
    <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.5) }}
      onClick={() => onSelect(item)} className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-paper-2/50 transition-all">
      <div className="h-40 bg-gradient-to-br from-nusa-forest/30 to-nusa-jungle/10 relative overflow-hidden">
        {item.foto1 ? <img src={item.foto1} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🦎</div>}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-xs font-bold text-ink flex items-center gap-1"><Star className="w-3 h-3 fill-nusa-sun text-nusa-sun" />{item.rating.toFixed(1)}</div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-ink leading-snug">{item.name}</h3>
        <p className="text-sm text-ink/60 mt-1">{item.zone}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {item.especie && <Badge variant="secondary" className="text-xs bg-leaf/10 text-leaf">{item.especie}</Badge>}
          {item.familia && <Badge variant="secondary" className="text-xs bg-nusa-teal/10 text-nusa-teal">{item.familia}</Badge>}
        </div>
      </div>
    </motion.div>
  )
}

function FaunaDetail({ item, open, onOpenChange }: { item: FaunaActivity | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!item) return null
  const fotos = [item.foto1, item.foto2, item.foto3].filter(Boolean)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-paper text-ink nusa-scroll border-l-2 border-leaf/30">
        <SheetHeader><SheetTitle className="font-display text-2xl text-ink">{item.name}</SheetTitle></SheetHeader>
        {fotos[0] && <img src={fotos[0]} alt={item.name} className="w-full h-48 object-cover rounded-lg mt-4" />}
        {fotos.length > 1 && <div className="flex gap-2 mt-2">{fotos.slice(1).map((f, i) => <img key={i} src={f} alt="" className="w-20 h-20 object-cover rounded-lg" />)}</div>}
        <div className="mt-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-leaf/10 text-leaf">{item.especie}</Badge>
            {item.familia && <Badge variant="secondary" className="bg-nusa-teal/10 text-nusa-teal">{item.familia}</Badge>}
            <Badge variant="secondary" className="bg-ember/10 text-ember">{item.dificultad}</Badge>
          </div>
          <p className="text-ink/80 leading-relaxed">{item.description}</p>
          {item.queVer && <p><strong>Qué ver:</strong> {item.queVer}</p>}
          {item.mejorEpoca && <p><strong>Mejor época:</strong> {item.mejorEpoca}</p>}
          {item.duracion && <p><strong>Duración:</strong> {item.duracion}</p>}
          {item.peligro && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-xs font-bold text-red-700">⚠️ Peligro</p><p className="mt-1 text-red-800">{item.peligro}</p></div>}
          <div className="flex gap-2 pt-2">
            {item.wazeUrl && <Button size="sm" className="nusa-btn-primary" asChild><a href={item.wazeUrl} target="_blank" rel="noopener"><MapPin className="w-4 h-4 mr-1" />Waze</a></Button>}
            {item.webUrl && <Button size="sm" variant="outline" className="border-leaf text-leaf hover:bg-leaf/10" asChild><a href={item.webUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Web</a></Button>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ActividadesPage() {
  const { data: actData, isLoading: actLoading } = useQuery({ queryKey: ['actividades'], queryFn: () => getActividades() })
  const { data: faunaData, isLoading: faunaLoading } = useQuery({ queryKey: ['fauna'], queryFn: () => getFauna() })
  const activities = actData?.activities ?? []
  const fauna = faunaData?.fauna ?? []
  const [tab, setTab] = useState('actividades')
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [diff, setDiff] = useState('')
  const [selAct, setSelAct] = useState<Activity | null>(null)
  const [selFauna, setSelFauna] = useState<FaunaActivity | null>(null)

  // Get unique categories from data
  const categories = [...new Set(activities.map(a => a.category).filter(Boolean))].sort()

  const filteredAct = activities.filter(a => {
    if (region && a.region !== region) return false
    if (diff && a.difficulty !== diff) return false
    if (search) { const s = search.toLowerCase(); if (!a.name.toLowerCase().includes(s) && !a.description.toLowerCase().includes(s)) return false }
    return true
  })
  const filteredFauna = fauna.filter(f => {
    if (region && f.region !== region) return false
    if (search) { const s = search.toLowerCase(); if (!f.name.toLowerCase().includes(s) && !f.especie.toLowerCase().includes(s)) return false }
    return true
  })

  const difficulties = [...new Set(activities.map(a => a.difficulty).filter(Boolean))].sort()

  return (
    <div className="nusa-paper min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <span className="kicker kicker-ember">Experiencias en Indonesia</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">{activities.length + fauna.length} experiencias</h1>
        </header>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 bg-paper-2"><TabsTrigger value="actividades">Actividades ({activities.length})</TabsTrigger><TabsTrigger value="fauna">Fauna ({fauna.length})</TabsTrigger></TabsList>
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-paper-2 border-paper-2/50 focus:border-nusa-jungle" /></div>
            <select value={region} onChange={e => setRegion(e.target.value)} className="nusa-select text-sm"><option value="">Todas las regiones</option>{ALL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
            {tab === 'actividades' && (
              <select value={diff} onChange={e => setDiff(e.target.value)} className="nusa-select text-sm"><option value="">Dificultad</option>{difficulties.map(d => <option key={d} value={d}>{d}</option>)}</select>
            )}
          </div>
          <TabsContent value="actividades">
            {actLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAct.map((a, i) => <ActivityCard key={a.id} item={a} index={i} onSelect={setSelAct} />)}
              </div>
            )}
            {!actLoading && filteredAct.length === 0 && <p className="text-center text-ink/50 py-12">Sin resultados.</p>}
          </TabsContent>
          <TabsContent value="fauna">
            {faunaLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFauna.map((f, i) => <FaunaCard key={f.id} item={f} index={i} onSelect={setSelFauna} />)}
              </div>
            )}
            {!faunaLoading && filteredFauna.length === 0 && <p className="text-center text-ink/50 py-12">Sin resultados.</p>}
          </TabsContent>
        </Tabs>
      </div>
      <ActivityDetail item={selAct} open={!!selAct} onOpenChange={v => !v && setSelAct(null)} />
      <FaunaDetail item={selFauna} open={!!selFauna} onOpenChange={v => !v && setSelFauna(null)} />
    </div>
  )
}