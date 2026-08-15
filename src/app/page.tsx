'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bike,
  Clock3,
  Compass,
  Eye,
  Filter,
  Heart,
  Home,
  MapPin,
  Menu,
  Navigation,
  ParkingSquare,
  Plus,
  Route,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  TentTree,
  Trees,
  User,
  UtensilsCrossed,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Screen = 'home' | 'create' | 'route' | 'timeline' | 'destination' | 'sleep' | 'sleepDetail' | 'explore' | 'favorites' | 'profile'

type Stop = {
  id: string
  name: string
  short: string
  day: number
  km: string
  time: string
  lat: number
  lng: number
  image: string
  description: string
}

type SleepPlace = {
  id: string
  name: string
  area: string
  distance: string
  rating: string
  reviews: string
  image: string
  lat: number
  lng: number
}

const STOPS: Stop[] = [
  { id: 'zahara', name: 'Zahara de los Atunes', short: 'Zahara', day: 1, km: '45 km', time: '50 min', lat: 36.1366, lng: -5.8456, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=88', description: 'Playa larga, ambiente de verano y una base muy cómoda para moverse por la costa.' },
  { id: 'conil', name: 'Conil de la Frontera', short: 'Conil', day: 2, km: '40 km', time: '45 min', lat: 36.2777, lng: -6.0880, image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=88', description: 'Pueblo blanco junto al mar, con playas salvajes, buena gastronomía y un ambiente relajado todo el año.' },
  { id: 'palmar', name: 'El Palmar', short: 'El Palmar', day: 3, km: '30 km', time: '35 min', lat: 36.2181, lng: -6.0603, image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=88', description: 'Surf, atardeceres y kilómetros de playa en un entorno abierto y sencillo.' },
  { id: 'bolonia', name: 'Bolonia', short: 'Bolonia', day: 4, km: '60 km', time: '1 h', lat: 36.0806, lng: -5.7608, image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Playa_Bolonia-Tarifa-IMG_20230909_152909.jpg?width=1400', description: 'Duna, playa salvaje y naturaleza. Uno de los paisajes más reconocibles de la costa gaditana.' },
  { id: 'tarifa', name: 'Tarifa', short: 'Tarifa', day: 5, km: '35 km', time: '35 min', lat: 36.013, lng: -5.604, image: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=1200&q=88', description: 'Viento, surf, casco histórico y el encuentro entre Atlántico y Mediterráneo.' },
]

const SLEEP_PLACES: SleepPlace[] = [
  { id: 'aceite', name: 'Cala del Aceite', area: 'Tarifa · A 4,8 km del centro', distance: '4,8 km', rating: '4.7', reviews: '(100)', image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1000&q=88', lat: 36.2998, lng: -6.1437 },
  { id: 'alemanes', name: 'Playa de los Alemanes', area: 'Zahara de los Atunes · A 2,1 km del centro', distance: '2,1 km', rating: '4.6', reviews: '(96)', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=88', lat: 36.1128, lng: -5.8304 },
  { id: 'lentiscal', name: 'El Lentiscal', area: 'Bolonia · A 6,2 km del centro', distance: '6,2 km', rating: '4.8', reviews: '(110)', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Playa_Bolonia-Tarifa-IMG_20230909_152909.jpg?width=1000', lat: 36.0816, lng: -5.7624 },
]

const FEATURE_ICONS: { label: string; icon: LucideIcon }[] = [
  { label: 'Playas', icon: Sun },
  { label: 'Surf', icon: Waves },
  { label: 'Gastronomía', icon: UtensilsCrossed },
  { label: 'Pueblo', icon: Home },
  { label: 'Ambiente', icon: Sparkles },
]

const EXPLORE_ITEMS = [
  ['Playas', 'https://commons.wikimedia.org/wiki/Special:FilePath/Playa_Bolonia-Tarifa-IMG_20230909_152909.jpg?width=900'],
  ['Pueblos blancos', 'https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?auto=format&fit=crop&w=900&q=88'],
  ['Miradores', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=88'],
  ['Surf', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=88'],
  ['Atardeceres', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=88'],
  ['Gastronomía', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=88'],
  ['Naturaleza', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=88'],
  ['Rincones tranquilos', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=88'],
] as const

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-logo ${compact ? 'compact' : ''}`}>
      <div className="brand-copy"><b>TU RUTA</b><strong>CÁDIZ</strong><span>en Camper</span></div>
      <svg className="brand-sketch" viewBox="0 0 120 130" aria-hidden="true">
        <path d="M88 4c15 10 19 26 18 49M85 13c-11 2-19 9-25 17M91 16c10 2 20 9 26 18M90 20c-5 13-6 25-5 38" />
        <path d="M35 85h57l-6-25H44l-9 25Z" /><path d="M44 60l10-15h20l12 15M55 45V34h18v11" />
        <circle cx="50" cy="87" r="6" /><circle cx="80" cy="87" r="6" />
        <path d="M18 108c17-10 33-9 48 1 16 10 31 10 47 0M25 120c12-6 24-6 36 0" />
      </svg>
    </div>
  )
}

function Sidebar({ screen, navigate }: { screen: Screen; navigate: (screen: Screen) => void }) {
  const items: { screen: Screen; label: string; icon: LucideIcon }[] = [
    { screen: 'home', label: 'Inicio', icon: Home }, { screen: 'route', label: 'Rutas', icon: Route }, { screen: 'explore', label: 'Explorar', icon: Compass }, { screen: 'favorites', label: 'Favoritos', icon: Heart }, { screen: 'sleep', label: 'Park4Night', icon: ParkingSquare }, { screen: 'profile', label: 'Perfil', icon: User },
  ]
  return (
    <aside className="desktop-sidebar">
      <Logo compact />
      <nav>{items.map(({ screen: itemScreen, label, icon: Icon }) => <button key={itemScreen} className={screen === itemScreen ? 'active' : ''} onClick={() => navigate(itemScreen)}><Icon /><span>{label}</span></button>)}</nav>
      <div className="sidebar-promo"><p>¿Listo para tu<br />próxima aventura?</p><svg viewBox="0 0 100 70" aria-hidden="true"><path d="M20 50h58l-6-24H29l-9 24Z" /><path d="M30 26 40 12h22l12 14M41 12V3h20v9" /><circle cx="35" cy="52" r="7" /><circle cx="66" cy="52" r="7" /></svg><button onClick={() => navigate('create')}>CREA TU RUTA</button></div>
    </aside>
  )
}

function BottomNav({ screen, navigate }: { screen: Screen; navigate: (screen: Screen) => void }) {
  const items: { screen: Screen; label: string; icon: LucideIcon }[] = [
    { screen: 'home', label: 'Inicio', icon: Home }, { screen: 'route', label: 'Rutas', icon: Route }, { screen: 'create', label: '', icon: Plus }, { screen: 'favorites', label: 'Favoritos', icon: Heart }, { screen: 'profile', label: 'Perfil', icon: User },
  ]
  return <nav className="bottom-nav">{items.map(({ screen: itemScreen, label, icon: Icon }) => <button key={itemScreen} className={`${itemScreen === 'create' ? 'plus' : ''} ${screen === itemScreen ? 'active' : ''}`} onClick={() => navigate(itemScreen)}><Icon />{label && <span>{label}</span>}</button>)}</nav>
}

function AppHeader({ title, back, right }: { title: string; back?: () => void; right?: React.ReactNode }) {
  return <header className="app-header"><button className="header-icon" onClick={back} aria-label="Volver"><ArrowLeft /></button><h1>{title}</h1><div className="header-right">{right}</div></header>
}

function HomeScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <div className="page-frame home-layout">
      <Sidebar screen="home" navigate={navigate} />
      <main className="home-main">
        <section className="home-hero">
          <div className="home-top-icons"><Bell /><div className="avatar" /></div><button className="mobile-menu" aria-label="Menú"><Menu /></button><div className="mobile-sketch"><Logo compact /></div>
          <div className="home-title-block"><h1>TU RUTA<br /><span>CÁDIZ</span></h1><div className="script">en Camper</div><p>Playas infinitas, atardeceres únicos y libertad sobre ruedas.</p><button className="lime-cta" onClick={() => navigate('create')}>PLANIFICA TU RUTA <ArrowRight /></button></div>
          <div className="home-bottom-panel">
            <div className="section-heading"><h2>RUTAS DESTACADAS</h2><button>Ver todas</button></div>
            <div className="featured-routes">
              {[
                ['COSTA DE LA LUZ', '7 días · 6 noches', '120 km', STOPS[3].image], ['CÁDIZ SURF TRIP', '5 días · 4 noches', '90 km', STOPS[2].image], ['PUEBLOS BLANCOS', '6 días · 5 noches', '110 km', STOPS[1].image],
              ].map(([name, days, km, image]) => <button key={name} className="featured-card" onClick={() => navigate('route')}><img src={image} alt="" /><Heart className="card-heart" /><span><b>{name}</b><small>{days}</small><small>{km}</small></span></button>)}
            </div>
            <h2 className="explore-title">EXPLORA CÁDIZ</h2>
            <div className="home-explore-grid">{[['Playas', Sun], ['Pueblos', Home], ['Miradores', Eye], ['Surf', Waves], ['Rutas Off-road', Route], ['Atardeceres', Sun], ['Gastronomía', UtensilsCrossed], ['Naturaleza', Trees]].map(([label, icon]) => { const Icon = icon as LucideIcon; return <button key={label as string} onClick={() => navigate('explore')}><Icon /><span>{label as string}</span></button> })}</div>
          </div>
        </section>
      </main>
      <BottomNav screen="home" navigate={navigate} />
    </div>
  )
}

function CreateScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const [step, setStep] = useState(1)
  const [filters, setFilters] = useState<Record<string, boolean>>({ playa: true, mar: true })
  const filterLabels = ['Con playa', 'Frente al mar', 'Pueblo costero', 'Surf', 'Naturaleza', 'Miradores', 'Gastronomía', 'Pueblos blancos', 'Tranquilidad', 'Ambiente nocturno', 'Acceso fácil camper']
  return (
    <div className="standalone-screen create-screen">
      <AppHeader title="CREA TU RUTA" back={() => navigate('home')} right={<SlidersHorizontal />} />
      <div className="desktop-tabs"><button className={step === 1 ? 'active' : ''} onClick={() => setStep(1)}>1. DESTINOS</button><button className={step === 2 ? 'active' : ''} onClick={() => setStep(2)}>2. FILTROS</button><button className={step === 3 ? 'active' : ''} onClick={() => setStep(3)}>3. PREFERENCIAS</button></div>
      <main className="create-body">
        <section className="create-section destinations-section">
          <h2>¿A DÓNDE QUIERES IR?</h2><label className="field-label">Punto de inicio</label><div className="field"><MapPin /><input defaultValue="Cádiz" aria-label="Punto de inicio" /><span>⌄</span></div>
          <label className="field-label">Añade destinos o poblaciones que quieres visitar</label><div className="chips-field">{STOPS.map(stop => <span key={stop.id}>{stop.name}<b>×</b></span>)}</div>
          <label className="field-label">Añade destinos que quieres evitar (opcional)</label><div className="field"><Bell /><input placeholder="Ej. Sanlúcar, Jerez..." aria-label="Destinos a evitar" /></div>
          <div className="two-fields"><div><label className="field-label">Días de viaje</label><div className="field"><b>6 días / 5 noches</b><span>⌄</span></div></div><div><label className="field-label">Distancia máxima total</label><div className="field"><b>300 km</b><span>⌄</span></div></div></div>
        </section>
        <section className="create-section filters-section"><div className="section-heading light"><h2>FILTROS PRINCIPALES</h2><button onClick={() => setFilters({})}>Restablecer filtros</button></div><div className="filter-chips">{filterLabels.map((label, index) => { const key = label.toLowerCase().replace(/\s+/g, '-'); const active = filters[key] ?? index < 2; return <button key={key} className={active ? 'active' : ''} onClick={() => setFilters(prev => ({ ...prev, [key]: !active }))}>{label}</button> })}</div></section>
        <section className="create-section preferences-section"><h2>PREFERENCIAS</h2><div className="preference-grid"><button><b>Quiero conducir poco</b><span>Priorizar trayectos cortos</span></button><button><b>Prefiero más paradas</b><span>Más lugares, menos estancia</span></button><button><b>Prefiero quedarme más</b><span>Menos cambios de base</span></button><button><b>Prioridad</b><span>Costa</span></button></div></section>
        <button className="continue-button" onClick={() => navigate('route')}>CONTINUAR <ArrowRight /></button>
        <div className="mobile-create-sketch"><span>Libertad es<br /><b>tu mejor plan</b></span><svg viewBox="0 0 180 90"><path d="M105 65c16-9 31-9 48 0M118 75c11-5 22-5 31 0M142 8c13 9 16 22 15 45M140 15c-8 2-15 7-19 14M145 17c9 2 17 7 21 14" /></svg></div>
      </main><BottomNav screen="create" navigate={navigate} />
    </div>
  )
}

function RouteMap({ stops }: { stops: Stop[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let map: any; let cancelled = false
    async function mount() {
      if (!ref.current) return
      const L = await import('leaflet')
      if (cancelled || !ref.current) return
      map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([36.16, -5.88], 9)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
      const latLngs = stops.map(s => [s.lat, s.lng] as [number, number])
      stops.forEach((stop, index) => { const marker = L.divIcon({ className: '', html: `<div class="leaf-pin">${index + 1}</div><div class="leaf-label">${stop.short.toUpperCase()}</div>`, iconSize: [112, 34], iconAnchor: [16, 17] }); L.marker([stop.lat, stop.lng], { icon: marker }).addTo(map) })
      L.polyline(latLngs, { color: '#dfff00', weight: 7, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(map); map.fitBounds(L.latLngBounds(latLngs).pad(.15))
    }
    mount(); return () => { cancelled = true; if (map) map.remove() }
  }, [stops])
  return <div className="leaflet-route-map" ref={ref} />
}

function RouteScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  return <div className="standalone-screen route-screen"><AppHeader title="TU RUTA" back={() => navigate('create')} right={<div className="header-actions"><button><Heart /> Guardar</button><button><Share2 /> Compartir</button></div>} /><div className="route-map-stage"><RouteMap stops={STOPS} /><div className="mobile-route-pill">6 DÍAS · 5 NOCHES</div><aside className="trip-summary desktop-trip-summary"><h2>Resumen del viaje</h2><p><Clock3 /> 6 días / 5 noches</p><p><MapPin /> 5 paradas</p><p><Navigation /> 210 km totales</p><p><Clock3 /> 4 h 10 m conducción</p><button onClick={() => navigate('timeline')}>VER DÍA A DÍA <ArrowRight /></button><button className="modify" onClick={() => navigate('create')}>MODIFICAR RUTA</button></aside><div className="trip-summary mobile-trip-summary"><div><span>DISTANCIA TOTAL<b>+ 210 km</b></span><span>PARADAS<b>5</b></span></div><button onClick={() => navigate('timeline')}>VER RUTA DÍA A DÍA <ArrowRight /></button></div><div className="elevation-chart"><svg viewBox="0 0 600 90" preserveAspectRatio="none"><path d="M0 70 L20 62 30 65 43 50 55 58 70 47 90 65 110 60 128 55 145 63 165 70 190 68 215 60 235 49 250 56 270 64 290 70 315 66 340 65 360 59 380 63 405 66 430 55 450 63 475 61 495 50 515 57 540 63 565 60 600 68 L600 90 L0 90 Z" /></svg><div><span>0 km</span><span>50 km</span><span>100 km</span><span>150 km</span><span>210 km</span></div></div></div><BottomNav screen="route" navigate={navigate} /></div>
}

function TimelineScreen({ navigate, openStop }: { navigate: (screen: Screen) => void; openStop: (stop: Stop) => void }) {
  return <div className="page-frame timeline-layout"><Sidebar screen="route" navigate={navigate} /><main className="timeline-main"><AppHeader title="RUTA DÍA A DÍA" back={() => navigate('route')} right={<button className="ellipsis">•••</button>} /><div className="timeline-list">{STOPS.map((stop, index) => <article key={stop.id} className="timeline-item"><div className="timeline-dot">{index + 1}</div><img src={stop.image} alt="" /><div className="timeline-copy"><h3>{stop.name}</h3><span className="day-chip">DÍA {stop.day}</span><div><span>{stop.km}</span><span>{stop.time}</span><Sun /><Clock3 /><UtensilsCrossed /></div></div><button className="row-arrow" onClick={() => openStop(stop)}><ArrowRight /></button></article>)}<button className="add-stop"><Plus /> AÑADIR PARADA</button></div></main><BottomNav screen="route" navigate={navigate} /></div>
}

function DestinationScreen({ stop, navigate }: { stop: Stop; navigate: (screen: Screen) => void }) {
  return <div className="standalone-screen destination-screen"><AppHeader title={stop.name.toUpperCase()} back={() => navigate('timeline')} right={<div className="header-actions"><button><Heart /> Favorito</button><button className="lime-mini"><Plus /> AÑADIR A MI RUTA</button></div>} /><main className="destination-body"><section className="destination-hero"><img src={stop.image} alt="" /><div className="destination-overlay"><p>{stop.description}</p></div></section><div className="destination-columns"><section className="destination-content-main"><div className="feature-icons">{FEATURE_ICONS.map(({ label, icon: Icon }) => <button key={label}><Icon /><span>{label}</span></button>)}</div><div className="section-heading light"><h2>LUGARES QUE NO TE PUEDES PERDER</h2><button>Ver todos</button></div><div className="poi-cards">{[['Playa de Los Bateles', '1,2 km', stop.image], ['Torre de Guzmán', '300 m', 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=700&q=88'], ['Casco Antiguo', '300 m', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=700&q=88'], ['Cala del Aceite', '4,8 km', SLEEP_PLACES[0].image]].map(([name, distance, image]) => <button key={name} onClick={() => navigate('explore')}><img src={image} alt="" /><b>{name}</b><small>{distance}</small></button>)}</div><button className="mobile-park-cta" onClick={() => navigate('sleep')}><ParkingSquare /><span><b>PARKING4NIGHT</b><small>Encuentra tu mejor sitio frente a la playa</small></span><ArrowRight /></button></section><aside className="practical-info"><h3>INFORMACIÓN PRÁCTICA</h3><p><Clock3 /><span>Tiempo recomendado<b>1 - 2 días</b></span></p><p><Navigation /><span>Distancia desde anterior<b>40 km · 45 min</b></span></p><p><Sun /><span>Mejor época<b>Marzo - Octubre</b></span></p><p><User /><span>Población<b>22.000 hab.</b></span></p><p><MapPin /><span>Ubicación<b>Ver en el mapa</b></span></p><button onClick={() => navigate('sleep')}>CÓMO LLEGAR <ArrowRight /></button></aside></div></main><BottomNav screen="route" navigate={navigate} /></div>
}

function SleepScreen({ navigate, openPlace }: { navigate: (screen: Screen) => void; openPlace: (place: SleepPlace) => void }) {
  const [filter, setFilter] = useState('Frente al mar')
  return <div className="standalone-screen sleep-screen"><AppHeader title="DÓNDE DORMIR" back={() => navigate('destination')} right={<span className="sleep-source">Resultados de Park4Night</span>} /><main className="sleep-body"><div className="sleep-search-row"><div><Search /><input placeholder="Buscar frente al mar..." /></div><button><Filter /></button><button>FILTROS</button></div><div className="sleep-filter-row">{['Frente al mar', 'Vistas al mar', 'Tranquilo', 'Acceso camper', 'Hasta 5 km'].map(label => <button key={label} className={filter === label ? 'active' : ''} onClick={() => setFilter(label)}>{label}</button>)}</div><div className="sleep-sort"><button>Mejor valorados⌄</button></div><div className="sleep-results">{SLEEP_PLACES.map(place => <article key={place.id} className="sleep-result"><img src={place.image} alt="" /><div><h3>{place.name}</h3><p>{place.area}</p><div className="sleep-tags"><span>Frente al mar</span><span>Tranquilo</span><span>Suelo de tierra</span></div></div><div className="sleep-score"><b>{place.rating} <Star /></b><small>{place.reviews}</small><span>{place.distance}</span></div><button onClick={() => openPlace(place)}>VER EN PARK4NIGHT <ArrowRight /></button></article>)}</div></main><BottomNav screen="sleep" navigate={navigate} /></div>
}

function MiniMap({ place }: { place: SleepPlace }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { let map: any; let cancelled = false; async function mount() { if (!ref.current) return; const L = await import('leaflet'); if (cancelled || !ref.current) return; map = L.map(ref.current, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([place.lat, place.lng], 11); L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map); const marker = L.divIcon({ className: '', html: '<div class="sleep-map-pin"></div>', iconSize: [32, 42], iconAnchor: [16, 42] }); L.marker([place.lat, place.lng], { icon: marker }).addTo(map) } mount(); return () => { cancelled = true; if (map) map.remove() } }, [place])
  return <div ref={ref} className="sleep-mini-map" />
}

function SleepDetailScreen({ place, navigate }: { place: SleepPlace; navigate: (screen: Screen) => void }) {
  return <div className="standalone-screen sleep-detail-screen"><AppHeader title={place.name.toUpperCase()} back={() => navigate('sleep')} right={<button className="favorite-inline"><Heart /> Favorito</button>} /><main className="sleep-detail-body"><section className="sleep-detail-gallery"><img src={place.image} alt="" /><div className="thumb-strip">{[place.image, STOPS[4].image, STOPS[3].image, STOPS[1].image, STOPS[2].image].map((image, i) => <img key={i} src={image} alt="" />)}<button>+12</button></div></section><div className="sleep-detail-grid"><section className="sleep-facts"><p><Waves /><span>Distancia a la playa<b>100 m</b></span></p><p><Navigation /><span>Distancia a Tarifa<b>4,8 km</b></span></p><p><TentTree /><span>Tipo de suelo<b>Tierra / Arena</b></span></p><p><Bike /><span>Acceso<b>Camper / AC / Furgoneta</b></span></p><p><UtensilsCrossed /><span>Servicios cercanos<b>Agua (2 km) · Supermercado (4 km)<br />Restaurante (4 km)</b></span></p><p><Sparkles /><span>Nivel de tranquilidad<b>Muy tranquilo</b></span></p><p><Compass /><span>Señal 4G/5G<b>Buena</b></span></p></section><MiniMap place={place} /></div><a className="park-link" href="https://park4night.com/es" target="_blank" rel="noreferrer">VER EN PARK4NIGHT <ArrowRight /></a><div className="sleep-detail-actions"><a href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`} target="_blank" rel="noreferrer"><MapPin /> ABRIR EN MAPS</a><button><Heart /> AÑADIR A MI RUTA</button></div></main><BottomNav screen="sleep" navigate={navigate} /></div>
}

function ExploreScreen({ navigate }: { navigate: (screen: Screen) => void }) { return <div className="page-frame explore-layout"><Sidebar screen="explore" navigate={navigate} /><main className="generic-main"><AppHeader title="EXPLORA CÁDIZ" back={() => navigate('home')} right={<Search />} /><div className="explore-cards">{EXPLORE_ITEMS.map(([label, image]) => <button key={label} onClick={() => navigate('destination')}><img src={image} alt="" /><span>{label}</span></button>)}</div></main><BottomNav screen="explore" navigate={navigate} /></div> }
function FavoritesScreen({ navigate }: { navigate: (screen: Screen) => void }) { return <div className="page-frame generic-layout"><Sidebar screen="favorites" navigate={navigate} /><main className="generic-main"><AppHeader title="FAVORITOS" back={() => navigate('home')} right={<Heart />} /><div className="favorite-tabs"><button className="active">DESTINOS</button><button>PLAYAS</button><button>DORMIR</button><button>RUTAS</button></div><div className="explore-cards">{STOPS.slice(0,4).map(stop => <button key={stop.id} onClick={() => navigate('destination')}><img src={stop.image} alt="" /><span>{stop.name}</span></button>)}</div></main><BottomNav screen="favorites" navigate={navigate} /></div> }
function ProfileScreen({ navigate }: { navigate: (screen: Screen) => void }) { return <div className="page-frame generic-layout"><Sidebar screen="profile" navigate={navigate} /><main className="generic-main"><AppHeader title="PERFIL" back={() => navigate('home')} right={<User />} /><section className="profile-card"><div className="profile-avatar" /><h2>MIS VIAJES</h2><p>Rutas, historial, favoritos y preferencias.</p><h3>PRÓXIMA RUTA</h3><button className="profile-trip" onClick={() => navigate('route')}><img src={STOPS[3].image} alt="" /><span><b>SUR · CÁDIZ</b><small>14 → 27 agosto</small></span></button><h3>PREFERENCIAS DE VIAJE</h3><div className="profile-settings"><p><span>Camper</span><b>Mediana</b></p><p><span>Máximo km diarios</span><b>250 km</b></p><p><span>Playa</span><b>Sí</b></p><p><span>Surf</span><b>Sí</b></p><p><span>Lugares tranquilos</span><b>Alta prioridad</b></p><p><span>Tipo de viaje</span><b>Costa + naturaleza</b></p></div></section></main><BottomNav screen="profile" navigate={navigate} /></div> }

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedStop, setSelectedStop] = useState<Stop>(STOPS[1])
  const [selectedSleep, setSelectedSleep] = useState<SleepPlace>(SLEEP_PLACES[0])
  const navigate = (next: Screen) => { setScreen(next); window.scrollTo(0, 0) }
  const openStop = (stop: Stop) => { setSelectedStop(stop); navigate('destination') }
  const openPlace = (place: SleepPlace) => { setSelectedSleep(place); navigate('sleepDetail') }
  return <div className="camper-app">{screen === 'home' && <HomeScreen navigate={navigate} />}{screen === 'create' && <CreateScreen navigate={navigate} />}{screen === 'route' && <RouteScreen navigate={navigate} />}{screen === 'timeline' && <TimelineScreen navigate={navigate} openStop={openStop} />}{screen === 'destination' && <DestinationScreen stop={selectedStop} navigate={navigate} />}{screen === 'sleep' && <SleepScreen navigate={navigate} openPlace={openPlace} />}{screen === 'sleepDetail' && <SleepDetailScreen place={selectedSleep} navigate={navigate} />}{screen === 'explore' && <ExploreScreen navigate={navigate} />}{screen === 'favorites' && <FavoritesScreen navigate={navigate} />}{screen === 'profile' && <ProfileScreen navigate={navigate} />}</div>
}
