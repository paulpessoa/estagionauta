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
import { User, GraduationCap, Loader2, CheckCircle, XCircle, Briefcase, Plus, Trash2, List, Github, Globe, MapPin } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
    linkedin_url: '',
    is_currently_interning: false,
    city_state: '',
    portfolio_url: '',
    github_url: '',
    experiences: [] as any[],
    education: [] as any[],
    skills: [] as string[],
    languages: [] as string[]
  })

  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [slugError, setSlugError] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')

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
        linkedin_url: profile.linkedin_url || '',
        is_currently_interning: profile.is_currently_interning || false,
        city_state: profile.city_state || '',
        portfolio_url: profile.portfolio_url || '',
        github_url: profile.github_url || '',
        experiences: profile.experiences || [],
        education: profile.education || [],
        skills: profile.skills || [],
        languages: profile.languages || []
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
    profileData.is_currently_interning !== (profile.is_currently_interning || false) ||
    profileData.city_state !== (profile.city_state || '') ||
    profileData.portfolio_url !== (profile.portfolio_url || '') ||
    profileData.github_url !== (profile.github_url || '') ||
    JSON.stringify(profileData.experiences) !== JSON.stringify(profile.experiences || []) ||
    JSON.stringify(profileData.education) !== JSON.stringify(profile.education || []) ||
    JSON.stringify(profileData.skills) !== JSON.stringify(profile.skills || []) ||
    JSON.stringify(profileData.languages) !== JSON.stringify(profile.languages || []) ||
    slug !== (profile.curriculo_slug || '')
  ) : false

  const handleSaveAll = async () => {
    if (!user) return

    try {
      setLoading(true)

      // 1. Salvar perfil e informações adicionais
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
          is_currently_interning: profileData.is_currently_interning,
          city_state: profileData.city_state,
          portfolio_url: profileData.portfolio_url,
          github_url: profileData.github_url,
          experiences: profileData.experiences,
          education: profileData.education,
          skills: profileData.skills,
          languages: profileData.languages,
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

  // Experiências handlers
  const handleAddExperience = () => {
    setProfileData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        { company: '', position: '', startDate: '', endDate: '', current: false, description: '' }
      ]
    }))
  }

  const handleRemoveExperience = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }))
  }

  const handleExperienceChange = (index: number, field: string, value: any) => {
    setProfileData((prev) => {
      const newExps = [...prev.experiences]
      newExps[index] = { ...newExps[index], [field]: value }
      return { ...prev, experiences: newExps }
    })
  }

  // Histórico Acadêmico handlers
  const handleAddEducation = () => {
    setProfileData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', current: false }
      ]
    }))
  }

  const handleRemoveEducation = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const handleEducationChange = (index: number, field: string, value: any) => {
    setProfileData((prev) => {
      const newEdus = [...prev.education]
      newEdus[index] = { ...newEdus[index], [field]: value }
      return { ...prev, education: newEdus }
    })
  }

  // Skills e Idiomas handlers
  const handleAddSkill = () => {
    if (!skillInput.trim()) return
    const skillsList = skillInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !profileData.skills.includes(s))
    setProfileData((prev) => ({
      ...prev,
      skills: [...prev.skills, ...skillsList]
    }))
    setSkillInput('')
  }

  const handleRemoveSkill = (skill: string) => {
    setProfileData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }))
  }

  const handleAddLanguage = () => {
    if (!languageInput.trim()) return
    const langList = languageInput
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l && !profileData.languages.includes(l))
    setProfileData((prev) => ({
      ...prev,
      languages: [...prev.languages, ...langList]
    }))
    setLanguageInput('')
  }

  const handleRemoveLanguage = (lang: string) => {
    setProfileData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== lang)
    }))
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
                  <Label htmlFor="city_state">Cidade/Estado</Label>
                  <Input
                    id="city_state"
                    value={profileData.city_state}
                    onChange={(e) => setProfileData({ ...profileData, city_state: e.target.value })}
                    placeholder="Ex: São Paulo - SP"
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
                <div>
                  <Label htmlFor="github_url">GitHub</Label>
                  <Input
                    id="github_url"
                    value={profileData.github_url}
                    onChange={(e) => setProfileData({ ...profileData, github_url: e.target.value })}
                    placeholder="https://github.com/seu-usuario"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="portfolio_url">Website / Portfólio</Label>
                  <Input
                    id="portfolio_url"
                    value={profileData.portfolio_url}
                    onChange={(e) => setProfileData({ ...profileData, portfolio_url: e.target.value })}
                    placeholder="https://seu-portfolio.com"
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

          {/* Informações Acadêmicas Principais */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="h-5 w-5 text-violet-600" />
                Curso Principal
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
                      <SelectItem value="1-2">1º ao 2º período</SelectItem>
                      <SelectItem value="3-5">3º ao 5º período</SelectItem>
                      <SelectItem value="6+">6º período em diante</SelectItem>
                      <SelectItem value="graduated">Formado há até 1 ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-violet-600" />
                  <div>
                    <Label htmlFor="is_currently_interning" className="font-semibold text-sm cursor-pointer">
                      Estou estagiando atualmente
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Marque se você está em um estágio no momento.</p>
                  </div>
                </div>
                <Switch
                  id="is_currently_interning"
                  checked={profileData.is_currently_interning}
                  onCheckedChange={(checked) => setProfileData({ ...profileData, is_currently_interning: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Experiências Profissionais */}
          <Card>
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Briefcase className="h-5 w-5 text-violet-600" />
                Experiências Profissionais
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddExperience}
                className="text-xs flex items-center gap-1 border-violet-600 text-violet-600 hover:bg-violet-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Experiência
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileData.experiences.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg text-muted-foreground text-sm">
                  Nenhuma experiência profissional cadastrada.
                </div>
              ) : (
                profileData.experiences.map((exp, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/10 relative space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveExperience(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Empresa / Organização *</Label>
                        <Input
                          value={exp.company || ''}
                          onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                          placeholder="Ex: Tech Solutions Inc"
                          required
                        />
                      </div>
                      <div>
                        <Label>Cargo / Posição *</Label>
                        <Input
                          value={exp.position || ''}
                          onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                          placeholder="Ex: Desenvolvedor Front-end"
                          required
                        />
                      </div>
                      <div>
                        <Label>Data de Início *</Label>
                        <Input
                          value={exp.startDate || ''}
                          onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                          placeholder="Ex: Jan 2023"
                          required
                        />
                      </div>
                      <div>
                        <Label>Data de Fim (ou "Atual")</Label>
                        <Input
                          value={exp.current ? 'Atual' : (exp.endDate || '')}
                          disabled={exp.current}
                          onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                          placeholder="Ex: Dez 2024"
                        />
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Checkbox
                          id={`exp-current-${index}`}
                          checked={exp.current || false}
                          onCheckedChange={(checked) => {
                            handleExperienceChange(index, 'current', !!checked);
                            if (checked) {
                              handleExperienceChange(index, 'endDate', 'Atual');
                            }
                          }}
                        />
                        <Label htmlFor={`exp-current-${index}`} className="text-sm font-medium cursor-pointer">
                          Ainda trabalho nesta empresa
                        </Label>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Principais Atividades e Conquistas *</Label>
                        <Textarea
                          value={exp.description || ''}
                          onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                          placeholder="Descreva suas conquistas, projetos em que trabalhou e tecnologias que utilizou diariamente."
                          className="h-20 resize-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Histórico Acadêmico Detalhado */}
          <Card>
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="h-5 w-5 text-violet-600" />
                Histórico Acadêmico Adicional
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEducation}
                className="text-xs flex items-center gap-1 border-violet-600 text-violet-600 hover:bg-violet-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Formação
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileData.education.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg text-muted-foreground text-sm">
                  Nenhuma formação acadêmica detalhada cadastrada.
                </div>
              ) : (
                profileData.education.map((edu, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/10 relative space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEducation(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Instituição *</Label>
                        <Input
                          value={edu.institution || ''}
                          onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                          placeholder="Ex: USP - Universidade de São Paulo"
                          required
                        />
                      </div>
                      <div>
                        <Label>Nível (Grau) *</Label>
                        <Input
                          value={edu.degree || ''}
                          onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                          placeholder="Ex: Bacharelado, Tecnólogo, Técnico"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Área / Curso *</Label>
                        <Input
                          value={edu.fieldOfStudy || ''}
                          onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)}
                          placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                          required
                        />
                      </div>
                      <div>
                        <Label>Data de Início *</Label>
                        <Input
                          value={edu.startDate || ''}
                          onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)}
                          placeholder="Ex: 2021"
                          required
                        />
                      </div>
                      <div>
                        <Label>Conclusão</Label>
                        <Input
                          value={edu.current ? 'Cursando' : (edu.endDate || '')}
                          disabled={edu.current}
                          onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)}
                          placeholder="Ex: 2025"
                        />
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Checkbox
                          id={`edu-current-${index}`}
                          checked={edu.current || false}
                          onCheckedChange={(checked) => {
                            handleEducationChange(index, 'current', !!checked);
                            if (checked) {
                              handleEducationChange(index, 'endDate', 'Cursando');
                            }
                          }}
                        />
                        <Label htmlFor={`edu-current-${index}`} className="text-sm font-medium cursor-pointer">
                          Ainda estou cursando
                        </Label>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Competências & Idiomas */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <List className="h-5 w-5 text-violet-600" />
                Competências & Idiomas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Competências */}
              <div className="space-y-2">
                <Label>Habilidades Técnicas e Interpessoais</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Ex: React, Node.js, TypeScript, Kanban (separe por vírgulas)"
                  />
                  <Button type="button" onClick={handleAddSkill} className="bg-violet-600 hover:bg-violet-700 text-white">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 flex items-center gap-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-violet-500 hover:text-violet-800 focus:outline-none"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Idiomas */}
              <div className="space-y-2">
                <Label>Idiomas</Label>
                <div className="flex gap-2">
                  <Input
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLanguage();
                      }
                    }}
                    placeholder="Ex: Inglês Avançado, Espanhol Básico"
                  />
                  <Button type="button" onClick={handleAddLanguage} className="bg-violet-600 hover:bg-violet-700 text-white">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.languages.map((lang, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
                      {lang}
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(lang)}
                        className="text-indigo-500 hover:text-indigo-800 focus:outline-none"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={loading || !isDirty || (slug !== '' && slugStatus === 'unavailable')}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-md transition-all duration-200"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
