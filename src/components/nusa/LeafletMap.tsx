'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Day } from '@/lib/types'

interface Props {
  days: Day[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function LeafletMap({ days, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})
  const lineRef = useRef<L.Polyline | null>(null)

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [-8.55, 115.45],
      zoom: 8,
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
    })
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
    ).addTo(map)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.9 }
    ).addTo(map)
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 120)
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = {}
      lineRef.current = null
    }
  }, [])

  // render markers + polyline whenever days/selection change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}
    if (lineRef.current) {
      lineRef.current.remove()
      lineRef.current = null
    }

    const pts = days.filter(
      (d) => d.coordsLat != null && d.coordsLng != null
    )
    if (pts.length === 0) return

    pts.forEach((d) => {
      const isSel = d.id === selectedId
      const html = isSel
        ? '<div class="nusa-pin highlight"><div class="nusa-pin-ring"></div><div class="nusa-pin-dot"></div></div>'
        : '<div class="nusa-pin"><div class="nusa-pin-dot"></div></div>'
      const icon = L.divIcon({
        html,
        className: 'nusa-pin-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      const m = L.marker([d.coordsLat!, d.coordsLng!], { icon }).addTo(map)
      m.bindPopup(
        `<strong>Día ${d.day}</strong><br/>${d.zone}<br/><span style="color:#cbd5d0">${d.title}</span>`
      )
      m.on('click', () => onSelect(d.id))
      markersRef.current[d.id] = m
    })

    const coords = pts.map(
      (d) => [d.coordsLat!, d.coordsLng!] as [number, number]
    )
    lineRef.current = L.polyline(coords, {
      color: '#ffd400',
      weight: 4,
      dashArray: '10,10',
      opacity: 0.9,
    }).addTo(map)

    const bounds = L.latLngBounds(coords)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
  }, [days, selectedId, onSelect])

  // pan + open popup when selection changes
  useEffect(() => {
    if (!selectedId) return
    const m = markersRef.current[selectedId]
    const map = mapRef.current
    if (m && map) {
      map.panTo(m.getLatLng(), { animate: true })
      m.openPopup()
    }
  }, [selectedId])

  return <div ref={containerRef} className="h-full w-full" />
}
