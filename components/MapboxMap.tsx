'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

type Props = {
  lng: number
  lat: number
  token: string
}

export default function MapboxMap({ lng, lat, token }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!container.current || mapRef.current) return
    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
    })
    mapRef.current = map
    new mapboxgl.Marker({ color: '#4B766B' }).setLngLat([lng, lat]).addTo(map)
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    return () => { map.remove(); mapRef.current = null }
  }, [lng, lat, token])

  return <div ref={container} style={{ width: '100%', height: 280, borderRadius: '1rem' }} />
}
