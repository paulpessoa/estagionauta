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
- [x] Implementar `api/src/index.ts` e `api/src/app.ts` (servidor Hono)
- [x] Implementar middleware de autenticação JWT (`api/src/middleware/auth.middleware.ts`)
- [x] Implementar rotas e serviços do Stripe (`/api/stripe/checkout`, `/api/stripe/webhook`)
- [x] Implementar rotas e lógica de créditos (`/api/credits`, `/api/credits/consume`)
- [x] Migrar análise de currículo para o backend (`/api/analysis/analyze`)
- [x] Criar `api/Dockerfile`
- [x] Mover tipos compartilhados para `/shared/types/`
- [x] Integrar frontend com o backend usando `src/lib/apiClient.ts`

## Fase 3 — Features Completas ⚡

- [x] **3.1 Persistência do Kanban**
  - [x] Criar migration do banco para `kanban_applications` e `kanban_reminders`
  - [x] Criar rotas do Hono para CRUD de candidaturas e lembretes no backend
  - [x] Integrar frontend com `apiClient` em [KanbanCandidaturas.tsx](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/KanbanCandidaturas.tsx)
    - [x] Carregar candidaturas do backend
    - [x] Criar nova candidatura
    - [x] Atualizar status da candidatura (drag-and-drop/select)
    - [x] Corrigir erro de parsing de data no `date-fns` (conversão manual para `new Date(...)` antes de `format`)
    - [x] Conectar ação de exclusão de candidatura (`deleteApplication`) no `ApplicationCard` e modal de detalhes
    - [x] Conectar ação de alternância de lembrete (`toggleReminderCompletion`)
  - [x] Validar e testar build completo (root + `api/`)
- [x] **3.2 Módulo Gerador de Currículos**
  - [x] Definir tipos compartilhados em `shared/types/generator.ts`
  - [x] Criar migration do banco para `generated_resumes`
  - [x] Criar service de OpenAI para geração de currículos
  - [x] Implementar rotas do Hono (`api/src/routes/generator.routes.ts`)
  - [x] Ajustar permissões de rota no frontend (`src/route.ts`)
  - [x] Atualizar UI em `src/pages/GeradorCurriculos.tsx` com formulário e exportação em PDF
  - [x] Validar builds do frontend e backend e commitar
- [x] **3.3 Módulo Simulador de Entrevistas**
  - [x] Criar migration do banco para `interview_simulations`
  - [x] Definir tipos compartilhados em `shared/types/simulator.ts`
  - [x] Criar service de OpenAI para o simulador (gerar perguntas e feedbacks)
  - [x] Criar rotas do Hono (`api/src/routes/simulator.routes.ts`) integradas ao `openai.service`
  - [x] Desenvolver interface visual premium em `src/pages/SimuladorEntrevistas.tsx`
  - [x] Integrar UI do simulador com o backend `/api/simulator`
  - [x] Validar builds e testar fluxo
- [ ] **3.4 Fluxo de Análise Otimizado**
  - [ ] Refinar prompt da IA em `/api/src/services/openai.service.ts`
  - [ ] Adicionar exportação da análise em PDF no frontend
- [ ] **3.5 Integração Stripe e Preços**
  - [ ] Ajustar preços das ofertas e planos na landing page e backend
  - [ ] Validar transação atômica do Stripe adicionando créditos via webhook com segurança

## Fase 4 — Testes e CI/CD 🧪

- [ ] Implementar testes unitários para os services no `/api` (Supabase, Credits, Stripe, AI) com Vitest
- [ ] Implementar testes de integração básicos para as rotas do Hono
- [x] Deploy manual do Backend no Google Cloud Run concluído com sucesso
- [ ] Configurar GitHub Actions CI/CD para deploy independente
- [ ] Configurar monitoramento de erros (Sentry free tier) e Uptime (UptimeRobot)

## Fase 5 — Polish & Scale 🎯

- [ ] Rate limit por IP/usuário no backend
- [ ] Documentação Swagger/OpenAPI auto-gerada no Hono
- [ ] Ajustes finais de design (micro-animações, consistência de dark mode)
