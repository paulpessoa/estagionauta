import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { FileText, Shield, Gavel, Cpu, DollarSign, HelpCircle } from 'lucide-react'

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Termos de Uso
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Estagionauta - Regras e Condições de Uso da Plataforma
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* 1. Aceitação dos Termos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                1. Aceitação dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Ao acessar e utilizar a plataforma Estagionauta ("Plataforma"), você concorda em cumprir e ser regido por estes Termos de Uso. Caso não concorde com qualquer uma das condições estabelecidas, você não deve acessar ou utilizar os nossos serviços.
              </p>
              <p>
                Estes Termos de Uso aplicam-se a todos os usuários da plataforma, incluindo estudantes, agências, moderadores e administradores.
              </p>
            </CardContent>
          </Card>

          {/* 2. Descrição dos Serviços e Uso de Inteligência Artificial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                2. Descrição dos Serviços e Uso de IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                O Estagionauta oferece ferramentas de auxílio para busca de estágio e melhoria de currículo, incluindo análise inteligente por inteligência artificial, simulações de entrevistas e painéis Kanban.
              </p>
              <p>
                <strong>Importante sobre a Inteligência Artificial:</strong> Nossas análises, avaliações de simulações e dicas de escrita de currículo são geradas automaticamente por algoritmos de inteligência artificial. Embora trabalhemos constantemente para melhorar a precisão dos retornos, os feedbacks da IA são sugestões educativas e não garantem aprovações em processos seletivos ou contratações. A responsabilidade pelas decisões tomadas com base nas análises é exclusiva do usuário.
              </p>
            </CardContent>
          </Card>

          {/* 3. Limites, Créditos e Sistema de Cobrança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                3. Créditos e Política de Reembolso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Algumas operações dentro da plataforma (como revisões de currículo e simulações de entrevistas) exigem o consumo de <strong>créditos</strong>.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Os créditos adquiridos por meio de recargas avulsas não expiram e permanecem na conta até serem utilizados.</li>
                <li>As assinaturas mensais recorrentes (quando disponíveis) creditam um montante fixo de créditos a cada ciclo de faturamento.</li>
                <li>Os pagamentos são processados de forma segura por meio do Stripe.</li>
                <li><strong>Reembolso:</strong> Por se tratar de um serviço digital de consumo imediato (uma vez gerada a análise com IA), não realizamos reembolsos de créditos já consumidos. Reembolsos de pacotes de créditos não utilizados podem ser solicitados em até 7 (sete) dias após a compra, conforme o Código de Defesa do Consumidor brasileiro.</li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Propriedade Intelectual e Proteção a PII */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                4. Privacidade e Proteção de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Nós nos esforçamos para proteger suas informações de identificação pessoal (PII) e garantir a conformidade com a LGPD (Lei Geral de Proteção de Dados).
              </p>
              <p>
                Os currículos enviados em formato PDF para análise são lidos pela inteligência artificial para produzir os retornos estruturados. Não utilizamos seus arquivos ou dados para treinar modelos públicos de inteligência artificial de forma a expor sua identidade pessoal.
              </p>
              <p>
                O usuário tem a total liberdade de atualizar, modificar ou excluir definitivamente seus dados de perfil e histórico através da tela de Configurações a qualquer momento.
              </p>
            </CardContent>
          </Card>

          {/* 5. Uso Aceitável e Regras de Conduta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-blue-600" />
                5. Uso Aceitável e Conduta do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Ao utilizar o Estagionauta, você concorda em não:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Tentar fraudar, invadir ou explorar falhas de segurança da plataforma.</li>
                <li>Usar robôs, scrapers ou outros métodos automatizados não autorizados para interagir com o site.</li>
                <li>Compartilhar credenciais de acesso ou burlar regras de privilégios de cargo (IDOR).</li>
                <li>Utilizar a plataforma para hospedar ou transmitir vírus, malwares ou conteúdos inapropriados.</li>
              </ul>
              <p>
                Qualquer abuso das regras de negócio ou de segurança resultará no cancelamento imediato da conta sem aviso prévio.
              </p>
            </CardContent>
          </Card>

          {/* 6. Limitação de Responsabilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                6. Limitação de Responsabilidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                A plataforma Estagionauta é fornecida "como está" e "conforme disponível". Não garantimos que a plataforma estará livre de erros ou interrupções temporárias.
              </p>
              <p>
                Em nenhum caso seremos responsáveis por danos indiretos, incidentais ou consequentes resultantes do uso ou da impossibilidade de uso da Plataforma, de falhas em processos seletivos ou de perda de vagas de emprego.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            © {new Date().getFullYear()} Estagionauta. Todos os direitos reservados.
          </p>
          <p className="mt-2 text-xs">
            Dúvidas jurídicas ou solicitações sobre estes termos podem ser encaminhadas para suporte@estagionauta.com.
          </p>
        </div>
      </div>
    </div>
  )
}
