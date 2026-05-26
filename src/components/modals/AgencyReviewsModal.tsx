
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, X, MessageSquare, CheckCircle2 } from 'lucide-react'
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
              <div key={review.id} className="relative bg-card border rounded-xl p-6 shadow-sm transition-all hover:shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-full">{renderStars(review.rating)}</div>
                    <Badge variant="secondary" className="font-bold text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors">{review.rating}/5</Badge>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full w-fit">
                    {formatDate(review.created_at)}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 relative">
                    <MessageSquare className="h-5 w-5 absolute top-4 left-4 text-muted-foreground/30" />
                    <p className="text-sm pl-8 text-foreground leading-relaxed italic">"{review.comment}"</p>
                  </div>

                  {review.justification && (
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Justificativa da Nota
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.justification}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
