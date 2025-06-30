import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Send, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Plus,
  User,
  History,
  Lock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Link } from 'react-router-dom'

interface ShareCurriculoModalProps {
  profile: {
    id: string
    full_name: string
    email: string
    bio?: string
    course?: string
    university?: string
    period?: string
    phone?: string
    linkedin_url?: string
    curriculo_slug: string
  }
  trigger?: React.ReactNode
}

export function ShareCurriculoModal({ profile, trigger }: ShareCurriculoModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emails, setEmails] = useState<string[]>([''])
  const [subject, setSubject] = useState(`Currículo de ${profile.full_name} - Estagionauta`)
  const [message, setMessage] = useState(`Olá!

Gostaria de compartilhar o currículo de ${profile.full_name} com você.

Você pode visualizar o currículo completo em: ${window.location.origin}/curriculo/${profile.curriculo_slug}

Atenciosamente,
${profile.full_name}`)
  const [results, setResults] = useState<Array<{email: string, success: boolean, error?: string}>>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkUserPermissions()
  }, [])

  const checkUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      if (user) {
        // Verificar se o usuário é o dono do currículo
        setIsOwner(user.id === profile.id)
      }
    } catch (error) {
      console.error('Error checking user permissions:', error)
    }
  }

  const addEmail = () => {
    if (emails.length < 5) {
      setEmails([...emails, ''])
    }
  }

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index))
    }
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const validateEmails = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails = emails.filter(email => email.trim() && emailRegex.test(email.trim()))
    
    if (validEmails.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um email válido.",
        variant: "destructive",
      })
      return false
    }

    if (validEmails.length !== emails.filter(e => e.trim()).length) {
      toast({
        title: "Erro",
        description: "Todos os emails devem ser válidos.",
        variant: "destructive",
      })
      return false
    }

    return validEmails
  }

  const handleSendEmails = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para compartilhar currículos.",
        variant: "destructive",
      })
      return
    }

    if (!isOwner) {
      toast({
        title: "Erro",
        description: "Apenas o dono do currículo pode compartilhá-lo.",
        variant: "destructive",
      })
      return
    }

    const validEmails = validateEmails()
    if (!validEmails) return

    setLoading(true)
    setResults([])

    try {
      // Obter token de sessão
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sessão não encontrada')
      }

      // Usar Supabase Edge Function com autorização
      const { data, error } = await supabase.functions.invoke('send-curriculum-email', {
        body: {
          toEmails: validEmails,
          subject,
          message,
          profile,
          curriculumUrl: `${window.location.origin}/curriculo/${profile.curriculo_slug}`
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) {
        throw new Error(error.message || 'Erro ao enviar emails')
      }

      setResults(data.results)
      
      const successCount = data.results.filter((r: { success: boolean }) => r.success).length
      const errorCount = data.results.length - successCount

      if (successCount > 0) {
        toast({
          title: "Emails enviados",
          description: `${successCount} email(s) enviado(s) com sucesso${errorCount > 0 ? `, ${errorCount} falharam` : ''}.`,
        })
      }

      if (errorCount > 0) {
        toast({
          title: "Alguns emails falharam",
          description: `${errorCount} email(s) não puderam ser enviados.`,
          variant: "destructive",
        })
      }

    } catch (error) {
      console.error('Error sending emails:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar emails. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmails([''])
    setSubject(`Currículo de ${profile.full_name} - Estagionauta`)
    setMessage(`Olá!

Gostaria de compartilhar o currículo de ${profile.full_name} com você.

Você pode visualizar o currículo completo em: ${window.location.origin}/curriculo/${profile.curriculo_slug}

Atenciosamente,
${profile.full_name}`)
    setResults([])
  }

  // Se não estiver logado, mostrar botão de login
  if (!currentUser) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Faça Login para Compartilhar
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Login Necessário
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              Você precisa estar logado para compartilhar currículos por email.
            </p>
            <Link to="/login">
              <Button onClick={() => setOpen(false)}>
                Fazer Login
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Se não for o dono, mostrar mensagem de permissão
  if (!isOwner) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <Lock className="h-4 w-4" />
              Apenas o Dono Pode Compartilhar
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Permissão Negada
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600">
              Apenas o dono deste currículo pode compartilhá-lo por email.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Compartilhar por Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compartilhar Currículo por Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informação do Remetente */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Enviando como:</p>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destinatários */}
          <div>
            <Label className="text-sm font-medium">Destinatários (máximo 5)</Label>
            <div className="space-y-2 mt-2">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className="flex-1"
                  />
                  {emails.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEmail(index)}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {emails.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmail}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Email
                </Button>
              )}
            </div>
          </div>

          {/* Assunto */}
          <div>
            <Label htmlFor="subject" className="text-sm font-medium">Assunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Mensagem */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="mt-1"
            />
          </div>

          {/* Preview do currículo */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{profile.full_name}</h4>
                  {profile.course && profile.university && (
                    <p className="text-sm text-gray-600">
                      {profile.course} • {profile.university}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {window.location.origin}/curriculo/{profile.curriculo_slug}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          {results.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Resultado do Envio</Label>
              <div className="space-y-2 mt-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.email}: {result.success ? 'Enviado' : result.error}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Link para logs */}
              <div className="mt-4 pt-4 border-t">
                <Link 
                  to="/email-logs" 
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setOpen(false)}
                >
                  <History className="h-4 w-4" />
                  Ver histórico completo de emails
                </Link>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmails}
              disabled={loading || emails.filter(e => e.trim()).length === 0}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar {emails.filter(e => e.trim()).length} Email(s)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 