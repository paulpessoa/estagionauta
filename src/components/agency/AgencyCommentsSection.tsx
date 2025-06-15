
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThumbsUp, ThumbsDown, Flag, Reply, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { CommentReportModal } from '@/components/modals/CommentReportModal'

interface Comment {
  id: string
  content: string
  likes_count: number
  dislikes_count: number
  created_at: string
  user_id: string
  parent_id: string | null
  user_reaction?: 'like' | 'dislike' | null
  replies?: Comment[]
}

interface AgencyCommentsSectionProps {
  agencyId: string
}

export function AgencyCommentsSection({ agencyId }: AgencyCommentsSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [agencyId])

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('agency_comments')
        .select(`
          *,
          comment_reactions!inner(reaction_type)
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Organizar comentários com respostas
      const commentsMap = new Map()
      const topLevelComments: Comment[] = []

      commentsData?.forEach((comment) => {
        const commentWithReaction = {
          ...comment,
          user_reaction: user ? comment.comment_reactions?.find((r: any) => r.user_id === user.id)?.reaction_type || null : null,
          replies: []
        }
        commentsMap.set(comment.id, commentWithReaction)

        if (!comment.parent_id) {
          topLevelComments.push(commentWithReaction)
        }
      })

      // Adicionar respostas aos comentários principais
      commentsData?.forEach((comment) => {
        if (comment.parent_id) {
          const parentComment = commentsMap.get(comment.parent_id)
          if (parentComment) {
            parentComment.replies.push(commentsMap.get(comment.id))
          }
        }
      })

      setComments(topLevelComments)
    } catch (error) {
      console.error('Erro ao buscar comentários:', error)
      toast.error('Não foi possível carregar os comentários.')
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('agency_comments')
        .insert([{
          agency_id: agencyId,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: null
        }])

      if (error) throw error

      setNewComment('')
      toast.success('Comentário adicionado com sucesso!')
      fetchComments()
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      toast.error('Não foi possível adicionar o comentário.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('agency_comments')
        .insert([{
          agency_id: agencyId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId
        }])

      if (error) throw error

      setReplyContent('')
      setReplyTo(null)
      toast.success('Resposta adicionada com sucesso!')
      fetchComments()
    } catch (error) {
      console.error('Erro ao adicionar resposta:', error)
      toast.error('Não foi possível adicionar a resposta.')
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (commentId: string, reactionType: 'like' | 'dislike') => {
    if (!user) return

    try {
      const { data: existingReaction } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single()

      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction
          await supabase
            .from('comment_reactions')
            .delete()
            .eq('id', existingReaction.id)
        } else {
          // Update reaction
          await supabase
            .from('comment_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id)
        }
      } else {
        // Add new reaction
        await supabase
          .from('comment_reactions')
          .insert([{
            comment_id: commentId,
            user_id: user.id,
            reaction_type: reactionType
          }])
      }

      fetchComments()
    } catch (error) {
      console.error('Erro ao reagir ao comentário:', error)
      toast.error('Não foi possível reagir ao comentário.')
    }
  }

  const handleReport = (commentId: string) => {
    setSelectedCommentId(commentId)
    setReportModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`space-y-3 ${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Usuário</span>
                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm">{comment.content}</p>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(comment.id, 'like')}
                  className={`flex items-center gap-1 ${comment.user_reaction === 'like' ? 'text-green-600' : 'text-muted-foreground'}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{comment.likes_count}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(comment.id, 'dislike')}
                  className={`flex items-center gap-1 ${comment.user_reaction === 'dislike' ? 'text-red-600' : 'text-muted-foreground'}`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{comment.dislikes_count}</span>
                </Button>

                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 text-muted-foreground"
                  >
                    <Reply className="h-4 w-4" />
                    <span>Responder</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReport(comment.id)}
                  className="flex items-center gap-1 text-muted-foreground"
                >
                  <Flag className="h-4 w-4" />
                  <span>Denunciar</span>
                </Button>
              </div>

              {replyTo === comment.id && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Escreva sua resposta..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSubmitReply(comment.id)} disabled={loading}>
                      Responder
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">Comentários</h3>
        <Badge variant="outline">{comments.length}</Badge>
      </div>

      {user && (
        <div className="space-y-3">
          <Textarea
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleSubmitComment} disabled={loading || !newComment.trim()}>
            {loading ? 'Enviando...' : 'Comentar'}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Ainda não há comentários. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>

      {selectedCommentId && (
        <CommentReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false)
            setSelectedCommentId(null)
          }}
          commentId={selectedCommentId}
        />
      )}
    </div>
  )
}
