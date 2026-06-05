import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Shield, Lock, Eye, Database, Mail, Phone, MapPin } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Estagionauta - Proteção de Dados e Privacidade
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introdução */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Introdução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                A Estagionauta ("nós", "nosso", "a empresa") está comprometida em proteger sua privacidade.
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas
                informações pessoais quando você utiliza nossos serviços.
              </p>
              <p>
                Ao usar nossos serviços, você concorda com a coleta e uso de informações de acordo com
                esta política. Seus dados pessoais são utilizados apenas para fornecer e melhorar nossos
                serviços e não serão vendidos, alugados ou compartilhados com terceiros, exceto conforme
                descrito nesta política.
              </p>
            </CardContent>
          </Card>

          {/* Informações Coletadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Informações que Coletamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Informações Pessoais</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Nome completo</li>
                    <li>• Endereço de e-mail</li>
                    <li>• Número de telefone</li>
                    <li>• Data de nascimento</li>
                    <li>• Informações de perfil profissional</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Dados de Uso</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Histórico de análises de currículo</li>
                    <li>• Interações com a plataforma</li>
                    <li>• Preferências de uso</li>
                    <li>• Dados de localização (quando relevante)</li>
                    <li>• Informações de pagamento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Como Usamos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Como Usamos Suas Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div className="grid gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Fornecimento de Serviços</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Para processar análises de currículo, gerenciar sua conta e fornecer suporte ao cliente.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">Melhoria de Serviços</h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Para analisar tendências de uso e melhorar a qualidade de nossos serviços.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">Comunicação</h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Para enviar atualizações importantes, notificações e informações sobre nossos serviços.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compartilhamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Compartilhamento de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Não vendemos, alugamos ou compartilhamos suas informações pessoais</strong> com
                terceiros, exceto nas seguintes situações:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Com provedores de serviços que nos ajudam a operar nossa plataforma (processamento de pagamentos, hospedagem)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Quando exigido por lei ou para proteger nossos direitos legais</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Com seu consentimento explícito</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Segurança dos Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger
                suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h5 className="font-semibold mb-1">Criptografia</h5>
                  <p>Dados transmitidos e armazenados com criptografia SSL/TLS</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h5 className="font-semibold mb-1">Acesso Controlado</h5>
                  <p>Acesso restrito apenas a funcionários autorizados</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h5 className="font-semibold mb-1">Monitoramento</h5>
                  <p>Monitoramento contínuo de segurança e auditorias regulares</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h5 className="font-semibold mb-1">Backup Seguro</h5>
                  <p>Backups regulares e seguros de todos os dados</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
                  <h5 className="font-semibold mb-1 text-violet-600 dark:text-violet-400">Criptografia de Chaves de API (BYOK)</h5>
                  <p>Caso decida configurar suas próprias chaves de API (Google Gemini ou OpenAI), elas são salvas no banco de dados com criptografia militar AES-256-GCM e chave mestra isolada no servidor. As chaves tornam-se write-only (somente escrita): nunca são retornadas ao navegador do usuário e nunca são compartilhadas.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Armazenamento e Retenção */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Armazenamento e Retenção de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Onde armazenamos seus dados:</strong> Todas as informações coletadas e os arquivos de currículo enviados são armazenados de forma segura nos servidores em nuvem da Supabase, localizados em data centers de alta segurança (como AWS ou Google Cloud), utilizando criptografia em trânsito e em repouso.
              </p>
              <p>
                <strong>Período de retenção:</strong> Retemos suas informações apenas pelo tempo necessário para prestar nossos serviços ou até que você solicite a exclusão de seus dados. Os currículos analisados são retidos para exibição no seu histórico pessoal, mas podem ser excluídos definitivamente por você a qualquer momento por meio do painel de controle.
              </p>
            </CardContent>
          </Card>

          {/* Seus Direitos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Seus Direitos (LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>Você tem total controle sobre seus dados pessoais de acordo com a LGPD. Seus direitos incluem:</p>
              <div className="grid gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">Acesso</Badge>
                  <span className="text-sm">Solicitar confirmação e acesso aos dados armazenados sobre você.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">Correção</Badge>
                  <span className="text-sm">Solicitar a retificação de dados incorretos ou incompletos.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">Exclusão</Badge>
                  <span className="text-sm">Solicitar a eliminação definitiva de seus dados da plataforma.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">Portabilidade</Badge>
                  <span className="text-sm">Requerer a transferência dos seus dados para outro provedor em formato estruturado.</span>
                </div>
              </div>
              <p className="text-sm border-t pt-4">
                <strong>Como solicitar:</strong> Você pode excluir sua conta e seus dados diretamente na tela de Configurações da plataforma. Alternativamente, para solicitar a portabilidade, exportação ou esclarecer dúvidas de privacidade, envie um e-mail para <span className="font-semibold">contato@estagionauta.com.br</span>. Responderemos às solicitações de privacidade em um prazo regulatório de até 15 dias.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Cookies e Tecnologias Similares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Utilizamos cookies e tecnologias de rastreamento para analisar o tráfego do site, entender o comportamento do usuário e melhorar nossos serviços. Em conformidade com a LGPD, o uso de cookies não essenciais está sujeito ao seu consentimento explícito.
              </p>
              <div className="grid gap-3 text-sm">
                <div>
                  <strong>Cookies Essenciais:</strong> Necessários para a autenticação, segurança e o funcionamento básico da plataforma. Estes cookies não podem ser desativados.
                </div>
                <div>
                  <strong>Google Analytics:</strong> Ferramenta utilizada para monitorar o tráfego e métricas de uso de forma agregada. Só é inicializada após sua aceitação no banner de privacidade.
                </div>
                <div>
                  <strong>Microsoft Clarity:</strong> Serviço de gravação de sessões e análise visual de comportamento para nos ajudar a identificar bugs e otimizar fluxos de uso. Só é inicializado mediante seu consentimento.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Entre em Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados,
                entre em contato conosco:
              </p>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>Email: contato@estagionauta.com.br</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>Telefone: +55 (81) 99509-7377</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>Endereço: São Paulo, SP, Brasil</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alterações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Alterações nesta Política
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre
                quaisquer alterações significativas através de:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Email enviado para o endereço registrado</li>
                <li>• Notificação na plataforma</li>
                <li>• Atualização da data de "Última atualização"</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recomendamos que você revise esta política regularmente para se manter informado sobre
                como protegemos suas informações.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            © {new Date().getFullYear()} Estagionauta. Todos os direitos reservados.
          </p>
          <p className="mt-2">
            Esta política está em conformidade com a LGPD (Lei Geral de Proteção de Dados) e
            regulamentações internacionais de privacidade.
          </p>
        </div>
      </div>
    </div>
  )
} 