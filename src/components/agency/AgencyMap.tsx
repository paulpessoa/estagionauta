
import { useState, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { Agency } from '@/types/agency'
import { MapPin, Star, Phone, Globe, Instagram, Mail, MessageSquare, Linkedin } from 'lucide-react'

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface AgencyMapProps {
  agencies: (Agency & { distance?: number })[]
  userLocation: { lat: number, lng: number } | null
  mapCenter: { lat: number, lng: number }
}

export function AgencyMap({ agencies, userLocation, mapCenter }: AgencyMapProps) {
  const [activeMarker, setActiveMarker] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    if (activeMarker && !agencies.some(a => a.id === activeMarker)) {
      setActiveMarker(null)
    }
  }, [agencies, activeMarker])

  useEffect(() => {
    if (!map || agencies.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    let hasCoords = false

    agencies.forEach((agency) => {
      if (agency.latitude && agency.longitude) {
        const lat = Number(agency.latitude)
        const lng = Number(agency.longitude)
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng })
          hasCoords = true
        }
      }
    })

    if (userLocation) {
      bounds.extend(userLocation)
      hasCoords = true
    }

    if (hasCoords) {
      map.fitBounds(bounds)
      // Limit zoom level if there's only one marker to prevent extreme closeups
      const totalPoints = agencies.length + (userLocation ? 1 : 0)
      if (totalPoints <= 1) {
        const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
          if (map.getZoom()! > 14) {
            map.setZoom(14)
          }
          window.google.maps.event.removeListener(listener)
        })
      }
    }
  }, [map, agencies, userLocation])

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const handleMarkerClick = (agencyId: string) => {
    setActiveMarker(agencyId);
  }

  if (loadError) {
    return <div>Erro ao carregar o mapa. Verifique sua chave de API do Google Maps.</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={12}
      onLoad={(mapInstance) => setMap(mapInstance)}
      onUnmount={() => setMap(null)}
      options={{
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        controlSize: 24,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      }}
    >
      {userLocation && <MarkerF position={userLocation} />}
      {agencies.map(agency => {
        if (!agency.latitude || !agency.longitude) return null;
        const lat = Number(agency.latitude)
        const lng = Number(agency.longitude)
        if (isNaN(lat) || isNaN(lng)) return null;



        return (
          <MarkerF
            key={agency.id}
            position={{ lat, lng }}
            onClick={() => handleMarkerClick(agency.id)}
            icon={{
              url: '/logo.png',
              scaledSize: new (window.google.maps.Size as any)(35, 46),
            }}
          >
            {activeMarker === agency.id && (
              <InfoWindowF
                position={{ lat, lng }}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div className="p-3 max-w-sm bg-white dark:bg-gray-800 text-black dark:text-white rounded-md shadow-lg">
                  <div className="flex items-start gap-3 mb-3">
                    {agency.logo_url && (
                      <img
                        src={agency.logo_url}
                        alt={agency.name}
                        className="w-10 h-10 rounded-full object-rover border"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 leading-tight">{agency.name}</h3>
                      {agency.status === 'approved' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✓ Verificada
                        </span>
                      )}
                    </div>
                  </div>

                  {agency.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {agency.description}
                    </p>
                  )}

                  {agency.agency_type && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        {agency.agency_type}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 mb-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agency.name} ${agency.address || ''} ${agency.city || ''} ${agency.state || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1"
                      title="Ver no Google Maps"
                    >
                      <MapPin className="h-3 w-3 inline-block flex-shrink-0 text-red-500" />
                      <span className="truncate">{agency.address}, {agency.city}, {agency.state}</span>
                    </a>

                    {agency.phone && (
                      <a
                        href={`tel:${agency.phone.replace(/[^0-9+]/g, '')}`}
                        className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1"
                        title="Ligar para agência"
                      >
                        <Phone className="h-3 w-3 inline-block flex-shrink-0 text-violet-500" />
                        <span>{agency.phone}</span>
                      </a>
                    )}

                    {agency.whatsapp && (
                      <a
                        href={`https://wa.me/${agency.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:underline flex items-center gap-1"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-green-500 inline-block flex-shrink-0" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {agency.email && (
                      <a
                        href={`mailto:${agency.email}`}
                        className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1"
                        title="Enviar E-mail"
                      >
                        <Mail className="h-3 w-3 inline-block flex-shrink-0 text-blue-500" />
                        <span className="truncate">{agency.email}</span>
                      </a>
                    )}

                    {agency.website && (
                      <a
                        href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        title="Acessar Website"
                      >
                        <Globe className="h-3 w-3 inline-block flex-shrink-0 text-indigo-500" />
                        <span className="truncate">{agency.website}</span>
                      </a>
                    )}

                    {agency.instagram && (
                      <a
                        href={agency.instagram.startsWith('http') ? agency.instagram : `https://instagram.com/${agency.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                        title="Ver Instagram"
                      >
                        <Instagram className="h-3 w-3 inline-block flex-shrink-0 text-pink-500" />
                        <span>{agency.instagram.replace('@', '')}</span>
                      </a>
                    )}

                    {agency.linkedin && (
                      <a
                        href={agency.linkedin.startsWith('http') ? agency.linkedin : `https://linkedin.com/in/${agency.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                        title="Ver LinkedIn"
                      >
                        <Linkedin className="h-3 w-3 inline-block flex-shrink-0 text-sky-500" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>

                  {agency.areas && agency.areas.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Áreas de atuação:</p>
                      <div className="flex flex-wrap gap-1">
                        {agency.areas.slice(0, 3).map((area, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {area}
                          </span>
                        ))}
                        {agency.areas.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{agency.areas.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    {agency.rating !== null && agency.rating !== undefined && agency.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{agency.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({agency.total_reviews || 0} avaliações)
                        </span>
                      </div>
                    ) : null}

                    {agency.distance !== undefined && (
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {agency.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )
      })}
    </GoogleMap>
  )
}
