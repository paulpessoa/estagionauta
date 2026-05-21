# 🚀 Refatoração Profissional — Estagionauta SaaS

## Resumo Executivo

Refatoração do Estagionauta de uma SPA com lógica de backend no frontend para uma arquitetura **monorepo profissional** com backend separado em **Hono.js**, deploy no **Railway** (free tier), mantendo **Supabase** como banco + auth com migração gradual. Custo mensal: **R$ 0**.

---

## Decisões Confirmadas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Estrutura | **Monorepo** (`/api` no mesmo repo) | Compartilha tipos TS, simplifica dev, cada pasta deploya independente |
| Backend | **Hono.js** + TypeScript | Leve (14KB), TypeScript-first, roda em qualquer runtime, Zod built-in |
| Hosting backend | **Railway** (free tier → $5 hobby) | 500h grátis/mês, deploy via Dockerfile, escalável |
| Supabase | **Manter Auth + DB**, migrar lógica gradualmente | Não quebrar o que funciona, migrar incrementalmente |
| Análise de currículo | **Migrar Edge Function → backend**, melhorar | Já funciona, mas precisa de melhorias e centralização |
| Gerador de currículos | **Módulo separado** no backend (preparado para extrair como microserviço) | Começa como módulo, pode virar serviço independente depois |
| Simulador de entrevistas | **Módulo separado** no backend (idem) | Mesma estratégia |
| Stripe | **Reescrever do zero** no backend | Código atual está quebrado e inseguro |
| Chaves | **Rotacionar todas** na Fase 1 | Service Role Key e OpenAI key estão comprometidas |

---

## 🏗️ Como funciona o Monorepo

```
estagionauta/                     ← MESMO REPOSITÓRIO
├── src/                           ← Frontend (Vite + React)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── ...
├── api/                           ← Backend (Hono.js) ✨ NOVO
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── schemas/
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json               ← package.json SEPARADO
│   └── tsconfig.json
├── shared/                        ← Tipos compartilhados ✨ NOVO
│   └── types/
│       ├── plans.ts               ← Definição de planos (single source of truth)
│       ├── analysis.ts            ← Tipos de análise
│       └── index.ts
├── package.json                   ← Frontend package.json
├── vercel.json                    ← Deploy do frontend
└── supabase/                      ← Migrations e config
```

### Deploy independente de cada parte:

```
┌─────────────────────────────────────────────────────┐
│                    GitHub Repo                       │
│                 (estagionauta)                       │
│ ├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   Vercel (auto)      │    Railway (auto)            │
│   Watches: /src      │    Watches: /api             │
│   Build: vite build  │    Build: Dockerfile         │
│   URL: estagionauta  │    URL: api.estagionauta     │
│        .com.br       │         .com.br              │
│                      │    (ou subdomain Railway)    │
└──────────────────────┴──────────────────────────────┘
```

> [!TIP]
> **Por que monorepo funciona bem aqui:**
> - Vercel e Railway podem ser configurados para monitorar pastas específicas
> - TypeScript project references permitem compartilhar tipos entre frontend e backend
> - Um único `git push` pode triggar deploys nos dois serviços
> - Quando o projeto crescer, pode extrair para repos separados sem refatoração

---

## 🔴 Vulnerabilidades Críticas (Corrigir PRIMEIRO)

| # | Severidade | Problema | Arquivo |
|---|-----------|----------|---------|
| 1 | 🔴 CRÍTICO | **Service Role Key do Supabase exposta no frontend** via `VITE_` prefix | [supabase.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/lib/supabase.ts) |
| 2 | 🔴 CRÍTICO | **`addCredits` RPC chamável direto do browser** — créditos infinitos | [useCredits.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/hooks/useCredits.ts) |
| 3 | 🔴 CRÍTICO | **OpenAI API Key exposta** via `VITE_` prefix | [env.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/lib/env.ts) |
| 4 | 🔴 CRÍTICO | **Checkout aceita preço do cliente** + webhook com `supabase` undefined | [create-checkout-session.js](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/api/create-checkout-session.js) |
| 5 | ⚠️ MÉDIO | **Credenciais hardcoded** no source code | [client.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/integrations/supabase/client.ts) |
| 6 | ⚠️ MÉDIO | **CORS aberto** (`*`) nas Edge Functions | Edge Functions |
| 7 | ⚠️ MÉDIO | **Cliente Supabase duplicado** + código morto do Stripe legado | Múltiplos arquivos |

---

