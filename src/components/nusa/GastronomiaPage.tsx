'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGastronomia } from '@/lib/client/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Search, Star, ExternalLink, MapPin } from 'lucide-react'
import type { GastronomyRestaurant } from '@/lib/types'

const ZONES = ['Bali','Java','Komodo y Flores','Borneo y Sumatra','Sulawesi y Raja Ampat','Gili y Nusa Penida']
const TYPES = ['Restaurante','Bar','Beach Club','Street Food','Festival','Café','Espectáculo','Zona Social']
const PRICE_LABEL = ['','€ Económico','€€ Medio','€€€ Alto']

const TYPE_ICONS: Record<string, string> = {
  'Restaurante': '🍽️', 'Bar': '🍸', 'Beach Club': '🏖️', 'Street Food': '🍢',
  'Festival': '🎉', 'Café': '☕', 'Espectáculo': '🎭', 'Zona Social': '🌃',
}

function PriceStars({ level }: { level: number }) {
  return <span className="text-nusa-sun font-bold">{PRICE_LABEL[level] || '€€'}</span>
}

function DetailSheet({ item, open, onOpenChange }: { item: GastronomyRestaurant | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!item) return null
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-paper text-ink nusa-scroll border-l-2 border-nusa-jungle/30">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-ink">{item.name}</SheetTitle>
        </SheetHeader>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-lg mt-4" />
        ) : (
          <div className="w-full h-48 rounded-lg mt-4 bg-gradient-to-br from-nusa-jungle/20 to-nusa-teal/10 flex items-center justify-center text-5xl">
            {TYPE_ICONS[item.type] || '🍽️'}
          </div>
        )}
        <div className="mt-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-leaf/10 text-leaf">{item.zone} · {item.subzone}</Badge>
            <Badge variant="secondary" className="bg-ember/10 text-ember">{item.cuisine}</Badge>
            <Badge variant="secondary" className="bg-nusa-jungle/10 text-nusa-jungle">{item.type}</Badge>
          </div>
          {item.signatureDish && (
            <div className="bg-nusa-sun/10 rounded-lg p-3">
              <p className="text-xs font-bold text-nusa-sun uppercase tracking-wide">Plato estrella</p>
              <p className="mt-1 text-ink">{item.signatureDish}</p>
            </div>
          )}
          <p className="text-ink/80 leading-relaxed">{item.description}</p>
          {item.tip && (
            <div className="bg-paper-2 rounded-lg p-3">
              <p className="text-xs font-bold text-ink uppercase tracking-wide">Consejo</p>
              <p className="mt-1 text-ink/70">{item.tip}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <PriceStars level={item.priceLevel} />
            <div className="flex items-center gap-1 ml-auto">
              <Star className="w-4 h-4 fill-nusa-sun text-nusa-sun" />
              <span className="font-bold">{item.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {item.wazeUrl && <Button size="sm" className="nusa-btn-primary" asChild><a href={item.wazeUrl} target="_blank" rel="noopener"><MapPin className="w-4 h-4 mr-1" />Waze</a></Button>}
            {item.webUrl && <Button size="sm" variant="outline" className="border-leaf text-leaf hover:bg-leaf/10" asChild><a href={item.webUrl} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Web</a></Button>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function GastronomiaPage() {
  const { data, isLoading } = useQuery({ queryKey: ['gastronomia'], queryFn: () => getGastronomia() })
  const [search, setSearch] = useState('')
  const [zona, setZona] = useState('')
  const [tipo, setTipo] = useState('')
  const [precio, setPrecio] = useState('')
  const [selected, setSelected] = useState<GastronomyRestaurant | null>(null)

  const restaurants = data?.restaurants ?? []
  const filtered = restaurants.filter(r => {
    if (zona && r.region !== zona) return false
    if (tipo && r.type !== tipo) return false
    if (precio && r.priceLevel !== parseInt(precio)) return false
    if (search) { const s = search.toLowerCase(); if (!r.name.toLowerCase().includes(s) && !r.cuisine.toLowerCase().includes(s) && !r.signatureDish.toLowerCase().includes(s)) return false }
    return true
  })

  return (
    <div className="nusa-paper min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <span className="kicker kicker-ember">Gastronomía de Indonesia</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">{restaurants.length} experiencias seleccionadas</h1>
          <p className="text-ink/60 mt-2 max-w-2xl">Restaurantes, beach clubs, bares, mercados nocturnos, festivales y la mejor comida callejera de las 6 regiones de Indonesia.</p>
        </header>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <Input placeholder="Buscar restaurante, cocina, festival..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-paper-2 border-paper-2/50 focus:border-nusa-jungle" />
          </div>
          <select value={zona} onChange={e => setZona(e.target.value)} className="nusa-select text-sm">
            <option value="">Todas las zonas</option>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="nusa-select text-sm">
            <option value="">Todos los tipos</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={precio} onChange={e => setPrecio(e.target.value)} className="nusa-select text-sm">
            <option value="">Todos los precios</option>
            <option value="1">€ Económico</option>
            <option value="2">€€ Medio</option>
            <option value="3">€€€ Alto</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}
                onClick={() => setSelected(r)} className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-paper-2/50 transition-all">
                <div className="h-44 bg-gradient-to-br from-nusa-jungle/20 to-nusa-teal/10 relative overflow-hidden">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-nusa-jungle/30 to-nusa-teal/20">
                      {TYPE_ICONS[r.type] || '🍽️'}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-xs font-bold text-ink flex items-center gap-1">
                    <Star className="w-3 h-3 fill-nusa-sun text-nusa-sun" />
                    {r.rating.toFixed(1)}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="text-xs bg-black/50 text-white backdrop-blur">{r.type}</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg text-ink leading-snug">{r.name}</h3>
                  <p className="text-sm text-ink/60 mt-1">{r.subzone}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="secondary" className="text-xs bg-leaf/10 text-leaf">{r.cuisine}</Badge>
                    <PriceStars level={r.priceLevel} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && <p className="text-center text-ink/50 py-12">No se encontraron resultados con esos filtros.</p>}
      </div>
      <DetailSheet item={selected} open={!!selected} onOpenChange={v => !v && setSelected(null)} />
    </div>
  )
}