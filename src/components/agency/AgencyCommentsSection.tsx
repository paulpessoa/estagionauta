import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThumbsUp, ThumbsDown, Flag, Reply, MessageCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CommentReportModal } from '@/components/modals/CommentReportModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/apiClient'

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
  user_name?: string
  user_avatar?: string | null
  status?: string | null
  moderation_reason?: string | null
}

interface AgencyCommentsSectionProps {
  agencyId: string
}

export function AgencyCommentsSection({ agencyId }: AgencyCommentsSectionProps) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)

  const isAdminOrModerator = profile?.role === 'admin' || profile?.role === 'moderator'

  useEffect(() => {
    fetchComments()
  }, [agencyId])

  const fetchComments = async () => {
    if (!agencyId || agencyId === 'undefined') return
    try {
      const { data: commentsData, error } = await supabase
        .from('agency_comments')
        .select(`
          *,
          comment_reactions (
            user_id,
            reaction_type
          )
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch comment authors profiles client-side to bypass relationship limitations
      const userIds = [...new Set(commentsData?.map((c) => c.user_id).filter(Boolean))] as string[]
      const profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        if (!profilesError && profilesData) {
          profilesData.forEach((profile) => {
            profilesMap.set(profile.id, {
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            })
          })
        }
      }

      // Organize comments with replies and mapped user metadata
      const commentsMap = new Map()
      const topLevelComments: Comment[] = []

      commentsData?.forEach((comment) => {
        const profileInfo = profilesMap.get(comment.user_id)
        const commentWithReaction: Comment = {
          ...comment,
          user_reaction: user ? comment.comment_reactions?.find((r: any) => r.user_id === user.id)?.reaction_type || null : null,
          replies: [],
          user_name: profileInfo?.full_name || 'Estudante',
          user_avatar: profileInfo?.avatar_url || null
        }
        commentsMap.set(comment.id, commentWithReaction)

        if (!comment.parent_id) {
          topLevelComments.push(commentWithReaction)
        }
      })

      // Add replies to their respective parent comments
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

    const findComment = (list: Comment[], id: string): Comment | undefined => {
      for (const item of list) {
        if (item.id === id) return item
        if (item.replies) {
          const found = findComment(item.replies, id)
          if (found) return found
        }
      }
      return undefined
    }

    const parentComment = findComment(comments, parentId)
    if (!parentComment) {
      toast.error('Comentário original não encontrado.')
      return
    }

    if (parentComment.user_id === user.id) {
      toast.error('Você não pode responder ao seu próprio comentário.')
      return
    }

    if (parentComment.parent_id) {
      toast.error('Não é possível responder a uma resposta (máximo 1 nível de aninhamento).')
      return
    }

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

  const handleModerateComment = async (commentId: string) => {
    const reason = window.prompt(
      'Digite a justificativa para a remoção deste comentário por ferir as regras da comunidade:',
      'Violação das regras da comunidade (conteúdo inadequado ou ofensivo)'
    )

    if (reason === null) return // Canceled

    try {
      await apiClient.put(`/api/admin/comments/${commentId}/moderate`, {
        status: 'rejected',
        reason: reason.trim()
      })
      toast.success('Comentário removido pela moderação!')
      fetchComments()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao moderar comentário.')
    }
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

  const redactName = (name?: string) => {
    if (!name) return 'Estudante'
    const char = name.trim().charAt(0).toUpperCase()
    return `Estudante ${char}***`
  }

  const getModeratedComments = (list: Comment[]): Comment[] => {
    const moderated: Comment[] = []
    const traverse = (cList: Comment[]) => {
      cList.forEach((c) => {
        if (c.status === 'rejected') {
          moderated.push(c)
        }
        if (c.replies) {
          traverse(c.replies)
        }
      })
    }
    traverse(list)
    return moderated
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const isRejected = comment.status === 'rejected'

    return (
      <div key={comment.id} className={`space-y-3 ${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        <Card className={isRejected ? 'bg-muted/30 border-dashed' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                {comment.user_avatar && !isRejected ? (
                  <AvatarImage src={comment.user_avatar} alt={comment.user_name || 'Usuário'} />
                ) : null}
                <AvatarFallback>
                  {isRejected ? 'M' : (comment.user_name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {isRejected ? 'Conteúdo Moderado' : (comment.user_name || 'Estudante')}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                  {isRejected && <Badge variant="destructive" className="text-[10px] py-0 px-1">Excluído</Badge>}
                </div>

                {isRejected ? (
                  <p className="text-sm text-muted-foreground italic my-1">
                    Este comentário foi excluído por um administrador por violar as diretrizes da comunidade
                    {comment.moderation_reason ? `: ${comment.moderation_reason}` : '.'}
                  </p>
                ) : (
                  <p className="text-sm">{comment.content}</p>
                )}

                {!isRejected && (
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
                        onClick={() => {
                          if (!user) {
                            toast.error('Você precisa estar logado para responder.')
                            return
                          }
                          setReplyTo(replyTo === comment.id ? null : comment.id)
                        }}
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

                    {isAdminOrModerator && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleModerateComment(comment.id)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Excluir (Admin)</span>
                      </Button>
                    )}
                  </div>
                )}

                {replyTo === comment.id && !isRejected && (
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
  }

  const moderatedCommentsList = getModeratedComments(comments)

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

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
          <TabsTrigger value="active">Comentários Ativos</TabsTrigger>
          <TabsTrigger value="moderated" className="relative">
            Histórico de Moderação
            {moderatedCommentsList.length > 0 && (
              <Badge variant="secondary" className="ml-2 py-0 px-1 text-[10px]">
                {moderatedCommentsList.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-2">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ainda não há comentários. Seja o primeiro a comentar!
            </p>
          ) : (
            comments.map(comment => renderComment(comment))
          )}
        </TabsContent>

        <TabsContent value="moderated" className="space-y-4 mt-2">
          {moderatedCommentsList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhum comentário foi removido pela moderação nesta agência.
            </p>
          ) : (
            moderatedCommentsList.map(comment => (
              <Card key={comment.id} className="border-dashed border-red-200 dark:border-red-950/30">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-red-500">
                      {redactName(comment.user_name)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Moderado em: {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic bg-red-50/50 dark:bg-red-950/10 p-2 rounded border border-red-100/50 dark:border-red-950/20">
                    Justificativa do Administrador: {comment.moderation_reason || 'Violação das regras da comunidade.'}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

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
