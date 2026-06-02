# Kanban de Candidaturas - Estagionauta

## Visão Geral

O Kanban de Candidaturas é uma ferramenta inteligente para organizar e acompanhar o progresso das suas candidaturas de estágio. Desenvolvido especificamente para universitários, oferece uma visualização clara e organizada de todas as suas oportunidades de carreira.

## Funcionalidades Principais

### 🎯 Organização Visual
- **Visualização Kanban**: Organize suas candidaturas em colunas por status
- **Status Personalizáveis**: Interessado, Candidatado, Entrevista, Teste, Proposta, Recusado
- **Cards Informativos**: Cada candidatura mostra informações essenciais em um card compacto
- **Progresso Visual**: Barra de progresso para acompanhar o avanço de cada candidatura

### 📱 Upload Inteligente de Imagens
- **Extração Automática**: Faça upload de uma imagem da vaga e a IA extrai automaticamente as informações
- **Autopreenchimento**: Formulário é preenchido automaticamente com os dados extraídos
- **Validação**: Possibilidade de editar e complementar as informações extraídas

### 🔔 Sistema de Lembretes
- **Lembretes Personalizados**: Configure lembretes para cada candidatura
- **Tipos de Lembrete**: Ligação, Email, Teste, Entrevista, Follow-up, Prazo
- **Notificações**: Painel de lembretes para visualizar tarefas pendentes
- **Marcação de Conclusão**: Marque lembretes como completos

### 📊 Métricas e Estatísticas
- **Dashboard de Métricas**: Visualize estatísticas importantes
- **Taxa de Sucesso**: Acompanhe sua performance
- **Progresso Médio**: Veja o progresso geral das suas candidaturas
- **Lembretes Próximos**: Quantidade de lembretes para os próximos 7 dias

### 🔍 Filtros e Busca
- **Busca Inteligente**: Encontre candidaturas por empresa ou cargo
- **Filtros por Status**: Filtre candidaturas por status específico
- **Visualização Organizada**: Cards organizados por colunas de status

## Como Usar

### 1. Adicionar Nova Candidatura

#### Método 1: Upload de Imagem
1. Clique em "Nova Candidatura"
2. Clique em "Extrair da Imagem com IA"
3. Faça upload da imagem da vaga
4. Aguarde a extração automática das informações
5. Revise e complemente os dados se necessário
6. Clique em "Adicionar Candidatura"

#### Método 2: Preenchimento Manual
1. Clique em "Nova Candidatura"
2. Preencha todos os campos do formulário
3. Adicione tags relevantes
4. Clique em "Adicionar Candidatura"

### 2. Gerenciar Candidaturas

#### Visualizar Detalhes
- Clique no ícone de expansão (seta) no card da candidatura
- Clique em "Detalhes" para ver informações completas

#### Adicionar Lembretes
1. Expanda o card da candidatura
2. Clique em "Adicionar Lembrete"
3. Configure o tipo, título, descrição e data
4. Salve o lembrete

#### Marcar Lembretes como Completos
- No modal de detalhes, use o switch para marcar lembretes como completos

### 3. Acompanhar Progresso

#### Painel de Lembretes
- Clique no botão "Lembretes" no cabeçalho
- Visualize todos os lembretes pendentes
- Marque como feito quando concluído

#### Estatísticas
- Visualize métricas importantes no dashboard
- Acompanhe sua taxa de sucesso
- Monitore o progresso médio das candidaturas

## Estrutura de Dados

### JobApplication
```typescript
interface JobApplication {
  id: string
  company: string
  position: string
  status: 'interested' | 'applied' | 'interview' | 'test' | 'offer' | 'rejected'
  appliedDate: Date
  description: string
  salary?: string
  location: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  progress: number
  nextAction?: string
  nextActionDate?: Date
  reminders: Reminder[]
  notes: string
  imageUrl?: string
  tags: string[]
}
```

### Reminder
```typescript
interface Reminder {
  id: string
  title: string
  description: string
  date: Date
  completed: boolean
  type: 'call' | 'email' | 'test' | 'interview' | 'follow-up' | 'deadline'
}
```

## Melhorias Futuras

### 🚀 Funcionalidades Planejadas

#### Integração com Calendário
- **Google Calendar**: Sincronização automática de lembretes
- **Outlook**: Suporte para calendário corporativo
- **Notificações Push**: Alertas em tempo real

#### Automação Avançada
- **Follow-up Automático**: Envio automático de emails de acompanhamento
- **Análise de Tendências**: IA para sugerir melhores momentos para follow-up
- **Templates de Email**: Modelos personalizáveis para diferentes tipos de contato

#### Relatórios Detalhados
- **Relatórios Mensais**: Análise detalhada de performance
- **Gráficos Interativos**: Visualizações avançadas de progresso
- **Exportação de Dados**: Exportar dados em PDF ou Excel

#### Colaboração
- **Compartilhamento**: Compartilhar candidaturas com mentores
- **Feedback**: Sistema de feedback de recrutadores
- **Comunidade**: Conectar com outros candidatos

#### Mobile App
- **App Nativo**: Aplicativo mobile para iOS e Android
- **Notificações Push**: Alertas em tempo real
- **Sincronização Offline**: Trabalhar sem internet

## Tecnologias Utilizadas

- **Frontend**: React + TypeScript
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Notifications**: Sonner
- **Styling**: Tailwind CSS

## Contribuição

Para contribuir com o desenvolvimento do Kanban de Candidaturas:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Adicione testes se necessário
5. Submeta um Pull Request

## Suporte

Para dúvidas ou sugestões sobre o Kanban de Candidaturas, entre em contato através do nosso sistema de suporte ou abra uma issue no repositório. 