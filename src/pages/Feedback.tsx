import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquareCode, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { apiClient } from '@/services/api'

export default function Feedback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [source, setSource] = useState<string>('general')
  const [showCommentField, setShowCommentField] = useState(false)

  useEffect(() => {
    const ratingParam = searchParams.get('rating')
    const emailParam = searchParams.get('email')
    const sourceParam = searchParams.get('source')
    const showCommentParam = searchParams.get('show_comment')

    if (ratingParam) {
      const parsedRating = parseInt(ratingParam, 10)
      if (parsedRating >= 1 && parsedRating <= 5) {
        setRating(parsedRating)
      }
    }

    if (emailParam) {
      setEmail(emailParam)
    }

    if (sourceParam) {
      setSource(sourceParam)
    }

    if (showCommentParam === 'true') {
      setShowCommentField(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Por favor, escolha uma nota.')
      return
    }
    if (!email) {
      toast.error('Por favor, preencha o campo de e-mail.')
      return
    }

    setLoading(true)
    try {
      let error = null;

      // Use specialized endpoint for Jotform source
      if (source === 'jotform') {
        const response = await apiClient.post('/feedback-jotform', {
          email: email.trim(),
          rating,
          comment: comment.trim() || null,
          source,
        })
        error = response.error || null;
      } else {
        // Use default Supabase method for other sources
        const result = await supabase.from('feedbacks').insert({
          rating,
          comment: comment.trim() || null,
          email: email.trim(),
        })
        error = result.error;
      }

      if (error) throw error

      setSubmitted(true)
      toast.success('Feedback enviado com sucesso!')
    } catch (err: any) {
      console.error('Error submitting feedback:', err)
      toast.error('Erro ao enviar o feedback. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
        <Card className="w-full max-w-md border-indigo-100 dark:border-indigo-950/40 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 animate-fade-in">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feedback Recebido!</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Obrigado pela sua opinião! Suas respostas nos ajudam a melhorar cada vez mais.
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <Card className="w-full max-w-lg border-indigo-100 dark:border-indigo-950/40 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-2">
            <MessageSquareCode size={24} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sua opinião importa pra gente
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            {source === 'jotform' 
              ? 'O que achou desta iniciativa? Sua avaliação nos ajuda a melhorar.'
              : 'Diga-nos o que achou da plataforma e em que podemos melhorar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sua nota:</span>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={36}
                    className={`cursor-pointer transition-all duration-150 hover:scale-110 ${
                      (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400 scale-105'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seu E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/50 dark:bg-gray-800/50"
              />
            </div>

            {(showCommentField || source !== 'jotform') && (
              <div className="space-y-2">
                <label htmlFor="comment" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {source === 'jotform' ? 'Deixe um comentário (Opcional)' : 'Comentário ou Sugestão (Opcional)'}
                </label>
                <Textarea
                  id="comment"
                  placeholder={
                    source === 'jotform'
                      ? 'Conte-nos o que achou desta iniciativa, o que te motivou, ou sugestões...'
                      : 'Fale pra gente o que você achou dos recursos, o que mais gostou ou o que está faltando...'
                  }
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="bg-white/50 dark:bg-gray-800/50 resize-none"
                />
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-md transition-all hover:shadow-lg"
            >
              {loading ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
