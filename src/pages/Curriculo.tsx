import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CurriculumPDF } from '@/components/ui/curriculum-pdf'
import { ShareCurriculoModal } from '@/components/modals/ShareCurriculoModal'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Building2, 
  Linkedin, 
  Calendar,
  FileText,
  ExternalLink,
  ArrowLeft,
  Download,
  Share2,
  Lock
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Profile } from '@/types/profile'

export default function Curriculo() {
  const { slug } = useParams<{ slug: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!slug) {
        setError('Slug não fornecido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .ilike('curriculo_slug', slug)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Currículo não encontrado')
          } else {
            setError('Erro ao carregar currículo')
          }
          return
        }

        setProfile(data)
        
        // Verificar se o usuário atual é o dono
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        
        const isProfileOwner = user ? user.id === data.id : false
        setIsOwner(isProfileOwner)

        // Verificar visibilidade (privacidade)
        const visibility = data.privacy_settings?.profileVisibility || 'public'
        if (visibility === 'private' && !isProfileOwner) {
          setError('privacy_private')
        }
      } catch (err) {
        setError('Erro ao carregar currículo')
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [slug])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPeriodText = (period: string) => {
    const periods = {
      '1-2': '1º - 2º período',
      '3-5': '3º - 5º período',
      '6+': '6º período ou mais',
      'formado': 'Formado'
    }
    return periods[period as keyof typeof periods] || period
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    const isPrivate = error === 'privacy_private';
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              {isPrivate ? (
                <Lock className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              ) : (
                <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {isPrivate ? 'Currículo Privado' : 'Currículo não encontrado'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                {isPrivate 
                  ? 'Este currículo está configurado como privado pelo proprietário.' 
                  : 'O currículo que você está procurando não existe ou foi removido.'}
              </p>
            </div>
            <Link to="/">
              <Button className="flex items-center gap-2 mx-auto">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>{profile ? `Currículo de ${profile.full_name} | Estagionauta` : 'Currículo | Estagionauta'}</title>
        <meta name="description" content={profile ? `Confira o perfil profissional de ${profile.full_name} no Estagionauta. Veja sua formação, biografia e informações profissionais.` : 'Visualizar currículo profissional no Estagionauta.'} />
        <link rel="canonical" href={`https://www.estagionauta.com.br/curriculo/${slug}`} />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Currículo de {profile.full_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Gerado via Estagionauta
            </p>
            
            {/* Botões de Ação */}
            <div className="flex items-center justify-center gap-3">
              <CurriculumPDF profile={profile} />
              
              {/* Botão de compartilhamento apenas para o dono */}
              {isOwner ? (
                <ShareCurriculoModal 
                  profile={profile}
                  trigger={
                    <Button variant="outline" className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Compartilhar por Email
                    </Button>
                  }
                />
              ) : currentUser ? (
                <Button variant="outline" className="flex items-center gap-2" disabled>
                  <Lock className="h-4 w-4" />
                  Apenas o Dono Pode Compartilhar
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Faça Login para Compartilhar
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {profile.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.full_name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {profile.bio || 'Sem biografia disponível'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.email && (isOwner || profile.privacy_settings?.showEmail !== false) && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {profile.email}
                        </span>
                      </div>
                    )}
                    {profile.phone && (isOwner || profile.privacy_settings?.showPhone !== false) && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {profile.phone}
                        </span>
                      </div>
                    )}
                    {profile.linkedin_url && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-gray-500" />
                        <a 
                          href={profile.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          LinkedIn
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Acadêmicas */}
          {(profile.course || profile.university || profile.period) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Formação Acadêmica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.course && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Curso
                      </Label>
                      <p className="text-gray-900 dark:text-white">
                        {profile.course}
                      </p>
                    </div>
                  )}
                  {profile.university && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Universidade
                      </Label>
                      <p className="text-gray-900 dark:text-white">
                        {profile.university}
                      </p>
                    </div>
                  )}
                  {profile.period && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Período
                      </Label>
                      <p className="text-gray-900 dark:text-white">
                        {getPeriodText(profile.period)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant={profile.subscription_status === 'premium' ? 'default' : 'secondary'}>
                  {profile.subscription_status === 'premium' ? 'Premium' : 'Gratuito'}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Créditos:</span>
                  <Badge variant="outline">{profile.credits}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Membro desde:</Label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Última atualização:</Label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(profile.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8">
            <Separator className="mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Currículo gerado via{' '}
              <a 
                href="/" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Estagionauta
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente Label auxiliar
const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${className}`}>
    {children}
  </div>
) 