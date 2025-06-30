import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { User, Bell, Shield, Palette, Globe, GraduationCap, Building2, Sun, Moon, Loader2, CheckCircle, XCircle, Info } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useTheme } from 'next-themes'

export default function Configuracoes() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  
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

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system',
    language: 'pt'
  })

  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [slugError, setSlugError] = useState('')

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

      // Carrega configurações de aparência
      if (profile.appearance_settings) {
        setAppearanceSettings({
          theme: profile.appearance_settings.theme || 'system',
          language: profile.appearance_settings.language || 'pt'
        })
      }
    }
  }, [profile])

  // Carrega tema do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setAppearanceSettings(prev => ({ ...prev, theme: savedTheme }))
    }
  }, [])

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

  const handleSaveAppearance = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          appearance_settings: appearanceSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Aparência atualizada",
        description: "Suas preferências de aparência foram salvas.",
      })
    } catch (error) {
      console.error('Error updating appearance:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar aparência. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    setAppearanceSettings(prev => ({ ...prev, theme: newTheme }))
    localStorage.setItem('theme', newTheme)
    
    // Salvar no Supabase se o usuário estiver logado
    if (user && profile) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            appearance_settings: {
              ...appearanceSettings,
              theme: newTheme
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) {
          console.error('Erro ao salvar tema no Supabase:', error)
        } else {
          console.log('Tema salvo no Supabase')
        }
      } catch (error) {
        console.error('Erro ao salvar tema no Supabase:', error)
      }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Acesso Negado</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Você precisa estar logado para acessar as configurações.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Gerencie suas preferências e configurações da conta</p>
          </div>

          {/* Slug do Currículo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Exemplo: <span className="font-mono">{suggestSlug()}</span> <br/>
                Seu currículo ficará disponível em <span className="font-mono">/curriculo/{slug || '<slug>'}</span>
              </div>
              {slugError && <div className="text-red-600 text-xs">{slugError}</div>}
              <Button onClick={handleSaveSlug} disabled={loading || !slug || slugStatus !== 'available'}>
                {loading ? 'Salvando...' : 'Salvar URL do Currículo'}
              </Button>
            </CardContent>
          </Card>

          {/* Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <Input
                    id="linkedin_url"
                    value={profileData.linkedin_url}
                    onChange={(e) => setProfileData({...profileData, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Input
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
                      onChange={(e) => setProfileData({...profileData, course: e.target.value})}
                      placeholder="Ex: Ciência da Computação"
                    />
                  </div>
                  <div>
                    <Label htmlFor="university">Universidade</Label>
                    <Input
                      id="university"
                      value={profileData.university}
                      onChange={(e) => setProfileData({...profileData, university: e.target.value})}
                      placeholder="Ex: USP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="period">Período</Label>
                    <Select value={profileData.period} onValueChange={(value) => setProfileData({...profileData, period: value})}>
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

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Notificações por email</Label>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Notificações push</Label>
                <Switch
                  id="push-notifications"
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-report">Relatório semanal</Label>
                <Switch
                  id="weekly-report"
                  checked={notificationSettings.weeklyReport}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReport: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing-emails">Emails de marketing</Label>
                <Switch
                  id="marketing-emails"
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, marketingEmails: checked})}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Notificações'}
              </Button>
            </CardContent>
          </Card>

          {/* Privacidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="profile-visibility">Visibilidade do perfil</Label>
                <Select value={privacySettings.profileVisibility} onValueChange={(value) => setPrivacySettings({...privacySettings, profileVisibility: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="friends">Apenas amigos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-email">Mostrar email no perfil</Label>
                <Switch
                  id="show-email"
                  checked={privacySettings.showEmail}
                  onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showEmail: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-phone">Mostrar telefone no perfil</Label>
                <Switch
                  id="show-phone"
                  checked={privacySettings.showPhone}
                  onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showPhone: checked})}
                />
              </div>
              <Button onClick={handleSavePrivacy} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Privacidade'}
              </Button>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Tema</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={appearanceSettings.theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('light')}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-sm">Claro</span>
                  </Button>
                  <Button
                    variant={appearanceSettings.theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('dark')}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-sm">Escuro</span>
                  </Button>
                  <Button
                    variant={appearanceSettings.theme === 'system' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('system')}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="text-sm">Sistema</span>
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  O tema será aplicado imediatamente e salvo automaticamente.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="language">Idioma</Label>
                <Select value={appearanceSettings.language} onValueChange={(value) => setAppearanceSettings({...appearanceSettings, language: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveAppearance} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Aparência'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}