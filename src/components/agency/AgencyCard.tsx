
import { useState } from 'react'
import { Agency } from '@/types/agency'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { AuthRequiredModal } from '@/components/AuthRequiredModal'
import { Building, MapPin, Star, Globe, Phone, Instagram, Users, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AgencyCommentsSection } from '@/components/agency/AgencyCommentsSection'

interface AgencyCardProps {
  agency: Agency & { distance?: number }
  onReviewClick: () => void
  onViewReviews: () => void
}

export function AgencyCard({ agency, onReviewClick, onViewReviews }: AgencyCardProps) {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const handleReactionClick = () => {
    if (!user) {
      setShowAuthModal(true)
    } else {
      toast.info('Funcionalidade de reação em desenvolvimento!')
    }
  }

  const handleCommentsClick = () => {
    if (!user) {
      setShowAuthModal(true)
    } else {
      setShowComments(!showComments)
    }
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={agency.logo_url ?? undefined} alt={agency.name} />
                <AvatarFallback>{agency.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{agency.name}</span>
                  {agency.status === 'approved' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ Verificada
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-2">{agency.description}</CardDescription>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center justify-end space-x-1 mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{agency.rating ? agency.rating.toFixed(1) : '0.0'}</span>
              </div>
              <p className="text-sm text-muted-foreground cursor-pointer hover:text-primary" onClick={onViewReviews}>
                {agency.total_reviews || 0} avaliações
              </p>
              {agency.distance !== undefined && (
                <p className="text-sm font-bold text-primary mt-1">{agency.distance.toFixed(1)} km</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              <span>{agency.address}, {agency.city} - {agency.state}</span>
            </div>
            {agency.areas && agency.areas.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Áreas de atuação:</p>
                <div className="flex flex-wrap gap-2">
                  {agency.areas.map((area) => (
                    <Badge key={area} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 sm:mb-0">
                {agency.phone && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{agency.phone}</span>
                  </div>
                )}
                {agency.website && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {agency.website}
                    </a>
                  </div>
                )}
                {agency.instagram && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Instagram className="h-4 w-4" />
                    <a href={`https://instagram.com/${agency.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      @{agency.instagram}
                    </a>
                  </div>
                )}
              </div>
              <div className="flex space-x-2 flex-shrink-0">                
                <Button size="sm" onClick={onReviewClick}>
                  Avaliar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="border-t mx-6 my-2"></div>
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground" onClick={handleCommentsClick}>
                <MessageSquare className="h-4 w-4" />
                <span>Comentários</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Última atualização: 2 dias atrás</p>
          </div>
        </div>

        {showComments && (
          <div className="border-t bg-muted/30">
            <AgencyCommentsSection agencyId={agency.id} />
          </div>
        )}
      </Card>
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
