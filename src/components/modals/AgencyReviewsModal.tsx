
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string
  justification: string
  created_at: string
  user_id: string
}

interface AgencyReviewsModalProps {
  isOpen: boolean
  onClose: () => void
  agencyId: string
  agencyName: string
}

export function AgencyReviewsModal({ isOpen, onClose, agencyId, agencyName }: AgencyReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && agencyId) {
      fetchReviews()
    }
  }, [isOpen, agencyId])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('agency_reviews')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
      toast.error('Não foi possível carregar as avaliações.')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
      />
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliações - {agencyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ainda não há avaliações para esta agência.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <Badge variant="outline">{review.rating}/5</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(review.created_at)}
                  </span>
                </div>

                {review.title && (
                  <h4 className="font-semibold text-lg">{review.title}</h4>
                )}

                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Comentário:</p>
                    <p className="text-sm">{review.comment}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Justificativa da nota:</p>
                    <p className="text-sm">{review.justification}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
