import { useState } from 'react'
import { Agency } from '@/types/agency'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { AuthRequiredModal } from '@/components/AuthRequiredModal'
import { MapPin, Star, Globe, Phone, Instagram, Linkedin, Video, Mail, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AgencyCardProps {
  agency: Agency & { distance?: number }
  onReviewClick: () => void
  onViewReviews: () => void
}

export function AgencyCard({ agency, onReviewClick, onViewReviews }: AgencyCardProps) {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

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
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${agency.name} ${agency.address || ''} ${agency.city || ''} ${agency.state || ''}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground text-sm hover:text-primary hover:underline transition-colors"
              title="Ver no Google Maps"
            >
              <MapPin className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span>{agency.address}, {agency.city} - {agency.state}</span>
            </a>
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pt-4 border-t gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {agency.phone && (
                  <a
                    href={`tel:${agency.phone.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center space-x-1 text-xs bg-muted hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-950 dark:hover:text-violet-300 px-2.5 py-1.5 rounded-full transition-all text-muted-foreground"
                    title="Ligar para agência"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{agency.phone}</span>
                  </a>
                )}
                {agency.whatsapp && (
                  <a
                    href={`https://wa.me/${agency.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs bg-muted hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-300 px-2.5 py-1.5 rounded-full transition-all text-muted-foreground"
                    title="Enviar WhatsApp"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {agency.email && (
                  <a
                    href={`mailto:${agency.email}`}
                    className="flex items-center space-x-1 text-xs bg-muted hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300 px-2.5 py-1.5 rounded-full transition-all text-muted-foreground"
                    title="Enviar E-mail"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>{agency.email}</span>
                  </a>
                )}
                {agency.website && (
                  <a
                    href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs bg-muted hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 px-2.5 py-1.5 rounded-full transition-all text-muted-foreground"
                    title="Acessar Website"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{agency.website}</span>
                  </a>
                )}
                {agency.instagram && (
                  <a
                    href={agency.instagram.startsWith('http') ? agency.instagram : `https://instagram.com/${agency.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs bg-muted hover:bg-pink-100 hover:text-pink-700 dark:hover:bg-pink-950 dark:hover:text-pink-300 px-2.5 py-1.5 rounded-full transition-all text-muted-foreground"
                    title="Ver Instagram"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    <span>{agency.instagram.replace('@', '')}</span>
                  </a>
                )}
                {agency.linkedin && (
                  <a
                    href={agency.linkedin.startsWith('http') ? agency.linkedin : `https://linkedin.com/in/${agency.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs bg-muted hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-950 dark:hover:text-sky-300 px-2.5 py-1.5 rounded-full transition-all text-muted-foreground"
                    title="Ver LinkedIn"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {agency.tiktok && (
                  <a
                    href={agency.tiktok.startsWith('http') ? agency.tiktok : `https://tiktok.com/@${agency.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs bg-muted hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300 px-2.5 py-1.5 rounded-full transition-all text-muted-foreground"
                    title="Ver TikTok"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>TikTok</span>
                  </a>
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
      </Card>
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
