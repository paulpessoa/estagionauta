import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, X, Star, Rocket, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { redirectToStripe, stripeConfig } from '@/lib/stripe'
import { AuthRequiredModal } from '@/components/AuthRequiredModal'

const subscriptionPlans = [
  {
    id: 'lunar',
    name: 'Lunar Explorer',
    subtitle: 'Para iniciantes no espaço',
    price: 9.99,
    period: 'mensal',
    color: 'bg-gradient-to-br from-slate-400 to-slate-600',
    features: {
      analyses: 5,
      interview: 0,
      kanban: false,
      templates: 0
    },
    stripeKey: 'lunarPlan' as keyof typeof stripeConfig
  },
  {
    id: 'stellar',
    name: 'Stellar Navigator',
    subtitle: 'Para exploradores experientes',
    price: 19.99,
    period: '6x de',
    totalPrice: 120.00,
    color: 'bg-gradient-to-br from-blue-500 to-purple-600',
    popular: true,
    features: {
      analyses: 10,
      interview: 20,
      kanban: false,
      templates: 2
    },
    stripeKey: 'stellarPlan' as keyof typeof stripeConfig
  },
  {
    id: 'galactic',
    name: 'Galactic Commander',
    subtitle: 'Para conquistadores do universo',
    price: 29.99,
    period: '12x de',
    totalPrice: 360.00,
    color: 'bg-gradient-to-br from-yellow-400 to-orange-600',
    features: {
      analyses: 20,
      interview: 60,
      kanban: true,
      templates: 10
    },
    stripeKey: 'galacticPlan' as keyof typeof stripeConfig
  }
]

const individualPackages = [
  {
    id: 'stardust',
    name: 'Pacote Stardust',
    subtitle: '10 análises de currículo',
    price: 29.99,
    icon: <Sparkles className="h-8 w-8" />,
    color: 'bg-gradient-to-br from-pink-400 to-purple-500',
    features: ['10 Análises de currículo com IA', 'Relatórios detalhados', 'Suporte por email'],
    stripeKey: 'stardustPackage' as keyof typeof stripeConfig
  },
  {
    id: 'nebula',
    name: 'Pacote Nebula',
    subtitle: '20 minutos de simulação',
    price: 19.99,
    icon: <Star className="h-8 w-8" />,
    color: 'bg-gradient-to-br from-cyan-400 to-blue-500',
    features: ['20 minutos de simulação de entrevista', 'Feedback em tempo real', 'Gravação das sessões'],
    stripeKey: 'nebulaPackage' as keyof typeof stripeConfig
  },
  {
    id: 'cosmic',
    name: 'Pacote Cosmic',
    subtitle: '5 templates de currículo',
    price: 24.99,
    icon: <Rocket className="h-8 w-8" />,
    color: 'bg-gradient-to-br from-green-400 to-emerald-600',
    features: ['5 Gerações de currículo com IA', 'Templates exclusivos Estagionauta', 'Personalização avançada'],
    stripeKey: 'cosmicPackage' as keyof typeof stripeConfig
  }
]

export default function PrecosPlanos() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handlePurchase = (stripeKey: keyof typeof stripeConfig) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    
    redirectToStripe(stripeKey)
  }

  const FeatureItem = ({ feature, included }: { feature: string; included: boolean }) => (
    <div className="flex items-center space-x-2">
      {included ? (
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 text-red-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
        {feature}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Preços Estagionauta 🚀
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano perfeito para sua jornada profissional no universo dos estágios
          </p>
        </div>

        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="packages">Pacotes Avulsos</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className={`relative overflow-hidden ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute top-4 right-4 bg-blue-500">
                      Mais Popular
                    </Badge>
                  )}
                  
                  <CardHeader className={`${plan.color} text-white`}>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-white/80">{plan.subtitle}</CardDescription>
                    <div className="text-center pt-4">
                      <div className="text-3xl font-bold">
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-sm opacity-80">{plan.period}</div>
                      {plan.totalPrice && (
                        <div className="text-xs opacity-70 mt-1">
                          Total: R$ {plan.totalPrice.toFixed(2).replace('.', ',')}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    <FeatureItem 
                      feature={`${plan.features.analyses} Análises de currículo com IA`}
                      included={plan.features.analyses > 0}
                    />
                    <FeatureItem 
                      feature={`${plan.features.interview}min Simulação de entrevista`}
                      included={plan.features.interview > 0}
                    />
                    <FeatureItem 
                      feature="Kanban de candidaturas inteligente"
                      included={plan.features.kanban}
                    />
                    <FeatureItem 
                      feature={`${plan.features.templates} Gerador de currículos com IA`}
                      included={plan.features.templates > 0}
                    />
                    
                    <Button 
                      className="w-full mt-6" 
                      size="lg"
                      onClick={() => handlePurchase(plan.stripeKey)}
                    >
                      Escolher {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="packages">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {individualPackages.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className={`${pkg.color} text-white text-center`}>
                    <div className="mx-auto mb-2 text-white">
                      {pkg.icon}
                    </div>
                    <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
                    <CardDescription className="text-white/80">{pkg.subtitle}</CardDescription>
                    <div className="text-2xl font-bold mt-2">
                      R$ {pkg.price.toFixed(2).replace('.', ',')}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="space-y-3 mb-6">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handlePurchase(pkg.stripeKey)}
                    >
                      Comprar Agora
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 text-center">
          <div className="bg-card rounded-lg p-8 max-w-2xl mx-auto border">
            <h3 className="text-2xl font-bold mb-4">Não tem certeza qual escolher?</h3>
            <p className="text-muted-foreground mb-6">
              Entre em contato conosco e nossa equipe te ajudará a encontrar o plano ideal para sua jornada profissional.
            </p>
            <Button variant="outline" size="lg">
                <a href="https://wa.me/5581995097377?text=Estou%20na%20p%C3%A1gina%20de%20pre%C3%A7os%20e%20preciso%20de%20ajuda%20com..."target="_blank" rel="noopener noreferrer">
                    Falar com o Estagionauta
                </a>
            </Button>
          </div>
        </div>
      </div>

      <AuthRequiredModal        
        isOpen={showAuthModal}        
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}