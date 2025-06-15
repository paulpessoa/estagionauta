import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Palette, Zap, Layout, Sparkles } from 'lucide-react'

export default function GeradorCurriculos() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Em Breve
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Gerador de Currículos com IA
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Crie currículos profissionais automaticamente adaptados para cada vaga com modelos exclusivos
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Adaptação Automática</CardTitle>
              <CardDescription>
                Curriculos adaptados automaticamente para cada vaga
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-green-500 mr-2" />
                  Otimização por IA para cada vaga
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 text-green-500 mr-2" />
                  Palavras-chave relevantes
                </li>
                <li className="flex items-center">
                  <Layout className="h-4 w-4 text-green-500 mr-2" />
                  Estrutura otimizada por área
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Palette className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Modelos Exclusivos</CardTitle>
              <CardDescription>
                Templates desenvolvidos por especialistas em RH
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <Palette className="h-4 w-4 text-green-500 mr-2" />
                  Designs modernos e profissionais
                </li>
                <li className="flex items-center">
                  <Download className="h-4 w-4 text-green-500 mr-2" />
                  Exportação em múltiplos formatos
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 text-green-500 mr-2" />
                  Templates por área de atuação
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="text-center py-8">
            <FileText className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-6">
              Estamos criando modelos incríveis para gerar o currículo perfeito para você. Aguarde!
            </p>
            <Button disabled variant="outline">
              Disponível em Breve
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}