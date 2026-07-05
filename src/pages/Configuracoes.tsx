import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Lock, Trash2, Key, Bot, Copy, Check } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { apiClient } from '@/lib/apiClient'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function Configuracoes() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [deleteLoading, setDeleteLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  // BYOK States
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [geminiInput, setGeminiInput] = useState('')
  const [openaiInput, setOpenaiInput] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [keySuccess, setKeySuccess] = useState('')

  // MCP States
  const [sessionToken, setSessionToken] = useState('')
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const loadKeyStatus = async () => {
    try {
      setStatusLoading(true)
      const res = await apiClient.get<{ hasGeminiKey: boolean; hasOpenaiKey: boolean }>('/api/user/keys/status')
      setHasGeminiKey(res.hasGeminiKey)
      setHasOpenaiKey(res.hasOpenaiKey)
    } catch (err) {
      console.error('Error loading key status:', err)
    } finally {
      setStatusLoading(false)
    }
  }

  const loadSessionToken = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setSessionToken(data.session.access_token)
      }
    } catch (err) {
      console.error('Error loading session token:', err)
    }
  }

  useEffect(() => {
    loadKeyStatus()
    loadSessionToken()
  }, [])

  const handleCopyToken = () => {
    if (sessionToken) {
      navigator.clipboard.writeText(sessionToken)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
      toast({
        title: "Token copiado!",
        description: "Cole este token na sua ferramenta de IA para se autenticar no MCP.",
      })
    }
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText("https://estagionauta-mcp.paulmspessoa.workers.dev/mcp")
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
    toast({
      title: "URL copiada!",
      description: "URL do servidor MCP copiada para a área de transferência.",
    })
  }

  const handleSaveKeys = async () => {
    setKeyError('')
    setKeySuccess('')

    if (!geminiInput.trim() && !openaiInput.trim()) {
      setKeyError('Por favor, insira pelo menos uma chave de API para salvar.')
      return
    }

    try {
      setSaveLoading(true)
      const payload: any = {}
      if (geminiInput.trim()) payload.geminiKey = geminiInput.trim()
      if (openaiInput.trim()) payload.openaiKey = openaiInput.trim()

      const res = await apiClient.post<{ success: boolean; message: string }>('/api/user/keys', payload)
      if (res.success) {
        setKeySuccess('Chaves de API configuradas e validadas com sucesso!')
        setGeminiInput('')
        setOpenaiInput('')
        toast({
          title: "Chaves configuradas",
          description: "Suas chaves de API próprias foram salvas e criptografadas.",
        })
        loadKeyStatus()
      }
    } catch (err: any) {
      console.error('Error saving keys:', err)
      setKeyError(err.message || 'Erro ao validar ou salvar chaves de API. Certifique-se de que a chave está ativa.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDeleteKey = async (provider: 'gemini' | 'openai') => {
    try {
      const res = await apiClient.delete<{ success: boolean }>(`/api/user/keys/${provider}`)
      toast({
        title: "Chave removida",
        description: `Sua chave do ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} foi deletada.`,
      })
      loadKeyStatus()
    } catch (err: any) {
      console.error(`Error deleting ${provider} key:`, err)
      toast({
        title: "Erro",
        description: `Erro ao remover chave do ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}.`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true)
      const res = await apiClient.delete<{ success: boolean }>('/api/user/delete-account')
      toast({
        title: "Conta excluída",
        description: "Sua conta foi permanentemente removida.",
      })
      await signOut()
      navigate('/')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir conta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwSuccess('')

    if (newPassword.length < 6) {
      setPwError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPwError('As senhas não coincidem.')
      return
    }

    try {
      setPwLoading(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setPwError(error.message)
      } else {
        setPwSuccess('Senha atualizada com sucesso!')
        setNewPassword('')
        setConfirmNewPassword('')
        toast({
          title: "Senha atualizada",
          description: "Sua senha de acesso foi alterada.",
        })
      }
    } catch (err) {
      setPwError('Erro inesperado ao alterar senha.')
    } finally {
      setPwLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground mt-2">Você precisa estar logado para acessar as configurações.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações da Conta</h1>
            <p className="text-muted-foreground mt-1">Gerencie a segurança da sua conta e preferências administrativas.</p>
          </div>

          {/* Alterar Senha */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="h-5 w-5 text-violet-600" />
                Alterar Senha de Acesso
              </CardTitle>
              <CardDescription>
                Atualize sua senha de segurança para acessar o Estagionauta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pwError && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="text-green-600 text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
                  {pwSuccess}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="bg-background"
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={pwLoading}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium"
              >
                {pwLoading ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </CardContent>
          </Card>

          {/* Chaves de API Próprias (BYOK) */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Key className="h-5 w-5 text-violet-600" />
                Chaves de API Próprias (BYOK)
              </CardTitle>
              <CardDescription>
                Adicione suas chaves do Google Gemini e OpenAI. O uso de chaves próprias consome suas cotas externas e garante uso gratuito e ilimitado, sem gastar créditos do Estagionauta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                <strong>🔒 Segurança em Primeiro Lugar:</strong> Suas chaves de API são enviadas por conexão segura HTTPS, criptografadas no servidor usando criptografia robusta AES-256-GCM com chave mestra e armazenadas de forma segura. Elas são usadas apenas para processar suas próprias chamadas de IA e <strong>nunca</strong> são expostas ou exibidas novamente (política write-only).
              </div>

              {keyError && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
                  {keyError}
                </div>
              )}
              {keySuccess && (
                <div className="text-green-600 text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900">
                  {keySuccess}
                </div>
              )}

              {statusLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse py-2">
                  Carregando status das chaves de API...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Google Gemini */}
                  {hasGeminiKey ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <div className="flex flex-col mr-4">
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">Google Gemini API Key</span>
                        <span className="text-xs text-green-605 dark:text-green-500 mt-0.5">Configurada e Ativa. Suas consultas do Rover, análise de currículos e recesso usarão sua própria chave sem débito de créditos.</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteKey('gemini')} className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0">
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                      <Input
                        id="gemini-key"
                        type="password"
                        placeholder="Insira sua chave (AIzaSy...)"
                        value={geminiInput}
                        onChange={(e) => setGeminiInput(e.target.value)}
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Obtenha uma chave gratuita no <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline font-medium">Google AI Studio</a> (limite de até 15 RPM gratuito).
                      </p>
                    </div>
                  )}

                  {/* OpenAI */}
                  {hasOpenaiKey ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <div className="flex flex-col mr-4">
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">OpenAI API Key</span>
                        <span className="text-xs text-green-605 dark:text-green-500 mt-0.5">Configurada e Ativa. Usada para o Simulador de Entrevistas (áudio e feedback) e TTS próprio.</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteKey('openai')} className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0">
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="Insira sua chave (sk-...)"
                        value={openaiInput}
                        onChange={(e) => setOpenaiInput(e.target.value)}
                        className="bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Obtenha sua chave de API no painel da <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline font-medium">OpenAI Platform</a>.
                      </p>
                    </div>
                  )}

                  {(!hasGeminiKey || !hasOpenaiKey) && (
                    <Button
                      onClick={handleSaveKeys}
                      disabled={saveLoading}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium w-full sm:w-auto"
                    >
                      {saveLoading ? 'Salvando e Validando...' : 'Salvar e Validar Chaves'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integração de IA (MCP) */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bot className="h-5 w-5 text-violet-600" />
                Vincular Assistente de IA (MCP)
              </CardTitle>
              <CardDescription>
                Conecte o Estagionauta diretamente ao Claude, Cursor ou Gemini utilizando o Model Context Protocol (MCP) remoto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">URL de Conexão (SSE)</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value="https://estagionauta-mcp.paulmspessoa.workers.dev/mcp"
                      className="bg-background font-mono text-xs text-sky-600 dark:text-sky-400 select-all"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyUrl} className="shrink-0">
                      {copiedUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Seu Token de Acesso Temporário (JWT)</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      type="password"
                      value={sessionToken}
                      className="bg-background font-mono text-xs select-all"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyToken} className="shrink-0" disabled={!sessionToken}>
                      {copiedToken ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este token expira periodicamente por segurança. Copie e passe-o para a sua IA quando ela solicitar autenticação.
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground">Como configurar no Claude Desktop:</span>
                <ol className="list-decimal list-inside space-y-1 mt-1 pl-1">
                  <li>Abra o arquivo de configurações do Claude Desktop.</li>
                  <li>Adicione a URL de conexão do Estagionauta na seção <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono">mcpServers</code>.</li>
                  <li>Ao conversar com o Claude, forneça o seu Token de Acesso para sincronizar seu Kanban e saldo de créditos.</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Deletar Conta */}
          <Card className="border-red-200 dark:border-red-900 bg-red-50/5">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xl text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5 text-red-600" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Excluir sua conta permanentemente e apagar todos os seus registros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ao excluir sua conta, todos os seus dados cadastrados, currículos criados, históricos de simulações de entrevista e saldos de créditos serão permanentemente apagados da plataforma. Esta ação é definitiva e não poderá ser desfeita.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-650 hover:bg-red-700 text-white font-semibold">
                    Excluir Minha Conta Permanentemente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza absoluta que deseja excluir?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é permanente e irreversível. Todos os seus dados de currículo, créditos e histórico de simulações de entrevista serão deletados para sempre.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      {deleteLoading ? 'Excluindo...' : 'Sim, excluir minha conta'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}