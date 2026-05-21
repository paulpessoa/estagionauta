# Checklist de Execução — Estagionauta SaaS

## Fase 1 — Segurança Emergencial 🔴

- [x] Modificar [supabase.ts](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/lib/supabase.ts) para remover `supabaseAdmin` e chaves sensíveis
- [x] Modificar [env.ts](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/lib/env.ts) para remover `VITE_OPENAI_API_KEY` e `VITE_SUPABASE_SERVICE_ROLE_KEY`
- [x] Modificar [client.ts](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/integrations/supabase/client.ts) para referenciar env vars em vez de hardcode
- [x] Modificar [useCredits.ts](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/hooks/useCredits.ts) para remover `addCredits` do browser
- [x] Deletar arquivo morto [create-checkout-session.js](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/api/create-checkout-session.js)
- [x] Deletar arquivo morto [stripe.js](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/api/webhooks/stripe.js)
- [x] Limpar código legado/morto em [stripe.ts](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/lib/stripe.ts)
- [x] Ajustar CORS de Edge Functions

## Fase 2 — Backend Hono.js 🏗️

- [x] Criar diretório `/api` e inicializar projeto Node/TS
- [x] Configurar `tsconfig.json` e `package.json` do backend
- [x] Implementar `api/src/index.ts` and `api/src/app.ts` (servidor Hono)
- [x] Implementar middleware de autenticação JWT (`api/src/middleware/auth.middleware.ts`)
- [x] Implementar rotas e serviços do Stripe (`/api/stripe/checkout`, `/api/stripe/webhook`)
- [x] Implementar rotas e lógica de créditos (`/api/credits`, `/api/credits/consume`)
- [x] Migrar análise de currículo para o backend (`/api/analysis/analyze`)
- [x] Criar `api/Dockerfile`
- [x] Mover tipos compartilhados para `/shared/types/`
- [x] Integrar frontend com o backend usando `src/lib/apiClient.ts`

## Fase 3 — Features Completas ⚡

### 3.1. Sistema de Créditos e Stripe
- [ ] Criar arquivo de migração para as tabelas e RPCs de créditos no Supabase (se ainda não criados)
- [ ] Validar e testar a rota `/api/stripe/webhook` recebendo eventos reais de checkout/pagamento e creditando o saldo
- [ ] Configurar chaves de ambiente necessárias para teste local do Stripe

### 3.2. Kanban de Candidaturas Funcional com Persistência
- [ ] Criar arquivo de migração `supabase/migrations/xxxx_create_kanban_tables.sql` para candidaturas e lembretes
- [ ] Habilitar Row Level Security (RLS) com políticas para o `auth.uid()` do usuário nas tabelas de Kanban
- [ ] Implementar rotas CRUD no backend em `api/src/routes/kanban.routes.ts`
- [ ] Registrar as rotas de Kanban no servidor Hono (`api/src/app.ts`)
- [ ] Atualizar o frontend em `src/pages/KanbanCandidaturas.tsx` para usar `apiClient` para carregar, criar, atualizar (mudar status/drag-drop) e excluir candidaturas e lembretes

### 3.3. Análise de Currículo Melhorada
- [ ] Otimizar prompt em `api/src/services/openai.service.ts`
- [ ] Adicionar botão e funcionalidade de download de PDF no frontend (`src/pages/ResultadoCurriculo.tsx`)

### 3.4. Módulo Gerador de Currículos
- [ ] Criar tipos compartilhados em `/shared/types/generator.ts` e exportá-los
- [ ] Criar rota do Hono `api/src/routes/generator.routes.ts`
- [ ] Implementar integração com OpenAI no backend para gerar seções do currículo a partir do perfil do usuário
- [ ] Registrar a rota de geração no servidor Hono (`api/src/app.ts`)
- [ ] Integrar no frontend para permitir a geração e exportação

### 3.5. Módulo Simulador de Entrevistas
- [ ] Criar tipos compartilhados em `/shared/types/simulator.ts`
- [ ] Criar rota do Hono `api/src/routes/simulator.routes.ts` com suporte a Server-Sent Events (SSE) para feedback ou perguntas
- [ ] Implementar lógica de perguntas com IA no backend
- [ ] Registrar rota no app principal do Hono
- [ ] Integrar no frontend com a tela de simulação de entrevista

### 3.6. Ajuste de Preços e Landing Page
- [ ] Padronizar valores dos planos de preços entre o frontend, backend e Stripe
- [ ] Ajustar exibição da landing page e fluxo de checkout correspondente

## Fase 4 — Testes e CI/CD 🧪

- [ ] Implementar testes unitários/integração no backend
- [ ] Configurar GitHub Actions CI/CD
- [ ] Configurar Sentry e UptimeRobot
