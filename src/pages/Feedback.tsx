import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquareCode, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { apiClient } from '@/lib/apiClient'

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
      toast.error('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => {
    navigate('/')
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-green-500 shadow-lg">
          <CardContent className="text-center p-8">
            <div className="mb-6 flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-700">Obrigado!</h2>
            <p className="text-gray-600 mb-6">
              Seu feedback é muito importante para nós e nos ajuda a melhorar constantemente.
            </p>
            <Button onClick={handleDone} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mb-4 flex justify-center">
              <MessageSquareCode className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Nos Dê Seu Feedback</CardTitle>
            <CardDescription className="text-base mt-2">
              Queremos ouvir sua opinião! Ajude-nos a melhorar o Estagionauta.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail *
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Como você avalia o Estagionauta? *
                </label>
                <div className="flex gap-3 justify-center py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star)
                        if (star <= 3) {
                          setShowCommentField(true)
                        }
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={loading}
                      className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                    >
                      <Star
                        size={40}
                        className={`${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-600">
                  {rating > 0 ? (
                    <span>
                      {rating === 1 && '😢 Muito Ruim'}
                      {rating === 2 && '😞 Ruim'}
                      {rating === 3 && '😐 Normal'}
                      {rating === 4 && '😊 Bom'}
                      {rating === 5 && '😍 Excelente'}
                    </span>
                  ) : (
                    <span>Clique para avaliar</span>
                  )}
                </div>
              </div>

              {/* Comment Field - Only show for low ratings or explicit request */}
              {showCommentField && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentários (opcional)
                  </label>
                  <Textarea
                    placeholder="Conte-nos como podemos melhorar..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={loading}
                    rows={4}
                    className="w-full resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Seus comentários nos ajudam muito a identificar áreas de melhoria.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full py-6 text-lg font-semibold"
              >
                {loading ? 'Enviando...' : 'Enviar Feedback'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Seus dados serão usados apenas para melhorar nossos serviços.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
