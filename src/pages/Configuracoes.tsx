import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { User, Bell, Shield, GraduationCap, Building2, Loader2, CheckCircle, XCircle, Info, Settings, Lock, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  const { user, profile, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    course: '',
    university: '',
    period: '',
    linkedin_url: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
    marketingEmails: false
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false
  })



  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [slugError, setSlugError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  // Carrega dados do perfil
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        course: profile.course || '',
        university: profile.university || '',
        period: profile.period || '',
        linkedin_url: profile.linkedin_url || ''
      })
      setSlug(profile.curriculo_slug || '')

      // Carrega configurações de notificação
      if (profile.notification_settings) {
        setNotificationSettings({
          emailNotifications: profile.notification_settings.emailNotifications ?? true,
          pushNotifications: profile.notification_settings.pushNotifications ?? false,
          weeklyReport: profile.notification_settings.weeklyReport ?? true,
          marketingEmails: profile.notification_settings.marketingEmails ?? false
        })
      }

      // Carrega configurações de privacidade
      if (profile.privacy_settings) {
        setPrivacySettings({
          profileVisibility: profile.privacy_settings.profileVisibility || 'public',
          showEmail: profile.privacy_settings.showEmail ?? false,
          showPhone: profile.privacy_settings.showPhone ?? false
        })
      }


    }
  }, [profile])



  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          bio: profileData.bio,
          course: profileData.course,
          university: profileData.university,
          period: profileData.period,
          linkedin_url: profileData.linkedin_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('user_profiles')
        .update({
          notification_settings: notificationSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Notificações atualizadas",
        description: "Suas preferências de notificação foram salvas.",
      })
    } catch (error) {
      console.error('Error updating notifications:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar notificações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePrivacy = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('user_profiles')
        .update({
          privacy_settings: privacySettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Privacidade atualizada",
        description: "Suas configurações de privacidade foram salvas.",
      })
    } catch (error) {
      console.error('Error updating privacy:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar privacidade. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }



  // Função para sugerir slug
  const suggestSlug = () => {
    if (!profileData.full_name) return ''
    const base = profileData.full_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    return `${base}-${month}${year}`
  }

  // Verifica disponibilidade do slug
  const checkSlug = async (value: string) => {
    setSlugStatus('checking')
    setSlugError('')
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('curriculo_slug', value)
      .maybeSingle()
    if (error) {
      setSlugStatus('idle')
      setSlugError('Erro ao verificar slug')
      return
    }
    if (data && (!user || data.id !== user.id)) {
      setSlugStatus('unavailable')
    } else {
      setSlugStatus('available')
    }
  }

  // Salva o slug no banco
  const handleSaveSlug = async () => {
    if (!user || !slug) return
    setLoading(true)
    setSlugError('')
    await checkSlug(slug)
    if (slugStatus !== 'available') {
      setLoading(false)
      setSlugError('Slug indisponível')
      return
    }
    const { error } = await supabase
      .from('user_profiles')
      .update({ curriculo_slug: slug, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setLoading(false)
    if (error) {
      setSlugError('Erro ao salvar slug')
      return
    }
    toast({
      title: 'Slug salvo!',
      description: `Seu currículo estará disponível em /curriculo/${slug}`,
    })
  }

  const handleAvatarUpdate = (avatarUrl: string) => {
    // Atualizar o perfil local para refletir a mudança imediatamente
    if (profile) {
      // Forçar re-render do componente
      window.location.reload()
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Acesso Negado</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Você precisa estar logado para acessar as configurações.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Gerencie suas preferências e configurações da conta</p>
          </div>

          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Segurança</span>
              </TabsTrigger>
            </TabsList>

            {/* ABA: PERFIL */}
            <TabsContent value="perfil" className="space-y-6 outline-none">
              {/* Perfil */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-5 w-5" />
                    Informações do Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar Upload */}
                  {user && (
                    <div className="mb-4">
                      <AvatarUpload
                        currentAvatarUrl={profile?.avatar_url}
                        onAvatarUpdate={handleAvatarUpdate}
                        userId={user.id}
                        userName={profile?.full_name}
                        compact={true}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nome completo</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin_url">LinkedIn</Label>
                      <Input
                        id="linkedin_url"
                        value={profileData.linkedin_url}
                        onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/seu-perfil"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Biografia</Label>
                    <Input
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Conte um pouco sobre você..."
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </CardContent>
              </Card>

              {/* Informações Acadêmicas */}
              {profile?.role === 'student' && (
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <GraduationCap className="h-5 w-5" />
                      Informações Acadêmicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="course">Curso</Label>
                        <Input
                          id="course"
                          value={profileData.course}
                          onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
                          placeholder="Ex: Ciência da Computação"
                        />
                      </div>
                      <div>
                        <Label htmlFor="university">Universidade</Label>
                        <Input
                          id="university"
                          value={profileData.university}
                          onChange={(e) => setProfileData({ ...profileData, university: e.target.value })}
                          placeholder="Ex: USP"
                        />
                      </div>
                      <div>
                        <Label htmlFor="period">Período</Label>
                        <Select value={profileData.period} onValueChange={(value) => setProfileData({ ...profileData, period: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-2">1º - 2º período</SelectItem>
                            <SelectItem value="3-5">3º - 5º período</SelectItem>
                            <SelectItem value="6+">6º período ou mais</SelectItem>
                            <SelectItem value="formado">Formado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Informações Acadêmicas'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* URL do Currículo Público - Embutido no Perfil */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Info className="h-5 w-5" />
                    URL do Currículo Público
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label htmlFor="curriculo-slug">Escolha um identificador único para seu currículo:</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="curriculo-slug"
                      value={slug}
                      onChange={e => {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                        setSlugStatus('idle')
                      }}
                      onBlur={e => slug && checkSlug(slug)}
                      placeholder={suggestSlug()}
                      className="max-w-xs"
                    />
                    {slugStatus === 'checking' && <Loader2 className="animate-spin h-5 w-5 text-blue-500" />}
                    {slugStatus === 'available' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {slugStatus === 'unavailable' && <XCircle className="h-5 w-5 text-red-600" />}
                  </div>

                  {profile?.curriculo_slug && (
                    <div className="text-sm font-semibold text-primary mt-1">
                      <a
                        href={`/curriculo/${profile.curriculo_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1 w-fit"
                      >
                        Visualizar: estagionauta.com.br/curriculo/{profile.curriculo_slug}
                      </a>
                    </div>
                  )}
                  {slugError && <div className="text-red-600 text-xs">{slugError}</div>}
                  <Button onClick={handleSaveSlug} disabled={loading || !slug || slugStatus !== 'available'}>
                    {loading ? 'Salvando...' : 'Salvar URL do Currículo'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>



            {/* ABA: SEGURANÇA */}
            <TabsContent value="seguranca" className="space-y-6 outline-none">
              {/* Alterar Senha */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Lock className="h-5 w-5" />
                    Alterar Senha
                  </CardTitle>
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
                    />
                  </div>

                  <Button onClick={handleChangePassword} disabled={pwLoading}>
                    {pwLoading ? 'Atualizando...' : 'Atualizar Senha'}
                  </Button>
                </CardContent>
              </Card>

              {/* Deletar Conta */}
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-xl text-red-600 dark:text-red-400">
                    <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    Zona de Perigo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Excluir sua conta removerá permanentemente todos os seus dados da plataforma.
                    Esta ação é irreversível e não poderá ser desfeita.
                  </p>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        Deletar Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação é permanente e irreversível. Todos os seus currículos, créditos
                          adquiridos e históricos de simulações serão perdidos para sempre.
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}