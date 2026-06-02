import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquareCode, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function Feedback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const ratingParam = searchParams.get('rating')
    const emailParam = searchParams.get('email')

    if (ratingParam) {
      const parsedRating = parseInt(ratingParam, 10)
      if (parsedRating >= 1 && parsedRating <= 5) {
        setRating(parsedRating)
      }
    }

    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Por favor, escolha uma quantidade de estrelas.')
      return
    }
    if (!email) {
      toast.error('Por favor, preencha o campo de e-mail.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('feedbacks').insert({
        rating,
        comment: comment.trim() || null,
        email: email.trim(),
      })

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
                Agradecemos imensamente pela sua opinião. Suas respostas nos ajudam a tornar o Estagionauta cada vez melhor.
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Ir para o Início
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
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sua opinião é fundamental</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Diga-nos o que achou da plataforma e em que podemos melhorar.
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

            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Comentário ou Sugestão (Opcional)
              </label>
              <Textarea
                id="comment"
                placeholder="Fale pra gente o que você achou dos recursos, o que mais gostou ou o que está faltando..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="bg-white/50 dark:bg-gray-800/50 resize-none"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-md transition-all hover:shadow-lg">
              {loading ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
