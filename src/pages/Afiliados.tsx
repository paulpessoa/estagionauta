import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  DollarSign, 
  Star, 
  CheckCircle, 
  TrendingUp,
  Gift,
  Handshake,
  Target,
  Award
} from 'lucide-react'
import { toast } from 'sonner'

export default function Afiliados() {
  const [showForm, setShowForm] = useState(false)

  const benefits = [
    {
      icon: DollarSign,
      title: "Comissões Atrativas",
      description: "Ganhe até 30% de comissão em cada venda realizada através do seu link"
    },
    {
      icon: TrendingUp,
      title: "Crescimento Contínuo",
      description: "Quanto mais você vende, maior sua comissão. Sistema de níveis progressivos"
    },
    {
      icon: Gift,
      title: "Bônus Exclusivos",
      description: "Acesso a materiais exclusivos e bônus especiais para afiliados"
    },
    {
      icon: Target,
      title: "Suporte Dedicado",
      description: "Equipe especializada para ajudar você a maximizar suas vendas"
    }
  ]

  const commissionRates = [
    { plan: "Plano Lunar", commission: "25%", value: "R$ 2,50" },
    { plan: "Plano Stellar", commission: "30%", value: "R$ 6,00" },
    { plan: "Plano Galáctico", commission: "30%", value: "R$ 9,00" },
    { plan: "Pacotes Individuais", commission: "20%", value: "R$ 4,00 - R$ 6,00" }
  ]

  const requirements = [
    "Ser estudante ativo do grupo @estagiorecife",
    "Ou ser digital influencer com audiência relevante",
    "Ter pelo menos 500 seguidores em redes sociais",
    "Demonstrar engajamento genuíno com conteúdo educacional/profissional"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <img 
              src="/logo.png" 
              alt="Estagionauta Mascot" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Programa de Afiliados
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Junte-se ao Estagionauta e transforme sua influência em uma fonte de renda
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Comissões até 30%
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              Suporte Dedicado
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Award className="w-4 h-4 mr-2" />
              Bônus Exclusivos
            </Badge>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Por que ser um Afiliado?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Commission Rates */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Tabela de Comissões</h2>
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Ganhe com cada venda realizada</CardTitle>
              <CardDescription className="text-center">
                Comissões pagas mensalmente via PIX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {commissionRates.map((rate, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{rate.plan}</h4>
                      <p className="text-sm text-muted-foreground">Comissão: {rate.commission}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{rate.value}</p>
                      <p className="text-sm text-muted-foreground">por venda</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requirements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Quem pode se tornar Afiliado?</h2>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Handshake className="w-6 h-6" />
                Requisitos para Afiliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Dica:</strong> Se você conhece algum influencer que se encaixa no perfil, 
                  pode indicá-lo no formulário de inscrição!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Pronto para Decolar?</CardTitle>
              <CardDescription className="text-purple-100">
                Comece sua jornada como afiliado do Estagionauta hoje mesmo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 space-x-2">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => {
                    toast.info('Devido a alta demanda, o formulário de inscrição está temporariamente indisponível.')    
                    // setShowForm(true)
                }}
                  className="w-full md:w-auto"
                >
                  Quero me Inscrever
                </Button>
                <Button 
                onClick={() => toast.info('Esta funcionalidade está em desenvolvimento!')}
                  size="lg" 
                  variant="outline"
                  className="w-full md:w-auto bg-transparent border-white text-white hover:bg-white hover:text-purple-600"
                >
                  Já sou Afiliado - Acessar Painel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Modal/Message */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Formulário em Desenvolvimento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  O formulário de inscrição está sendo finalizado. Em breve você poderá se inscrever!
                </p>
                <Button 
                  onClick={() => setShowForm(false)}
                  className="w-full"
                >
                  Entendi
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}