
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface CommentReportModalProps {
  isOpen: boolean
  onClose: () => void
  commentId: string
}

export function CommentReportModal({ isOpen, onClose, commentId }: CommentReportModalProps) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const reasons = [
    'Spam ou conteúdo comercial não solicitado',
    'Discurso de ódio ou discriminação',
    'Assédio ou bullying',
    'Informações falsas',
    'Conteúdo ofensivo',
    'Violação de privacidade',
    'Outro'
  ]

  const handleSubmit = async () => {
    if (!reason || !user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comment_reports')
        .insert([{
          comment_id: commentId,
          reported_by: user.id,
          reason,
          description: description.trim() || null
        }])

      if (error) throw error

      toast.success('Denúncia enviada com sucesso. Nossa equipe irá analisar.')
      onClose()
      setReason('')
      setDescription('')
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error)
      toast.error('Não foi possível enviar a denúncia.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar Comentário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da denúncia *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição adicional (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Forneça mais detalhes sobre o problema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !reason}>
              {loading ? 'Enviando...' : 'Enviar Denúncia'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
