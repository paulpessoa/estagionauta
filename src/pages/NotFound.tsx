
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-white">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Página não encontrada
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Oops! A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>O que você pode fazer?</CardTitle>
              <CardDescription>
                Explore as principais funcionalidades do Estagionauta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" asChild className="h-auto p-4">
                  <Link 
                  to="#"
                  // to="/analise-curriculo" 
                    onClick={() => {
                      toast.info("Devido a alta demanda, a análise de currículos está temporariamente indisponível. Estamos trabalhando para melhorar a experiência. Agradecemos pela compreensão!");
                    }}
                  className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-sm">📄</span>
                    </div>
                    <span className="font-medium">Analisar Currículo</span>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link to="/mapa-agencias" className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 text-sm">🗺️</span>
                    </div>
                    <span className="font-medium">Mapa de Agências</span>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link to="/calculadora-recesso" className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 text-sm">🧮</span>
                    </div>
                    <span className="font-medium">Calculadora de Recesso</span>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="h-auto p-4">
                  <Link to="/mentores" className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 dark:text-orange-400 text-sm">👥</span>
                    </div>
                    <span className="font-medium">Encontrar Mentores</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Página Anterior
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
