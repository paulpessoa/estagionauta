import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { User, Bell, Shield, Palette, Globe } from 'lucide-react'

export default function Configuracoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    bio: ''
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

  const handleSaveProfile = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso.",
    })
  }

  const handleSaveNotifications = () => {
    toast({
      title: "Notificações atualizadas",
      description: "Suas preferências de notificação foram salvas.",
    })
  }

  const handleSavePrivacy = () => {
    toast({
      title: "Privacidade atualizada",
      description: "Suas configurações de privacidade foram salvas.",
    })
  }

  const handleSaveAppearance = () => {
    toast({
      title: "Aparência atualizada",
      description: "Suas preferências de aparência foram salvas.",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600 mt-2">Gerencie suas preferências e configurações da conta</p>
          </div>

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
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
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
              <Button onClick={handleSaveProfile}>Salvar Perfil</Button>
            </CardContent>
          </Card>

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
              <Button onClick={handleSaveNotifications}>Salvar Notificações</Button>
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
              <Button onClick={handleSavePrivacy}>Salvar Privacidade</Button>
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Tema</Label>
                <Select value={appearanceSettings.theme} onValueChange={(value) => setAppearanceSettings({...appearanceSettings, theme: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Button onClick={handleSaveAppearance}>Salvar Aparência</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}