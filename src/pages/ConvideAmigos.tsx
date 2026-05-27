import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { 
  Users, 
  Copy, 
  Check, 
  Gift, 
  Coins,
  Share2,
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

export default function ConvideAmigos() {
  const { profile } = useAuth()
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const referralCode = profile?.referral_code || '------'
  const referralLink = `${window.location.origin}/cadastro?ref=${referralCode}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopiedCode(true)
    toast.success('Código de indicação copiado!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    toast.success('Link de indicação copiado!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const steps = [
    {
      icon: Share2,
      title: "1. Envie o Link",
      description: "Copie seu link de indicação exclusivo e envie para seus amigos de faculdade ou grupos.",
      color: "bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    },
    {
      icon: Users,
      title: "2. Cadastro do Amigo",
      description: "Seu amigo se cadastra na plataforma. Ele ganha 5 créditos de boas-vindas na hora para testar.",
      color: "bg-purple-500/10 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    },
    {
      icon: Coins,
      title: "3. Ganhe Créditos",
      description: "Você ganha 3 créditos automaticamente no cadastro do seu amigo, e mais 5 créditos quando ele realizar a primeira compra.",
      color: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-100 dark:border-purple-900/30 mb-4">
            <Gift className="h-3.5 w-3.5" /> Indique e Ganhe
          </div>
          <h1 className="text-4xl font-extrabold text-gray-950 dark:text-white sm:text-5xl leading-tight">
            Convide seus amigos e ganhe créditos!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-3 max-w-2xl mx-auto">
            Compartilhe o Estagionauta com seus colegas. Eles ganham créditos de boas-vindas e você turbina suas análises sem gastar nada.
          </p>
        </div>

        {/* Share Section */}
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Action Box */}
          <Card className="md:col-span-3 border-2 border-primary/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Gift className="h-40 w-40 text-primary" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" /> Seu Link de Indicação
              </CardTitle>
              <CardDescription>
                Use o link ou código abaixo para convidar outras pessoas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Link block */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block text-gray-700 dark:text-gray-300">Link Personalizado</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm font-mono truncate select-all flex items-center text-gray-600 dark:text-gray-300">
                    {referralLink}
                  </div>
                  <Button onClick={handleCopyLink} className="shrink-0">
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="hidden sm:inline ml-2">{copiedLink ? 'Copiado' : 'Copiar'}</span>
                  </Button>
                </div>
              </div>

              {/* Code block */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block text-gray-700 dark:text-gray-300">Código de Indicação</label>
                <div className="flex gap-2 items-center">
                  <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-lg px-4 py-2.5 text-2xl font-extrabold font-mono tracking-wider text-primary text-center min-w-[150px]">
                    {referralCode}
                  </div>
                  <Button variant="outline" onClick={handleCopyCode}>
                    {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2">{copiedCode ? 'Copiado' : 'Copiar Código'}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Box */}
          <Card className="md:col-span-2 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Como funciona o ganho?
              </CardTitle>
              <CardDescription>
                Veja as recompensas em detalhes:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg font-bold shrink-0 text-sm">
                  +3
                </div>
                <div>
                  <span className="font-bold text-sm block">Cadastro do Indicado</span>
                  <span className="text-xs text-muted-foreground">Você ganha 3 créditos quando seu amigo criar a conta na plataforma.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg font-bold shrink-0 text-sm">
                  +5
                </div>
                <div>
                  <span className="font-bold text-sm block">Primeira Compra</span>
                  <span className="text-xs text-muted-foreground">Você ganha 5 créditos bônus adicionais quando seu indicado fizer qualquer compra de créditos.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Steps / Rules */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Passo a Passo</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, idx) => {
              const IconComponent = step.icon
              return (
                <Card key={idx} className="relative hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${step.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Important Info */}
        <Card className="bg-primary/5 border border-primary/10">
          <CardContent className="p-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="font-bold text-primary block mb-2">Observações Importantes:</span>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
              <li>Os créditos recebidos via indicação são classificados como créditos bônus e possuem **validade de 6 meses** a partir da data de ganho.</li>
              <li>Tentativas de fraudar o sistema de indicações criando contas duplicadas resultarão no banimento permanente das contas e perda de todos os créditos associados.</li>
              <li>O Estagionauta se reserva o direito de alterar os valores de premiação em créditos a qualquer momento.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}