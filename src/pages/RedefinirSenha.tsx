import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Lock, Eye, EyeOff, Mail, Key, Loader2 } from 'lucide-react'

export default function RedefinirSenha() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [hasSession, setHasSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (isMounted) {
        if (session) {
          setHasSession(true)
        }
        setCheckingSession(false)
      }
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        if (session) {
          setHasSession(true)
        }
        setCheckingSession(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }

    try {
      if (!hasSession) {
        // Fluxo OTP: Verifica o código de 6 dígitos primeiro
        if (!email || !token) {
          setError('Email e código de verificação são obrigatórios.')
          setLoading(false)
          return
        }

        const { error: otpError } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: 'recovery'
        })

        if (otpError) {
          setError(`Código inválido ou expirado: ${otpError.message}`)
          setLoading(false)
          return
        }
      }

      // Agora que temos a sessão ativa, atualizamos a senha do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        toast({
          title: "Senha alterada!",
          description: "Sua senha foi redefinida com sucesso. Redirecionando...",
        })
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err) {
      setError('Erro ao redefinir a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-green-600">Senha Redefinida!</CardTitle>
            <CardDescription className="text-center">
              Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login em alguns segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold">Redefinir Senha</CardTitle>
          <CardDescription className="text-center">
            {hasSession 
              ? 'Digite sua nova senha abaixo para atualizar sua conta' 
              : 'Insira seu email, o código recebido e a nova senha para atualizar sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkingSession ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
              <span className="text-xs text-muted-foreground">Verificando sessão de recuperação...</span>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Campos adicionais para o fluxo OTP (quando não há sessão ativa) */}
                {!hasSession && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="token">Código de Recuperação (6 dígitos)</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="token"
                          type="text"
                          placeholder="Digite o código recebido no email"
                          value={token}
                          onChange={(e) => setToken(e.target.value.replace(/\s/g, ''))}
                          className="pl-10 font-mono"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirme sua nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Atualizando..." : "Redefinir Senha"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