## Arquitetura Final

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                        │
│               Vite + React + TypeScript + Shadcn            │
│                                                            │
│  ┌──────┐ ┌──────────┐ ┌──────┐ ┌────────────────────────┐ │
│  │Pages │ │Components│ │Hooks │ │  apiClient.ts (fetch)  │ │
│  └──┬───┘ └──────────┘ └──┬───┘ └───────────┬────────────┘ │
│     └─────────────────────┘                 │              │
└─────────────────────────────────────────────┼──────────────┘
                                              │ HTTPS
┌─────────────────────────────────────────────┼──────────────┐
│                    BACKEND (Railway)         │              │
│                    Hono.js + TypeScript       │              │
│                                              │              │
│  ┌───────────────────────────────────────────┴───────────┐  │
│  │                    Middlewares                         │  │
│  │  CORS (domínio) │ Auth (JWT) │ Rate Limit │ Logger    │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│  ┌────────────┐ ┌────────┴───┐ ┌──────────┐ ┌───────────┐  │
│  │/api/stripe │ │/api/analysis│ │/api/email│ │/api/admin │  │
│  │ checkout   │ │ analyze    │ │ send     │ │ users     │  │
│  │ webhook    │ │ credits    │ │          │ │ agencies  │  │
│  │ plans      │ │ history    │ │          │ │ moderate  │  │
│  └─────┬──────┘ └─────┬──────┘ └────┬─────┘ └─────┬─────┘  │
│        │              │             │              │        │
│  ┌─────┴──────────────┴─────────────┴──────────────┴─────┐  │
│  │              Services Layer                           │  │
│  │  StripeService │ AIService │ EmailService │ Credits   │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                   │
│  ┌───── FUTUROS MÓDULOS (preparados para microserviço) ──┐  │
│  │  /api/generator/*  │  /api/simulator/*                │  │
│  │  (Gerador Curríc.) │  (Simulador Entrev.)             │  │
│  └───────────────────────────────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │         Supabase Client (Service Role Key)            │  │
│  │              → SEGURO no servidor                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                 ┌────────┴─────────┐
                 │     SUPABASE     │
                 │  PostgreSQL (DB) │
                 │  Auth (login)    │
                 │  Storage (files) │
                 └──────────────────┘
```

### Estrutura detalhada do Backend

```
api/
├── src/
│   ├── index.ts                     # App Hono + server start
│   ├── app.ts                       # Hono app definition + route registration
│   │
│   ├── routes/
│   │   ├── stripe.routes.ts         # POST /checkout, POST /webhook, GET /plans
│   │   ├── analysis.routes.ts       # POST /analyze, GET /history, GET /:id
│   │   ├── credits.routes.ts        # GET /balance, POST /consume (server-only!)
│   │   ├── email.routes.ts          # POST /send-curriculum
│   │   ├── agencies.routes.ts       # CRUD + moderation
│   │   ├── admin.routes.ts          # Users, moderation, stats
│   │   ├── generator.routes.ts      # 🆕 Gerador de currículos (futuro microserviço)
│   │   └── simulator.routes.ts      # 🆕 Simulador de entrevistas (futuro microserviço)
│   │
│   ├── services/
│   │   ├── stripe.service.ts        # Stripe SDK — plans definidos SERVER-SIDE
│   │   ├── openai.service.ts        # OpenAI SDK — chave SEGURA no servidor
│   │   ├── email.service.ts         # Brevo API
│   │   ├── credits.service.ts       # Lógica de créditos com transação atômica
│   │   └── supabase.service.ts      # Supabase admin client (service role)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts        # Valida JWT do Supabase → extrai user
│   │   ├── admin.middleware.ts       # Verifica role admin/moderator
│   │   ├── rateLimit.middleware.ts   # Rate limit por IP/user
│   │   └── validate.middleware.ts    # Validação Zod genérica
│   │
│   ├── schemas/                     # Zod schemas para input validation
│   │   ├── analysis.schema.ts       # { resumeText: z.string().min(50) }
│   │   ├── stripe.schema.ts         # { planId: z.enum(['cosmonauta', ...]) }
│   │   ├── email.schema.ts
│   │   └── agency.schema.ts
│   │
│   ├── config/
│   │   └── env.ts                   # Zod schema para TODAS as env vars
│   │
│   └── types/
│       └── index.ts
│
├── tests/
│   ├── unit/                        # Testes de services isolados
│   ├── integration/                 # Testes de endpoints com supertest
│   └── e2e/                         # Fluxos completos
│
├── Dockerfile
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Plano de Execução em 5 Fases

### Fase 1 — Segurança Emergencial (1-2 dias) 🔴

> Corrigir vulnerabilidades SEM mudar a arquitetura. A análise de currículo continua funcionando via Edge Function.

#### [MODIFY] [supabase.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/lib/supabase.ts)
- Remover `supabaseAdmin` (service role client) completamente
- Remover referência a `VITE_SUPABASE_SERVICE_ROLE_KEY`
- Manter apenas o client com anon key

#### [MODIFY] [env.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/lib/env.ts)
- Remover `VITE_OPENAI_API_KEY` (não precisa no frontend)
- Remover `VITE_SUPABASE_SERVICE_ROLE_KEY`

#### [MODIFY] [client.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/integrations/supabase/client.ts)
- Mover credenciais hardcoded para env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

#### [MODIFY] [useCredits.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/hooks/useCredits.ts)
- Remover `addCredits` do frontend (mover para backend na Fase 2)
- Manter apenas `fetchCredits` (leitura) e `consumeCredits` como chamada ao backend

#### [DELETE] [create-checkout-session.js](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/api/create-checkout-session.js)
- Código morto — Vercel não serve essa rota

#### [DELETE] [webhooks/stripe.js](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/api/webhooks/stripe.js)
- Código morto e com bug (`supabase` undefined)

#### [MODIFY] [stripe.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/lib/stripe.ts)
- Remover código morto: `stripeConfig`, `redirectToStripe`, `getPlanPrice`
- Manter apenas `getStripe()` and `STRIPE_PLANS` (para exibição no frontend)
- Remover `stripePriceId` do frontend (IDs de produto vão para o backend)

#### [MODIFY] Edge Functions (CORS)
- Restringir CORS de `*` para `https://estagionauta.com.br`

#### 🔑 Rotação de Chaves (manual)
- Rotacionar Service Role Key no Supabase Dashboard
- Rotacionar OpenAI API Key
- Rotacionar Stripe Secret Key (se exposta)
- Atualizar secrets no Supabase Edge Functions
- Remover `.env` do git history se contém secrets reais

---

### Fase 2 — Backend Hono.js (3-5 dias) 🏗️

> Criar o backend, migrar toda lógica de negócio do frontend e Edge Functions.

#### [NEW] `api/` — Todo o diretório do backend

**Setup inicial:**
```bash
# Dentro do monorepo
mkdir api && cd api
npm init -y
npm install hono @hono/node-server @hono/zod-validator zod
npm install @supabase/supabase-js stripe openai
npm install -D typescript @types/node vitest
```

**Endpoints a implementar:**

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/api/health` | Health check | ❌ |
| `GET` | `/api/plans` | Listar planos disponíveis | ❌ |
| `POST` | `/api/stripe/checkout` | Criar checkout session (preço SERVER-SIDE) | ✅ |
| `POST` | `/api/stripe/webhook` | Webhook do Stripe → adicionar créditos | ❌ (signature) |
| `GET` | `/api/credits` | Saldo do usuário | ✅ |
| `POST` | `/api/credits/consume` | Consumir créditos (chamado internamente) | ✅ |
| `POST` | `/api/analysis/analyze` | Analisar currículo (migrado da Edge Function) | ✅ |
| `GET` | `/api/analysis/history` | Histórico de análises | ✅ |
| `GET` | `/api/analysis/:id` | Detalhes de uma análise | ✅ |
| `POST` | `/api/email/send` | Enviar currículo por email | ✅ |
| `GET` | `/api/admin/users` | Listar usuários (admin only) | ✅ Admin |
| `GET` | `/api/admin/stats` | Dashboard stats | ✅ Admin |

**Auth middleware (validação do JWT Supabase):**
```typescript
// api/src/middleware/auth.middleware.ts
import { createMiddleware } from 'hono/factory'
import { supabaseAdmin } from '../services/supabase.service'

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return c.json({ error: 'Invalid token' }, 401)
  
  c.set('user', user)
  await next()
})
```

**Stripe checkout seguro (preço definido no servidor):**
```typescript
// api/src/routes/stripe.routes.ts
const PLANS = {
  cosmonauta: { price: 400, credits: 30, name: 'Cosmonauta' },
  astronauta: { price: 500, credits: 60, name: 'Astronauta' },
  comandante: { price: 1500, credits: 300, name: 'Comandante' },
} as const

app.post('/checkout', authMiddleware, zValidator('json', checkoutSchema), async (c) => {
  const { planId } = c.req.valid('json')  // Só recebe o planId!
  const plan = PLANS[planId]              // Preço vem do SERVIDOR
  const user = c.get('user')
  
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: { name: `${plan.name} - ${plan.credits} créditos` },
        unit_amount: plan.price,          // Preço do SERVIDOR, não do cliente
      },
      quantity: 1,
    }],
    metadata: { userId: user.id, planId, credits: plan.credits.toString() },
    // ...
  })
})
```

#### [NEW] `api/Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

#### [NEW] `shared/types/` — Tipos compartilhados
- Definição de planos, tipos de análise, etc.
- Importados tanto pelo frontend quanto pelo backend

#### [NEW] Frontend `src/lib/apiClient.ts`
- Wrapper `fetch()` tipado para chamar o backend
- Adiciona JWT automaticamente do Supabase session
- Tratamento de erros centralizado

#### [MODIFY] Frontend hooks
- `useCredits.ts` → chamar `/api/credits` em vez de Supabase RPC direto
- Criar `useAnalysis.ts` → chamar `/api/analysis/*`
- Criar `useStripeCheckout.ts` → chamar `/api/stripe/checkout`

---

### Fase 3 — Features Completas (5-7 dias) ⚡

> Todas as funcionalidades end-to-end, incluindo os novos módulos.

- [ ] **Análise de currículo** melhorada: prompt otimizado, streaming response, PDF download
- [ ] **Stripe** completo e testado: checkout → webhook → créditos
- [ ] **Sistema de créditos** atômico: sem race conditions
- [ ] **Kanban** funcional com persistência
- [ ] **Agências** com filtros, busca, moderação
- [ ] **Calculadora** com compartilhamento
- [x] **Módulo Simulador de Entrevistas** (`api/src/routes/simulator.routes.ts`)
  - [x] Migration no banco de dados (`interview_simulations`) com políticas RLS por usuário
  - [x] Shared TypeScript types em `shared/types/simulator.ts`
  - [x] OpenAI service integration no backend para inicialização, interação do chat de entrevista e feedback final
  - [x] Endpoints do Hono para CRUD e progresso de entrevista (`POST /api/simulator/start`, `POST /api/simulator/:id/answer`, `GET /api/simulator/history`, `GET /api/simulator/:id`)
  - [x] Interface visual do Simulador (`src/pages/SimuladorEntrevistas.tsx`) com dashboard histórico, configuração de entrevista (vaga + tom do entrevistador) e chat interativo com contagem de perguntas (max 5)
  - [x] Visualização premium do relatório de feedback gerado pela IA (pontuação, pontos fortes, melhorias e sugestões de respostas)
- [ ] **Módulo Gerador de Currículos** (`api/src/routes/generator.routes.ts`)
  - Input: dados do perfil → Output: currículo formatado via IA
  - Preparado com interface própria para futura extração como microserviço
- [ ] **Landing page** otimizada para conversão e SEO
- [ ] Definir preços finais consistentes (atualmente R$4, R$5, R$15 vs R$9.99, R$19.99)

---

### Fase 4 — Testes e CI/CD (2-3 dias) 🧪

- [ ] **Vitest** para testes unitários (services do backend)
- [ ] **Supertest** para testes de integração (endpoints)
- [ ] **Playwright** para testes E2E (fluxos críticos)
- [ ] **GitHub Actions** pipeline:
  ```yaml
  on: push
  jobs:
    lint:        # ESLint + TypeScript check
    test-api:    # Vitest no /api
    test-web:    # Vitest no /src
    deploy-api:  # Railway deploy (só se /api mudou)
    deploy-web:  # Vercel deploy (auto)
  ```
- [ ] **Sentry** (free tier) para error monitoring
- [ ] **UptimeRobot** (free) para health check monitoring

---

### Fase 5 — Polish e Escala (ongoing) 🎯

- [ ] Logging estruturado (JSON) no backend
- [ ] Rate limiting por usuário (prevenir abuso)
- [ ] Cache de planos e dados estáticos
- [ ] Documentação OpenAPI auto-gerada (Hono + Zod)
- [ ] Staging environment
- [ ] Extrair Gerador/Simulador como microserviços (quando justificar)

---

## Verification Plan

### Automated Tests
- Vitest: unit tests em cada service do backend
- Supertest: integration tests nos endpoints
- Playwright: E2E nos fluxos críticos (login → análise → pagamento)
- CI: GitHub Actions rodando em cada PR

### Security Verification
- `vite build` + grep no bundle → confirmar que nenhuma secret aparece
- Testar RLS policies via Supabase Dashboard
- Stripe CLI para testar webhook localmente
- OWASP basic checklist nos endpoints

### Manual Verification
- Fluxo completo: cadastro → análise → pagamento → créditos
- Teste de carga básico com Artillery/hey
