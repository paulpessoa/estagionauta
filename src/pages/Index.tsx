
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Users, Brain, MapPin, Calculator, FileText, Star, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto text-center space-y-8">
          <Badge variant="secondary" className="mx-auto bg-white/20 text-white border-white/30">
            🚀 Plataforma em Beta - Participe do desenvolvimento!
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Sua <span className="text-yellow-300">missão</span> rumo ao<br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              estágio ideal
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Conecte-se com mentores voluntários, analise seu currículo com IA e descubra as melhores oportunidades de estágio
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold" asChild>
              <Link to="/analise-curriculo">
                <FileText className="mr-2 h-5 w-5" />
                Analisar Currículo Grátis
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/mentores">
                <Users className="mr-2 h-5 w-5" />
                Encontrar Mentores
              </Link>
            </Button>
          </div>

          <div className="flex justify-center items-center space-x-8 pt-8 text-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm">Universitários</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">50+</div>
              <div className="text-sm">Mentores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">1000+</div>
              <div className="text-sm">Currículos Analisados</div>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-20 h-20 bg-white/10 rounded-full"></div>
        </div>
        <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: '2s' }}>
          <div className="w-16 h-16 bg-yellow-300/20 rounded-full"></div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Três serviços essenciais para sua carreira
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas criadas especialmente para universitários que querem se destacar no mercado de trabalho
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Análise de Currículo */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Análise de Currículo com IA</CardTitle>
                <CardDescription>
                  Receba uma avaliação completa do seu currículo com notas e dicas personalizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Análise em 7 critérios diferentes
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Sugestões personalizadas de melhoria
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Comparação com padrões do mercado
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/analise-curriculo">
                    Analisar Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Mapa de Agências */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 group-hover:from-green-500/10 group-hover:to-blue-500/10 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Mapa de Agências</CardTitle>
                <CardDescription>
                  Descubra e avalie agências de estágio na sua região
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Avaliações de outros estudantes
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Informações detalhadas das agências
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Filtros por área e localização
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/mapa-agencias">
                    Explorar Mapa
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Calculadora de Recesso */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Calculadora de Recesso</CardTitle>
                <CardDescription>
                  Calcule seus dias de recesso e o valor a receber
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Cálculo automático e preciso
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Baseado na legislação atual
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                    Exportar resultado em PDF
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/calculadora-recesso">
                    Calcular Recesso
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher o Estagionauta?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma pensada por universitários, para universitários
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">100% Gratuito</h3>
              <p className="text-muted-foreground">
                Todos os nossos serviços são gratuitos. Nossa missão é democratizar o acesso à orientação de carreira.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Mentores Reais</h3>
              <p className="text-muted-foreground">
                Profissionais voluntários verificados que realmente querem ajudar você a crescer.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Tecnologia Avançada</h3>
              <p className="text-muted-foreground">
                IA treinada especificamente para análise de currículos e orientação de carreira estudantil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para decolar na sua carreira?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Junte-se a centenas de universitários que já estão usando o Estagionauta para conquistar melhores oportunidades
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link to="/analise-curriculo">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/sobre">
                Saber Mais
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Beta Notice */}
      <section className="py-8 px-4 bg-yellow-50 dark:bg-yellow-950/20 border-t border-yellow-200 dark:border-yellow-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>Plataforma em desenvolvimento.</strong> Ainda estamos na fase beta! 
            Alguns perfis e mentorias são apenas demonstrações para teste. 
            Mas os mentores reais estão identificados com um selo. 
            Pode interagir, explorar e nos dar sugestões — sua participação já é uma mentoria pra gente. 💙
          </p>
        </div>
      </section>
    </div>
  )
}
