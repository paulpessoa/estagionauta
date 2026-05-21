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

- [ ] Criar diretório `/api` e inicializar projeto Node/TS
- [ ] Configurar `tsconfig.json` e `package.json` do backend
- [ ] Implementar `api/src/index.ts` and `api/src/app.ts` (servidor Hono)
- [ ] Implementar middleware de autenticação JWT (`api/src/middleware/auth.middleware.ts`)
- [ ] Implementar rotas e serviços do Stripe (`/api/stripe/checkout`, `/api/stripe/webhook`)
- [ ] Implementar rotas e lógica de créditos (`/api/credits`, `/api/credits/consume`)
- [ ] Migrar análise de currículo para o backend (`/api/analysis/analyze`)
- [ ] Criar `api/Dockerfile`
- [ ] Mover tipos compartilhados para `/shared/types/`
- [ ] Integrar frontend com o backend usando `src/lib/apiClient.ts`

## Fase 3 — Features Completas ⚡

- [ ] Implementar fluxo de análise melhorado
- [ ] Integrar Stripe com transações de crédito atômicas no backend
- [ ] Finalizar Kanban funcional
- [ ] Finalizar Módulo Gerador de Currículos e Módulo Simulador de Entrevistas
- [ ] Ajustar preços e landing page

## Fase 4 — Testes e CI/CD 🧪

- [ ] Implementar testes unitários/integração no backend
- [ ] Configurar GitHub Actions CI/CD
- [ ] Configurar Sentry e UptimeRobot
