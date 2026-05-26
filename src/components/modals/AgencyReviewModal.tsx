import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const reviewSchema = z.object({
  rating: z.number().min(1, 'A nota é obrigatória.').max(5),
  comment: z.string().min(20, 'O comentário deve ter pelo menos 20 caracteres.').max(1000),
  justification: z.string().min(10, 'A justificativa deve ter pelo menos 10 caracteres.').max(500),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface AgencyReviewModalProps {
  isOpen: boolean
  onClose: () => void
  agencyId: string
  agencyName: string
  onReviewSubmitted: () => void
}

export function AgencyReviewModal({ isOpen, onClose, agencyId, agencyName, onReviewSubmitted }: AgencyReviewModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '', justification: '' },
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast.error('Você precisa estar logado para enviar uma avaliação.')
      return
    }
    setLoading(true)
    try {
      // Double check if already reviewed
      const { data: existing, error: checkError } = await supabase
        .from('agency_reviews')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('user_id', user.id)
        .limit(1)

      if (checkError) throw checkError

      if (existing && existing.length > 0) {
        toast.error('Você já enviou uma avaliação para esta agência.')
        handleClose()
        return
      }

      const { error } = await supabase.from('agency_reviews').insert({
        agency_id: agencyId,
        user_id: user.id,
        rating: data.rating,
        comment: data.comment,
        justification: data.justification,
        status: 'pending' // Aguardando moderação
      })

      if (error) throw error

      toast.success('Avaliação enviada com sucesso! Obrigado pela sua contribuição.')
      onReviewSubmitted()
      handleClose()
    } catch (error) {
      toast.error('Ocorreu um erro ao enviar sua avaliação. Tente novamente.')
      console.error('Review submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Avaliar {agencyName}</DialogTitle>
          <DialogDescription>
            Sua avaliação ajuda outros estudantes a fazerem melhores escolhas. Seja honesto e construtivo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Sua nota *</Label>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-8 w-8 cursor-pointer transition-colors',
                        field.value >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      )}
                      onClick={() => field.onChange(star)}
                    />
                  ))}
                </div>
              )}
            />
            {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>}
          </div>

          <div>
            <Label htmlFor="comment">Seu comentário *</Label>
            <Textarea id="comment" {...register('comment')} placeholder="Descreva sua experiência com a agência, os pontos positivos e negativos." rows={4} />
            {errors.comment && <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>}
          </div>

          <div>
            <Label htmlFor="justification">Justificativa da nota *</Label>
            <Textarea id="justification" {...register('justification')} placeholder="Explique brevemente por que você deu essa nota. Isso ajuda na moderação." rows={2} />
            {errors.justification && <p className="text-red-500 text-sm mt-1">{errors.justification.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 