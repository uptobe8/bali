'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Day } from '@/lib/types'

interface Props {
  days: Day[]
  selectedId: string | null
  onSelect: (id: string) => void
  terrainOn?: boolean
}

// Esri World Imagery (satellite) raster tiles — realistic aerial look
const SATELLITE_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
// Esri reference overlay (boundaries + place labels)
const REF_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
// AWS terrain raster-dem for 3D relief (terrarium encoding)
const TERRAIN_TILES =
  'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'

function pinHtml(highlight: boolean): string {
  return highlight
    ? '<div class="nusa-pin highlight"><div class="nusa-pin-ring"></div><div class="nusa-pin-dot"></div></div>'
    : '<div class="nusa-pin"><div class="nusa-pin-dot"></div></div>'
}

export default function MaplibreMap({
  days,
  selectedId,
  onSelect,
  terrainOn = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Record<string, maplibregl.Marker>>({})
  const onSelectRef = useRef(onSelect)
  const terrainRef = useRef(terrainOn)

  // keep refs in sync with latest props (outside render)
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])
  useEffect(() => {
    terrainRef.current = terrainOn
  }, [terrainOn])

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [SATELLITE_TILES],
            tileSize: 256,
            attribution: 'Tiles &copy; Esri',
            maxzoom: 19,
          },
          reference: {
            type: 'raster',
            tiles: [REF_TILES],
            tileSize: 256,
            maxzoom: 19,
          },
          terrain: {
            type: 'raster-dem',
            tiles: [TERRAIN_TILES],
            tileSize: 256,
            encoding: 'terrarium',
            maxzoom: 14,
          },
        },
        layers: [
          { id: 'satellite', type: 'raster', source: 'satellite' },
          {
            id: 'reference',
            type: 'raster',
            source: 'reference',
            paint: { 'raster-opacity': 0.85 },
          },
        ],
      } as maplibregl.StyleSpecification,
      center: [115.45, -8.55],
      zoom: 8,
      pitch: 60,
      bearing: -22,
      maxPitch: 80,
      attributionControl: false,
      hash: false,
    })

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true,
      }),
      'top-right'
    )
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.on('load', () => {
      if (terrainRef.current) {
        try {
          map.setTerrain({ source: 'terrain', exaggeration: 1.4 })
        } catch {
          // terrain source optional — map still 3D via pitch
        }
      }
    })

    mapRef.current = map

    // resize after mount
    const t = setTimeout(() => map.resize(), 150)

    // listen for reset event from the page controls
    function onReset() {
      const m = mapRef.current
      if (!m) return
      m.easeTo({
        center: [115.45, -8.55],
        zoom: 8,
        pitch: 60,
        bearing: -22,
        duration: 900,
      })
    }
    window.addEventListener('nusa-map-reset', onReset as EventListener)

    return () => {
      clearTimeout(t)
      window.removeEventListener('nusa-map-reset', onReset as EventListener)
      Object.values(markersRef.current).forEach((m) => m.remove())
      markersRef.current = {}
      map.remove()
      mapRef.current = null
    }
  }, [])

  // toggle terrain on/off
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.loaded()) return
    try {
      if (terrainOn) {
        map.setTerrain({ source: 'terrain', exaggeration: 1.4 })
      } else {
        map.setTerrain(null)
      }
    } catch {
      // ignore
    }
  }, [terrainOn])

  // render markers + route whenever days/selection change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function render() {
      if (!map) return

      // remove old markers
      Object.values(markersRef.current).forEach((m) => m.remove())
      markersRef.current = {}

      const pts = days.filter(
        (d) => d.coordsLat != null && d.coordsLng != null
      )
      if (pts.length === 0) return

      // markers
      pts.forEach((d) => {
        const isSel = d.id === selectedId
        const el = document.createElement('div')
        el.innerHTML = pinHtml(isSel)
        el.style.cursor = 'pointer'
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onSelectRef.current(d.id)
        })
        const popup = new maplibregl.Popup({
          offset: 22,
          closeButton: false,
          closeOnClick: true,
          className: 'nusa-maplibre-popup',
        }).setHTML(
          `<strong>Día ${d.day}</strong><br/>${d.zone}<br/><span style="color:#cbd5d0">${d.title}</span>`
        )
        const m = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([d.coordsLng!, d.coordsLat!])
          .setPopup(popup)
          .addTo(map)
        markersRef.current[d.id] = m
      })

      // route geojson
      const coords = pts.map((d) => [d.coordsLng!, d.coordsLat!])
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: {},
          },
        ],
      }

      const srcId = 'route-src'
      const layerId = 'route-line'
      if (map.getSource(srcId)) {
        ;(map.getSource(srcId) as maplibregl.GeoJSONSource).setData(
          geojson as GeoJSON.FeatureCollection
        )
      } else {
        map.addSource(srcId, {
          type: 'geojson',
          data: geojson as GeoJSON.FeatureCollection,
        })
        map.addLayer({
          id: layerId,
          type: 'line',
          source: srcId,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#ffd400',
            'line-width': 4,
            'line-opacity': 0.92,
            'line-dasharray': [1.2, 0.9],
          },
        })
      }

      // fit bounds (only on first load of these days)
      if (coords.length > 1 && !map.getCanvas().dataset.fitted) {
        map.getCanvas().dataset.fitted = '1'
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new maplibregl.LngLatBounds(
            coords[0] as [number, number],
            coords[0] as [number, number]
          )
        )
        map.fitBounds(bounds, {
          padding: { top: 70, bottom: 70, left: 70, right: 70 },
          pitch: 55,
          bearing: -22,
          duration: 1000,
        })
      }
    }

    if (map.loaded()) {
      render()
    } else {
      map.once('idle', render)
    }
  }, [days, selectedId])

  // fly to + open popup when selection changes
  useEffect(() => {
    if (!selectedId) return
    const map = mapRef.current
    const m = markersRef.current[selectedId]
    if (map && m) {
      map.easeTo({
        center: m.getLngLat(),
        pitch: 68,
        zoom: Math.max(map.getZoom(), 9.5),
        duration: 800,
      })
      // toggle popup open
      const pop = m.getPopup()
      if (!pop.isOpen()) m.togglePopup()
    }
  }, [selectedId])

  return <div ref={containerRef} className="h-full w-full" />
}
