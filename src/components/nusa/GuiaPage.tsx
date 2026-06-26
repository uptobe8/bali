'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGuide } from '@/lib/client/api'
import { GuideCard } from './GuideCard'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Plane,
  UtensilsCrossed,
  Palmtree,
  Sparkles,
  Lightbulb,
} from 'lucide-react'
import type { GuideCategory } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'

const CATS: GuideCategory[] = [
  'transport',
  'restaurant',
  'beach',
  'activity',
  'tip',
]

const CAT_ICON: Record<GuideCategory, React.ReactNode> = {
  transport: <Plane className="w-4 h-4" />,
  restaurant: <UtensilsCrossed className="w-4 h-4" />,
  beach: <Palmtree className="w-4 h-4" />,
  activity: <Sparkles className="w-4 h-4" />,
  tip: <Lightbulb className="w-4 h-4" />,
}

export function GuiaPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['guide'],
    queryFn: getGuide,
  })
  const [tab, setTab] = useState<GuideCategory>('transport')

  const entries = data?.entries ?? []
  const byCat = (c: GuideCategory) =>
    entries
      .filter((e) => e.category === c)
      .sort((a, b) => a.order - b.order)

  return (
    <div className="nusa-paper min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <span className="kicker kicker-ember">Guía viva del viaje</span>
          <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 leading-tight">
            Todo lo que necesitás, enlazado y a un clic
          </h1>
          <p className="mt-3 text-ink-soft max-w-2xl leading-relaxed">
            Transportes, restaurantes, playas, actividades y consejos
            prácticos. Cada entrada lleva su precio, su horario y botones
            directos a Waze, a la web oficial y a Google Maps.
          </p>
          <hr className="nusa-divider mt-5" />
        </header>

        {isError && (
          <div className="nusa-card-paper p-6 text-ink-soft">
            No pudimos cargar la guía. Reintenta en unos segundos.
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as GuideCategory)}>
          <TabsList className="bg-paper-2 border border-leaf/15 h-auto flex flex-wrap gap-1 p-1.5 rounded-2xl">
            {CATS.map((c) => (
              <TabsTrigger
                key={c}
                value={c}
                className="data-[state=active]:bg-leaf data-[state=active]:text-white data-[state=active]:shadow-none rounded-xl px-4 py-2 text-sm font-black gap-1.5 text-ink-soft"
              >
                {CAT_ICON[c]}
                <span className="hidden sm:inline">{CATEGORY_META[c].label}</span>
                <span className="sm:hidden">{CATEGORY_META[c].label}</span>
                <span className="ml-1 text-[10px] opacity-70">
                  {byCat(c).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {CATS.map((c) => (
            <TabsContent key={c} value={c} className="mt-6">
              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-2xl bg-leaf/10" />
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {byCat(c).map((e) => (
                    <GuideCard key={e.id} entry={e} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
