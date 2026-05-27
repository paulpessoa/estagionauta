import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { User, GraduationCap, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export default function Perfil() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

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
    }
  }, [profile])

  const isDirty = profile ? (
    profileData.full_name !== (profile.full_name || '') ||
    profileData.phone !== (profile.phone || '') ||
    profileData.bio !== (profile.bio || '') ||
    profileData.course !== (profile.course || '') ||
    profileData.university !== (profile.university || '') ||
    profileData.period !== (profile.period || '') ||
    profileData.linkedin_url !== (profile.linkedin_url || '') ||
    slug !== (profile.curriculo_slug || '')
  ) : false

  const handleSaveAll = async () => {
    if (!user) return

    try {
      setLoading(true)

      // 1. Salvar perfil e informações acadêmicas
      const { error: profileError } = await supabase
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

      if (profileError) throw profileError

      // 2. Salvar slug se tiver sido alterado e for válido
      const isSlugChanged = slug !== (profile?.curriculo_slug || '')
      if (isSlugChanged) {
        if (!slug) {
          throw new Error('O identificador do currículo não pode ser vazio.')
        }
        
        // Verifica se está disponível antes de atualizar
        const { data: existingSlugUser, error: slugCheckError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('curriculo_slug', slug)
          .maybeSingle()

        if (slugCheckError) throw slugCheckError
        if (existingSlugUser && existingSlugUser.id !== user.id) {
          throw new Error('Este identificador já está sendo utilizado por outro usuário.')
        }

        const { error: slugUpdateError } = await supabase
          .from('user_profiles')
          .update({ 
            curriculo_slug: slug, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id)

        if (slugUpdateError) throw slugUpdateError
      }

      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram salvos com sucesso.",
      })
      
      // Forçar reload após salvar para sincronizar tudo
      window.location.reload()
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as alterações. Tente novamente.",
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
      setSlugError('Erro ao verificar identificador')
      return
    }
    if (data && (!user || data.id !== user.id)) {
      setSlugStatus('unavailable')
    } else {
      setSlugStatus('available')
    }
  }

  const handleAvatarUpdate = () => {
    window.location.reload()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground mt-2">Você precisa estar logado para acessar seu perfil.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e acadêmicas de forma visível e atualizada.</p>
          </div>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-violet-600" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url}
                  onAvatarUpdate={handleAvatarUpdate}
                  userId={user.id}
                  userName={profile?.full_name}
                  compact={true}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: JPG, PNG ou WebP. Tamanho máximo: 2MB.
                </p>
              </div>

              <Separator />

              {/* URL do Currículo Público no topo */}
              <div className="space-y-2 p-4 bg-muted/20 rounded-lg border border-border">
                <Label htmlFor="curriculo-slug" className="font-semibold text-sm">Identificador do Currículo Público</Label>
                <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">estagionauta.com.br/curriculo/</span>
                  <Input
                    id="curriculo-slug"
                    value={slug}
                    onChange={e => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      setSlugStatus('idle')
                    }}
                    onBlur={e => slug && checkSlug(slug)}
                    placeholder={suggestSlug()}
                    className="max-w-[200px] bg-background"
                  />
                  {slugStatus === 'checking' && <Loader2 className="animate-spin h-5 w-5 text-violet-600" />}
                  {slugStatus === 'available' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {slugStatus === 'unavailable' && <XCircle className="h-5 w-5 text-red-600" />}
                </div>
                {slugError && <p className="text-red-600 text-xs">{slugError}</p>}
                
                {profile?.curriculo_slug && (
                  <div className="text-xs text-primary mt-1 font-medium">
                    <a
                      href={`/curriculo/${profile.curriculo_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-violet-600 inline-flex items-center gap-1"
                    >
                      Ver perfil público →
                    </a>
                  </div>
                )}
              </div>

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
                  <Label htmlFor="email">Email (não editável)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
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
                <Label htmlFor="bio">Biografia / Resumo Profissional</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você, sua área de interesse e seus objetivos de carreira..."
                  maxLength={500}
                  className="resize-none h-24"
                />
                <div className="text-right text-xs text-muted-foreground mt-1">
                  {profileData.bio.length}/500 caracteres
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Acadêmicas */}
          {profile?.role === 'student' && (
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <GraduationCap className="h-5 w-5 text-violet-600" />
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
                    <Label htmlFor="university">Universidade / Faculdade</Label>
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
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={loading || !isDirty || (slug !== '' && slugStatus === 'unavailable')}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
