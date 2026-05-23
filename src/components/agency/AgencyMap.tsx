
import { useState, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { Agency } from '@/types/agency'
import { MapPin, Star, Phone, Globe, Instagram, Mail } from 'lucide-react'

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

  useEffect(() => {
    if (activeMarker && !agencies.some(a => a.id === activeMarker)) {
      setActiveMarker(null)
    }
  }, [agencies, activeMarker])

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
        const getContactUrl = () => {
          if (agency.website) {
            return agency.website.startsWith('http') ? agency.website : `https://${agency.website}`;
          }
          if (agency.instagram) {
            return `https://instagram.com/${agency.instagram}`;
          }
          if (agency.phone) {
            const cleanPhone = agency.phone.replace(/\D/g, '');
            return `https://wa.me/55${cleanPhone}`;
          }
          return null;
        };

        const getContactButtonText = () => {
          if (agency.website) return 'Visitar Site';
          if (agency.instagram) return 'Ver Instagram';
          if (agency.phone) return 'WhatsApp';
          return null;
        };

        return agency.latitude && agency.longitude && (
          <MarkerF
            key={agency.id}
            position={{ lat: agency.latitude, lng: agency.longitude }}
            onClick={() => handleMarkerClick(agency.id)}
            icon={{
              url: '/logo.png',
              scaledSize: new (window.google.maps.Size as any)(35, 46),
            }}
          >
            {activeMarker === agency.id && (
              <InfoWindowF 
                position={{ lat: agency.latitude, lng: agency.longitude }}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div className="p-3 max-w-sm bg-white dark:bg-gray-800 text-black dark:text-white rounded-md shadow-lg">
                  <div className="flex items-start gap-3 mb-3">
                    {agency.logo_url && (
                      <img 
                        src={agency.logo_url} 
                        alt={agency.name}
                        className="w-10 h-10 rounded-full object-cover border"
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
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3 inline-block flex-shrink-0" /> 
                      <span className="truncate">{agency.address}, {agency.city}, {agency.state}</span>
                    </p>

                    {agency.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Phone className="h-3 w-3 inline-block flex-shrink-0" /> 
                        <span>{agency.phone}</span>
                      </p>
                    )}

                    {agency.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Mail className="h-3 w-3 inline-block flex-shrink-0" /> 
                        <span className="truncate">{agency.email}</span>
                      </p>
                    )}

                    {agency.website && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Globe className="h-3 w-3 inline-block flex-shrink-0" /> 
                        <span className="truncate">{agency.website}</span>
                      </p>
                    )}

                    {agency.instagram && (
                      <p className="text-sm text-pink-600 dark:text-pink-400 flex items-center gap-1">
                        <Instagram className="h-3 w-3 inline-block flex-shrink-0" /> 
                        <span>@{agency.instagram}</span>
                      </p>
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
                    {agency.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{agency.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({agency.total_reviews || 0} avaliações)
                        </span>
                      </div>
                    )}

                    {agency.distance !== undefined && (
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {agency.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>

                  {getContactUrl() && (
                    <a 
                      href={getContactUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                    >
                      {getContactButtonText()}
                    </a>
                  )}
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )
      })}
    </GoogleMap>
  )
}
