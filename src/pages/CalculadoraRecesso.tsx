
import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Calculator, DollarSign, Download, Info } from 'lucide-react'

export default function CalculadoraRecessoPage() {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    salario: '',
    horasDiarias: '6',
    diasSemana: '5'
  })
  
  const [result, setResult] = useState<{
    diasRecesso: number
    valorRecesso: number
    periodoRecesso: string
  } | null>(null)

  const calculateRecesso = () => {
    if (!formData.startDate || !formData.salario) return

    const start = new Date(formData.startDate)
    const end = formData.endDate ? new Date(formData.endDate) : new Date()
    
    // Calculate months worked
    const monthsWorked = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    
    // For every 12 months, student gets 30 days of recess
    const diasRecesso = Math.floor((monthsWorked / 12) * 30)
    
    // Calculate daily salary
    const salarioMensal = parseFloat(formData.salario)
    const salarioDiario = salarioMensal / 30
    
    // Calculate recess payment (same as salary)
    const valorRecesso = diasRecesso * salarioDiario

    setResult({
      diasRecesso,
      valorRecesso,
      periodoRecesso: `${diasRecesso} dias corridos`
    })
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>Calculadora de Recesso de Estágio | Estagionauta</title>
        <meta name="description" content="Calcule gratuitamente quantos dias de recesso (férias) você tem direito a tirar no seu estágio e o valor total que deve receber da empresa." />
        <link rel="canonical" href="https://www.estagionauta.com.br/calculadora-recesso" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Calculadora de Recesso
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Calcule seus dias de recesso e o valor que você tem direito a receber
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-purple-600" />
                  <span>Dados do Estágio</span>
                </CardTitle>
                <CardDescription>
                  Preencha as informações para calcular seu recesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="startDate">Data de início do estágio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateFormData('startDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Data final (opcional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateFormData('endDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="salario">Bolsa-auxílio mensal (R$)</Label>
                  <Input
                    id="salario"
                    type="number"
                    placeholder="1200.00"
                    value={formData.salario}
                    onChange={(e) => updateFormData('salario', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Horas diárias</Label>
                  <Select value={formData.horasDiarias} onValueChange={(value) => updateFormData('horasDiarias', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 horas</SelectItem>
                      <SelectItem value="6">6 horas</SelectItem>
                      <SelectItem value="8">8 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Dias por semana</Label>
                  <Select value={formData.diasSemana} onValueChange={(value) => updateFormData('diasSemana', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 dias</SelectItem>
                      <SelectItem value="4">4 dias</SelectItem>
                      <SelectItem value="5">5 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={calculateRecesso}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!formData.startDate || !formData.salario}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Calcular Recesso
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {result ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Resultado do Cálculo</span>
                  </CardTitle>
                  <CardDescription>
                    Baseado na legislação brasileira de estágio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Dias de Recesso</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{result.diasRecesso}</p>
                      <p className="text-sm text-muted-foreground">dias corridos</p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Valor do Recesso</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {result.valorRecesso.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">valor total</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Detalhes do Cálculo</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• A cada 12 meses: 30 dias de recesso</li>
                      <li>• Valor diário: R$ {(parseFloat(formData.salario) / 30).toFixed(2)}</li>
                      <li>• Recesso remunerado conforme a bolsa-auxílio</li>
                    </ul>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1" onClick={() => handleDownloadPDF()}>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar PDF
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleShare()}>
                      Compartilhar
                    </Button>
                  </div>
                              {/* Disclaimer below buttons */}
            {result && (
              <p className="mt-4 text-center text-sm text-muted-foreground italic">
                O resultado deste cálculo é apenas uma sugestão para apoiar sua negociação de folgas e férias. Aproveite!
              </p>
            )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-full py-12">
                  <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Preencha os dados para calcular
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Insira a data de início do estágio e o valor da bolsa-auxílio para ver o resultado
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Information Card */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Informações Importantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Direitos do Estagiário</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Recesso de 30 dias a cada 12 meses</li>
                    <li>• Recesso proporcional para períodos menores</li>
                    <li>• Direito ao auxílio-transporte</li>
                    <li>• Seguro contra acidentes pessoais</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Base Legal</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Lei nº 11.788/2008 (Lei do Estágio)</li>
                    <li>• Artigo 13 - Direito ao recesso</li>
                    <li>• Cálculo proporcional permitido</li>
                    <li>• Recesso pode ser dividido em períodos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  // Share handler for WhatsApp or email
  function handleShare() {
    if (!result) return
    const start = formData.startDate
    const end = formData.endDate ? formData.endDate : new Date().toISOString().split('T')[0]
    const message = `Meu cálculo de recesso:\nInício: ${start}\nFim: ${end}\nDias de recesso: ${result.diasRecesso}\nValor: R$ ${result.valorRecesso.toFixed(2)}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // PDF download handler using print-like HTML snippet
  function handleDownloadPDF() {
    if (!result) return
    const printContent = document.querySelector('.space-y-6') // The card content container for results
    if (!printContent) return
    const newWindow = window.open('', '', 'width=800,height=600')
    if (!newWindow) return
    newWindow.document.write(`
      <html>
        <head>
          <title>Recesso PDF</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .result-container { background: #f9fafb; padding: 20px; border-radius: 8px; }
            h4 { color: #6b21a8; }
          </style>
        </head>
        <body>
          <div class="result-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print()
              window.onafterprint = function() { window.close() }
            }
          </script>
        </body>
      </html>
    `)
    newWindow.document.close()
  }
}
