import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Lock, Trash2 } from 'lucide-react'
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