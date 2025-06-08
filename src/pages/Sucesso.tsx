
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Mail, Clock, Gift, ArrowLeft } from 'lucide-react'

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Formulário enviado com sucesso! 🎉
            </h1>
            <p className="text-xl text-muted-foreground">
              Obrigado por participar da nossa pesquisa e compartilhar seu currículo conosco.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2 text-purple-600" />
                Seu presente está sendo preparado
              </CardTitle>
              <CardDescription>
                Nossa IA está analisando seu currículo e preparando um relatório personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Prazo de entrega</p>
                  <p className="text-muted-foreground text-sm">
                    Você receberá a análise completa por email em até 48 horas
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">O que você vai receber</p>
                  <ul className="text-muted-foreground text-sm space-y-1 mt-1">
                    <li>• Nota geral do seu currículo (0-10)</li>
                    <li>• Análise detalhada em 7 critérios diferentes</li>
                    <li>• Sugestões personalizadas de melhoria</li>
                    <li>• Dicas de otimização para cada seção</li>
                    <li>• Comparação com padrões do mercado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Enquanto isso, que tal explorar outras funcionalidades?
            </h3>
            <p className="text-blue-700 dark:text-blue-200 text-sm mb-4">
              O Estagionauta tem muito mais para oferecer. Conheça nossos outros serviços!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/mapa-agencias">
                  Explorar Agências de Estágio
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/calculadora-recesso">
                  Calcular Recesso
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/mentores">
                  Encontrar Mentores
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Tem alguma dúvida ou sugestão? Entre em contato conosco!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <a href="mailto:contato@estagionauta.com.br">
                  Enviar Email
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://instagram.com/estagionauta" target="_blank" rel="noopener noreferrer">
                  Seguir no Instagram
                </a>
              </Button>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
