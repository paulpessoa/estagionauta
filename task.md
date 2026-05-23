# Tarefas de Polimento, Correções e UX Extrema

## 1. Banco de Dados & Perfil Público

- [x] Criar e aplicar migration SQL para adicionar `privacy_settings` na tabela `user_profiles`
- [x] Validar salvamento de configurações de privacidade no frontend
- [x] Corrigir visualização do currículo público `/curriculo/:slug`

## 2. Consistência UX/UI & Remoção de Emojis

- [x] Varredura e remoção de emojis em títulos, botões e textos nas páginas principais
- [x] Padronização de containers (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) nas páginas principais:
  - [x] `KanbanCandidaturas.tsx`
  - [x] `SimuladorEntrevistas.tsx`
  - [x] `GeradorCurriculos.tsx`
  - [x] `Analisecurriculo.tsx`
  - [x] `Agencias.tsx`
  - [x] `Configuracoes.tsx`

## 3. Página Inicial (Home / Dashboard)

- [x] Atualizar `src/pages/Index.tsx` para exibir "Painel de Acesso Rápido" se o usuário estiver logado
- [x] Manter landing page padrão caso o usuário não esteja logado

## 4. Setup Inicial de SEO

- [x] Instalar e configurar `react-helmet-async` no frontend
- [x] Criar arquivo `public/robots.txt`
- [x] Criar arquivo `public/sitemap.xml`
- [x] Injetar meta tags dinâmicas nas páginas públicas

## 5. Área de Administração Real

- [ ] Refatorar a página `/admin` (`src/pages/Admin.tsx`) para puxar dados reais do Supabase
- [ ] Conectar moderação de agências (`src/pages/admin/ModeracaoAgencias.tsx`) com a tabela `agency_reviews`
- [ ] Implementar ações reais de aprovação e rejeição de avaliações

## 6. Normalização Layout, Status Page & Correção Kanban

- [x] Aplicar migrações pendentes no Supabase para adicionar colunas `status_history` e `feedbacks` em `kanban_applications`
- [x] Atualizar rodapé (`Footer.tsx`): link de Ajuda para WhatsApp, remover toast de "Em desenvolvimento" no suporte, link de Status para `/status`
- [x] Criar página de Status do Sistema (`src/pages/Status.tsx`) e registrar no roteador `/status`
- [x] Normalize UI layout em:
  - [x] `analise-curriculo` (`src/pages/Analisecurriculo.tsx`)
  - [x] `agencias` (`src/pages/Agencias.tsx`)
  - [x] `calculadora` (`src/pages/CalculadoraRecesso.tsx`)
  - [x] `/precos` (`src/pages/Precos.tsx`)
  - [x] `/configuracoes` (`src/pages/Configuracoes.tsx`)
  - [x] `/simulador-entrevistas` (`src/pages/SimuladorEntrevistas.tsx`)
  - [x] `/gerador-curriculos` (`src/pages/GeradorCurriculos.tsx`)
  - [x] `/candidaturas` (`src/pages/KanbanCandidaturas.tsx`)
