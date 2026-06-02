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

- [x] Refatorar a página `/admin` (`src/pages/Admin.tsx`) para puxar dados reais do Supabase
- [x] Conectar moderação de agências (`src/pages/admin/ModeracaoAgencias.tsx`) com a tabela `agency_reviews`
- [x] Implementar ações reais de aprovação e rejeição de avaliações

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

## 7. Painel de Moderação, URL Params & Uploader de Logo

- [x] Backend: Permitir `moderator` no `adminMiddleware` e restringir endpoints confidenciais a `admin`
- [x] Header UI: Exibir apenas "Painel Administrativo" no menu para administradores/moderadores
- [x] Admin UI: Integrar `ModeracaoAgencias` diretamente como tab no `/admin`
- [x] Agências: Sincronizar filtros/busca (q, address, view, page) na URL via `useSearchParams`
- [x] Modais: Adicionar uploader de logo no `EditAgencyModal` apontando para o bucket `agency-logos`

## 8. Paginação de Agências, Menus/Créditos e Moderação de Comentários

- [x] Corrigir paginação de agências em `Agencias.tsx` (reiniciar página para 1 quando filtros encolherem a listagem)
- [x] Exibir lista completa no modo Mapa de agências sem paginação
- [x] Ajustar visibilidade de itens no header e menu mobile com base no cargo (ocultar recursos de estudante para admin)
- [x] Remover exibição de contador de créditos no header superior e simplificar link para "Meus Créditos"
- [x] Inserir agência VAGGON de teste e 3 avaliações (pendente, aprovada e rejeitada) no banco de dados
- [x] Adicionar colunas `status` e `moderation_reason` na tabela `agency_comments`
- [x] Implementar rotas Hono de moderação de comentários: `GET /api/admin/comments` e `PUT /api/admin/comments/:id/moderate`
- [x] Renderizar avatares e nomes reais dos estudantes nos comentários
- [x] Ocultar botão de resposta para comentários próprios (bloquear autocomentários) e em respostas (limitar aninhamento a 1 nível)
- [x] Adicionar aba de transparência de "Histórico de Moderação" nas agências para comentários removidos (nomes no formato `Estudante G***`)
- [x] Integrar aba de moderação de "Comentários" no painel administrativo `/admin`

## FASE 2 — Copilot WebAgent MVP

- [x] Database migrations (`copilot_messages` & `copilot_abuse_logs` tables with RLS and admin permission triggers)
- [x] Abuse & Rate Limit Service (`api/src/services/abuse.service.ts` limiting to 30 msg/hr, 100 msg/day, 15 msg/5min cooldown)
- [x] Tools definitions & execution (`check_profile`, `check_credits`, `calculate_recess`, `analyze_resume` in `api/src/tools/`)
- [x] Backend Routes (`api/src/routes/copilot.routes.ts` message chat loop, clear, and history)
- [x] Enforce paid subscription for OpenAI TTS inside `api/src/routes/simulator.routes.ts`
- [x] Update frontend `src/pages/SimuladorEntrevistas.tsx` to handle browser TTS fallback for free users and notice alert upgrade banner
- [x] Integrate floating action button click toggler and glassmorphism slide drawer `CopilotDrawer.tsx` in frontend `src/App.tsx`
- [x] Verify backend tests compile and pass via Vitest

## FASE 2.5 — Renomear para Rover & Separar Perfil/Configurações

- [x] Database migration: create SQL file `20260527201600_rename_copilot_to_rover.sql` and run `supabase db push`
- [x] Rename Hono routes and test files to use "rover" instead of "copilot"
- [x] Mount `/api/rover` in Hono app router
- [x] Update table names and references in `abuse.service.ts` and route files
- [x] Refactor tools registry to use "rover" terminology and inject site map into system prompt
- [x] Rename frontend component folder/drawer and adjust references
- [x] Create `/perfil` page allowing user to edit avatar, slug, name, phone, bio, linkedin, and academic info
- [x] Clean up `/configuracoes` page to contain only password change and delete account
- [x] Register new `/perfil` route in `src/route.ts` and update header dropdown/mobile navigation
- [x] Verify Vitest tests pass and projects build successfully

## FASE 2.6 — Rover Tools Blueprint (Sprint 1)

- [x] Database migrations for Sprint 1 (user_reminders, referral_invites, user_tasks tables with RLS and triggers)
- [x] Implement buy_credits tool (Stripe checkout generator)
- [x] Implement start_interview tool (Verification, credit consumption, and session initialization)
- [x] Implement generate_resume tool (AI markdown CV builder optimized for specific candidatures)
- [x] Implement analyze_candidatura tool (AI compatibility report, score, strengths, and tips)
- [x] Implement update_candidatura tool (Move Kanban status and recalculate progress)
- [x] Implement get_referral_link tool (Retrieve personal referral link)
- [x] Implement invite_friend tool (E-mail invite via Brevo + pending invite insertion)
- [x] Implement list_invitees tool (Status list of friends invited)
- [x] Implement check_referral_stats tool (Referrals summary dashboard)
- [x] Implement list_available_tasks tool (Gamified available tasks & validation checks)
- [x] Implement claim_task_reward tool (Task completion reward redemption)
- [x] Implement request_password_reset tool (Secure recovery email flow via Supabase Auth)
- [x] Implement Prompt Injection Filter guardrail in rover routes
- [x] Register new tools in registry.ts and update system prompt instructions
- [x] Write comprehensive unit tests for all 12 tools and guardrails (passing 20/20 specs)
- [x] Deploy to Google Cloud Run and verify production logs

## FASE 2.7 — Rover Tools Blueprint (Sprint 2)

- [x] Implement database support for reminders & FIFO credits tracking
- [x] Implement reminders tools (`create_reminder`, `list_reminders`, `update_reminder`)
- [x] Implement credit histories & expiration tools (`check_credit_history`, `check_credit_expiry`)
- [x] Implement user dashboard query tools (`list_past_interviews`, `list_resumes`, `candidatura_stats`, `check_account_status`)
- [x] Implement UI router helper tool (`navigate_to`)
- [x] Implement PII Redaction Filter guardrail (CPF & Credit Card data) in rover API routes
- [x] Integrate OpenAI Content Moderation API guardrail in rover message handlers
- [x] Register the 10 Sprint 2 tools in the registry and map them to system prompt rules
- [x] Write 18 unit tests in `sprint2_tools.spec.ts` covering all tools and safety guardrails
- [x] Verify successful Vitest suite execution (38/38 specs passing) and clean TypeScript build

## FASE 2.8 — Importador de Usuários do Jotform (Menvo)

- [x] Backend: Validar e integrar a chave `MENVO_JOTFORM_API_KEY` no parser de configurações `env.ts`
- [x] Backend: Criar endpoints `GET /api/admin/jotform/forms` e `GET /api/admin/jotform/submissions/:formId` com parser inteligente de respostas
- [x] Backend: Criar endpoint `POST /api/admin/jotform/import` que cria o usuário, define 10 créditos, gera o link de acesso seguro e envia o convite personalizado por e-mail (Brevo)
- [x] Frontend: Atualizar `/admin/importador` (`ImportadorUsuarios.tsx`) para listar formulários e submissões com status local comparado em tempo real
- [x] Frontend: Criar botões de atalhos rápidos para os formulários sugeridos (`92985548715676` e `200697163523354`)
- [x] Frontend: Integrar ação em bloco "Cadastrar & Enviar Convites" que executa a importação no backend
- [x] Verificação: Validar build do frontend, backend e rodar testes do Vitest (46/46 specs passando)




