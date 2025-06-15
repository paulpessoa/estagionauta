import React, { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

declare global {
  interface Window {
    google: typeof google
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions)
      setZoom(zoom: number): void
      getZoom(): number
      fitBounds(bounds: LatLngBounds): void
    }
    class Marker {
      constructor(opts?: MarkerOptions)
      setMap(map: Map | null): void
      getPosition(): LatLng | undefined
      addListener(eventName: string, handler: () => void): void
    }
    class InfoWindow {
      constructor(opts?: InfoWindowOptions)
      open(map: Map, anchor?: Marker): void
    }
    class LatLngBounds {
      constructor()
      extend(point: LatLng): void
    }
    class LatLng {
      constructor(lat: number, lng: number)
    }
    class Size {
      constructor(width: number, height: number)
    }
    class Point {
      constructor(x: number, y: number)
    }
    namespace event {
      function addListener(instance: any, eventName: string, handler: () => void): any
      function removeListener(listener: any): void
    }
    interface MapOptions {
      zoom?: number
      center?: { lat: number; lng: number }
      mapTypeControl?: boolean
      streetViewControl?: boolean
      fullscreenControl?: boolean
    }
    interface MarkerOptions {
      position?: { lat: number; lng: number }
      map?: Map
      title?: string
      icon?: any
    }
    interface InfoWindowOptions {
      content?: string
    }
  }
}

interface Agency {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  city: string | null
  state: string | null
  description: string | null
  rating: number | null
  is_verified: boolean
  distance?: number
}

interface GoogleMapProps {
  agencies: Agency[]
  userLocation: { lat: number; lng: number } | null
  onAgencyClick: (agency: Agency) => void
  className?: string
}

export function GoogleMap({ agencies, userLocation, onAgencyClick, className = '' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])

  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyB8eWLPHMvNEzlCWpKGVAAmGaKYlRTWIzE", // Replace with your actual API key
      version: 'weekly',
      libraries: ['places']
    })

    loader.load().then(() => {
      if (mapRef.current && !map) {
        const defaultCenter = userLocation || { lat: -23.5505, lng: -46.6333 } // São Paulo default
        
        const newMap = new google.maps.Map(mapRef.current, {
          zoom: userLocation ? 12 : 6,
          center: defaultCenter,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        })

        setMap(newMap)
      }
    })
  }, [userLocation])

  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    // Add user location marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Sua localização',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6">
              <circle cx="12" cy="12" r="8"/>
              <circle cx="12" cy="12" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      })
      newMarkers.push(userMarker)
    }

    // Add agency markers
    agencies.forEach(agency => {
      if (agency.latitude && agency.longitude) {
        const marker = new google.maps.Marker({
          position: { lat: agency.latitude, lng: agency.longitude },
          map: map,
          title: agency.name,
          icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${agency.is_verified ? '#22c55e' : '#6b7280'}">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
          }
        })

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2 max-w-xs">
              <h3 class="font-semibold text-sm">${agency.name}</h3>
              ${agency.description ? `<p class="text-xs text-gray-600 mt-1">${agency.description.slice(0, 100)}...</p>` : ''}
              <div class="flex items-center mt-2 text-xs">
                ${agency.is_verified ? '<span class="text-green-600">✓ Verificada</span>' : '<span class="text-gray-500">Não verificada</span>'}
                ${agency.rating ? `<span class="ml-2">★ ${agency.rating.toFixed(1)}</span>` : ''}
                ${agency.distance ? `<span class="ml-2">${agency.distance.toFixed(1)}km</span>` : ''}
              </div>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
          onAgencyClick(agency)
        })

        newMarkers.push(marker)
      }
    })

    setMarkers(newMarkers)

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      newMarkers.forEach(marker => {
        const position = marker.getPosition()
        if (position) bounds.extend(position)
      })
      map.fitBounds(bounds)
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 16) map.setZoom(16)
        google.maps.event.removeListener(listener)
      })
    }
  }, [map, agencies, userLocation])

  return (
    <div ref={mapRef} className={`w-full h-96 rounded-lg ${className}`} />
  )
}