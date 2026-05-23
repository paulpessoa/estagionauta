import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Helmet } from "react-helmet-async"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Users,
  Brain,
  MapPin,
  Calculator,
  Star,
  Shield,
  Zap,
  BotMessageSquare,
  BotIcon,
  FileScan,
  FileText,
  Youtube,
  AlertCircle,
  ScanText,
  ChevronRight
} from "lucide-react"
import { AuthRequiredModal } from "@/components/AuthRequiredModal"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"

export default function HomePage() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleAuthGatedClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      setShowAuthModal(true)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Estagionauta | Conquiste Seu Estágio Ideal com IA</title>
        <meta name="description" content="Analise seu currículo com inteligência artificial, explore o mapa de agências de estágio e utilize ferramentas avançadas para impulsionar sua carreira profissional." />
        <link rel="canonical" href="https://www.estagionauta.com.br/" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto text-center space-y-14">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Sua <span className="text-yellow-300">missão</span> rumo ao
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              estágio ideal
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Analise seu currículo com IA, explore oportunidades de estágio e
            aprimore suas habilidades para conquistar o mercado de trabalho.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              asChild
            >
              <Link
                to="/analise-curriculo"
                onClick={handleAuthGatedClick}
              >
                <FileScan className="mr-2 h-5 w-5" />
                Analisar Currículo com IA
              </Link>
            </Button>
            <Button
              size="lg"
              className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold transition-colors opacity-70"
              asChild
            >
              <Link to="/resultado-curriculo-exemplo">
                <ScanText className="mr-2 h-5 w-5" />
                Exemplo Currículo Revisado IA
              </Link>
            </Button>
          </div>

          <div className="flex justify-center items-center space-x-8 pt-8 text-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold">+ 472</div>
              <div className="text-sm">Estudantes Conectados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">+ 43</div>
              <div className="text-sm">Agências Cadastradas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">+ 675</div>
              <div className="text-sm">Currículos Analisados</div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-20 h-20 bg-white/10 rounded-full"></div>
        </div>
        <div
          className="absolute bottom-20 right-10 animate-float"
          style={{ animationDelay: "2s" }}
        >
          <div className="w-16 h-16 bg-yellow-300/20 rounded-full"></div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Serviços essenciais para sua carreira
            </h2>
            <p className="text-xl text-slate-800 dark:text-slate-200 max-w-2xl mx-auto">
              Ferramentas criadas especialmente para universitários que querem
              se destacar no mercado de trabalho
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Análise de Currículo */}
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-shadow border-2 border-pink-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-purple-400/10 group-hover:from-pink-400/20 group-hover:to-purple-400/20 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-pink-500" />
                </div>
                <CardTitle className="text-xl text-pink-600 dark:text-pink-400">
                  Análise de Currículo com IA
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-200">
                  Receba uma avaliação completa do seu currículo
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200 mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Análise em 7 critérios diferentes
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Sugestões personalizadas de melhoria
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Comparação com padrões do mercado
                  </li>
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold shadow-lg hover:from-pink-600 hover:to-blue-600"
                  asChild
                >
                  <Link
                    to="/analise-curriculo"
                    onClick={handleAuthGatedClick}
                  >
                    Analisar Currículo com IA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Mapa de Agências */}
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-shadow border-2 border-blue-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 group-hover:from-blue-400/20 group-hover:to-purple-400/20 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-700 dark:text-blue-400">
                  Mapa de Agências
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-200">
                  Descubra agências de estágio na sua região
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200 mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Avaliações de outros estudantes
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Informações detalhadas das agências
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Filtros por área e localização
                  </li>
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg hover:from-blue-600 hover:to-pink-600"
                  asChild
                >
                  <Link to="/agencias">
                    Explorar Mapa
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Calculadora de Recesso */}
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-shadow border-2 border-purple-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 group-hover:from-purple-400/20 group-hover:to-pink-400/20 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl text-purple-700 dark:text-purple-400">
                  Calculadora de Recesso de Estágio
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-200">
                  Calcule seus dias de recesso e o valor a receber
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200 mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Cálculo automático e preciso
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Baseado na legislação atual
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Exportar resultado em PDF
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-purple-400 text-purple-700 dark:text-purple-400 font-bold"
                  asChild
                >
                  <Link to="/calculadora-recesso">
                    Calcular Recesso
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Simulador de Entrevistas */}
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-shadow border-2 border-yellow-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/10 to-pink-400/10 group-hover:from-yellow-200/20 group-hover:to-pink-400/20 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <BotMessageSquare className="h-6 w-6 text-yellow-500" />
                </div>
                <CardTitle className="text-xl text-yellow-600 dark:text-yellow-400">
                  Simulador de Entrevistas
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-200">
                  Pratique entrevistas com IA e receba feedback personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200 mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Diversas áreas de atuação
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Gravação e análise da entrevista
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Relatório detalhado de pontos fortes e fracos
                  </li>
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold shadow-lg"
                  asChild
                >
                  <Link
                    to="/simulador-entrevistas"
                    onClick={handleAuthGatedClick}
                  >
                    Simular Entrevista
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Rastreador de Candidaturas */}
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-shadow border-2 border-indigo-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 group-hover:from-indigo-400/20 group-hover:to-blue-400/20 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <BotMessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl text-indigo-700 dark:text-indigo-400">
                  Kanban de Candidaturas
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-200">
                  Organize suas candidaturas com um Kanban inteligente
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200 mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Visualização Kanban e Lista
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Lembretes automáticos para entrevistas
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Gestão de status e contatos
                  </li>
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold shadow-lg"
                  asChild
                >
                  <Link
                    to="/candidaturas"
                    onClick={handleAuthGatedClick}
                  >
                    Organizar Vagas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Gerador de Currículos */}
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-shadow border-2 border-rose-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 to-pink-400/10 group-hover:from-rose-400/20 group-hover:to-pink-400/20 transition-colors"></div>
              <CardHeader className="relative">
                <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center mb-4">
                  <FileScan className="h-6 w-6 text-rose-600" />
                </div>
                <CardTitle className="text-xl text-rose-700 dark:text-rose-400">
                  Gerador de Currículos
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-200">
                  Adapte seu currículo automaticamente para cada vaga com
                  modelos exclusivos
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200 mb-6">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Adaptação automática para cada vaga
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Modelos desenvolvidos por especialistas
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    Exportação em múltiplos formatos
                  </li>
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold shadow-lg"
                  asChild
                >
                  <Link
                    to="/gerador-curriculos"
                    onClick={handleAuthGatedClick}
                  >
                    Gerar Currículo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Por que escolher o Estagionauta?
            </h2>
            <p className="text-xl text-blue-100 dark:text-blue-200 max-w-2xl mx-auto">
              Uma plataforma pensada por universitários, para universitários
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <BotIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                IA Especializada
              </h3>
              <p className="text-slate-200 dark:text-slate-100">
                Tecnologia avançada treinada especificamente para análise de
                currículos e orientação de carreira estudantil.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Tecnologia Avançada
              </h3>
              <p className="text-slate-200 dark:text-slate-100">
                Ferramentas inovadoras que combinam IA, análise de dados e
                experiência do usuário para resultados precisos.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Comunidade Ativa
              </h3>
              <p className="text-slate-200 dark:text-slate-100">
                Conecte-se com outros universitários, compartilhe experiências e
                descubra oportunidades através da nossa rede.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy-900 dark:text-white mb-4">
              O que nossos estagiários dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-l-4 border-l-pink-600 dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-200 mb-4">
                  "O Estagionauta transformou minha busca por estágio. A revisão
                  de currículo com IA me ajudou muito!"
                </p>
                <div className="font-semibold text-navy-900 dark:text-white">
                  Maria Silva
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Estagiária de Marketing
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600 dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-200 mb-4">
                  "O simulador de entrevistas me deu muita confiança. Consegui
                  minha vaga na primeira tentativa!"
                </p>
                <div className="font-semibold text-navy-900 dark:text-white">
                  João Santos
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Estagiário de TI
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600 dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-200 mb-4">
                  "A calculadora de recesso me ajudou a entender meus direitos.
                  Plataforma incrível!"
                </p>
                <div className="font-semibold text-navy-900 dark:text-white">
                  Ana Costa
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Estagiária de RH
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Pronto para decolar na sua carreira?
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 max-w-2xl mx-auto">
            Junte-se a centenas de universitários que já estão usando o
            Estagionauta para conquistar melhores oportunidades
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              asChild
            >
              <Link
                to="/analise-curriculo"
                onClick={handleAuthGatedClick}
              >
                <FileScan className="mr-2 h-5 w-5" />
                Analisar Currículo com IA
              </Link>
            </Button>
            <Button
              size="lg"
              className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold transition-colors opacity-70"
              asChild
            >
              <Link to="/resultado-curriculo-exemplo">
                <ScanText className="mr-2 h-5 w-5" />
                Exemplo Currículo Revisado IA
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}
