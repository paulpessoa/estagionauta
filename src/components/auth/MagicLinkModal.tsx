import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Mail, Zap, ExternalLink, CheckCircle, AlertCircle, Cloud, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface MagicLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emailProviders = [
  { name: 'Gmail', url: 'https://mail.google.com', icon: Mail },
  { name: 'Yahoo', url: 'https://mail.yahoo.com', icon: Mail },
  { name: 'Outlook', url: 'https://outlook.live.com', icon: Mail },
  { name: 'Hotmail', url: 'https://outlook.live.com', icon: Mail },
  { name: 'iCloud', url: 'https://www.icloud.com/mail', icon: Cloud },
  { name: 'ProtonMail', url: 'https://mail.proton.me', icon: Lock }
]

export function MagicLinkModal({ open, onOpenChange }: MagicLinkModalProps) {
  const { signInWithOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError('')

    try {
      await signInWithOtp(email)
      setIsSent(true)
    } catch (error) {
      setError('Erro ao enviar email. Verifique o endereço e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const openEmailProvider = (url: string) => {
    window.open(url, '_blank')
  }

  const resetModal = () => {
    setEmail('')
    setIsSent(false)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center">
            {isSent ? 'Email Enviado!' : 'Login sem Senha'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSent 
              ? 'Verifique sua caixa de entrada e clique no link mágico para fazer login.'
              : 'Digite seu email e receba um link mágico para fazer login instantâneo.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Link Mágico
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">
                Link mágico enviado para <strong>{email}</strong>
              </span>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Abrir provedor de email:</Label>
              <div className="grid grid-cols-2 gap-2">
                {emailProviders.map((provider) => {
                  const IconComponent = provider.icon
                  return (
                    <Button
                      key={provider.name}
                      variant="outline"
                      size="sm"
                      onClick={() => openEmailProvider(provider.url)}
                      className="justify-start"
                    >
                      <IconComponent className="w-4 h-4 mr-2 text-muted-foreground" />
                      {provider.name}
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button variant="outline" onClick={resetModal} className="flex-1">
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setIsSent(false)
                  setEmail('')
                }} 
                className="flex-1"
              >
                Enviar Novamente
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 