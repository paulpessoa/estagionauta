import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Star, HeartHandshake } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { toast as tototo } from 'sonner'

export default function ReviewModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleStarClick = (value: number) => {
    setRating(value)
  }

  const handleWhatsAppClick = () => {
    const phone = '+5581995097377'
    const message = encodeURIComponent(
      `Olá, gostaria de...`
    )
    const url = `https://wa.me/${phone}?text=${message}`
    window.open(url, '_blank')
  }

  const handleSubmitFeedback = async () => {
    if (rating === 0 || !comment.trim()) {
      tototo.info('Por favor, selecione uma avaliação e um comentário.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('feedbacks').insert({
      rating,
      comment,
      email,
    })
    setLoading(false)
    if (error) {
      tototo.error('Erro ao enviar feedback')
    } else {
      tototo.success('Feedback enviado com sucesso!')
      setRating(0)
      setComment('')
      setEmail('')
      setIsOpen(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleOpen = () => {
    setIsOpen(true)
  }

  return (
    <>
      {/* Floating feedback button */}
      <button
        onClick={handleOpen}
        aria-label="Deixar sugestão"
        className="
          fixed bottom-4 left-24 transform -translate-x-1/2
          bg-gradient-to-r from-purple-500 to-pink-500 
          hover:from-purple-600 hover:to-pink-600
          dark:from-purple-600 dark:to-pink-600
          dark:hover:from-purple-700 dark:hover:to-pink-700
          text-white px-4 py-3 rounded-full shadow-lg
          flex items-center gap-2
          transition-all duration-300 ease-in-out
          hover:scale-105 hover:shadow-xl
          z-50
          font-medium
          md:bottom-8 md:left-24
        "
      >
        <HeartHandshake size={20} />
        <span className="text-sm">Sugestões?</span>
      </button>
      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className='text-center'>Deixe sua avaliação</DialogTitle>
            <p className="text-center text-sm text-muted-foreground mt-2 mb-4">
              Somos muito gratos pela sua opinião! <br /> Isso nos ajuda muito a melhorar e crescer. <br /> Valeu demais!
            </p>
          </DialogHeader>
          <div className="flex space-x-2 justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={32}
                className={`cursor-pointer transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Textarea
              placeholder="Deixe seu comentário"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="mt-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5"
              >
                Fechar
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={loading}
                variant="default"
                className="flex-1 py-2.5"
              >
                {loading ? 'Enviando...' : 'Enviar Feedback'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}