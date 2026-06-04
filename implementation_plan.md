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

---

# Moderação, URL Params & Uploader de Logo

## Proposed Changes

### Frontend Component & Layout Normalization

#### [MODIFY] [Admin.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Admin.tsx)
- Allow both `'admin'` and `'moderator'` roles in the front-end profile check.
- Conditionally render sidebar navigation items based on user role (moderator only sees Visão Geral, Submissões, and Moderação).
- Import and render `<ModeracaoAgencias />` directly in the `moderation` active tab switch case (removing the card redirect link).
- Change the banner button "Ir para Moderação" in `overview` to `onClick={() => setActiveTab('moderation')}`.

#### [MODIFY] [ModeracaoAgencias.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/admin/ModeracaoAgencias.tsx)
- Remove the outer layout padding (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`) and modify headers so it blends directly inside the admin panel sidebar layout.

#### [MODIFY] [Header.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/components/layout/Header.tsx)
- Simplify administrative menu links: for both admins and moderators, render a single "Painel Administrativo" option linking to `/admin` instead of separate "Painel Admin" and "Moderar Agências" options in both the desktop dropdown and mobile sheet.

#### [MODIFY] [Agencias.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Agencias.tsx)
- Sync search query state with URL search parameters (derive `q`, `address`, `view`, and `page` using React Router's `useSearchParams` hook).
- Implement input state initializers from URL search params.
- Automatically reset page param to `1` when filters or search queries change.

#### [MODIFY] [EditAgencyModal.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/components/modals/EditAgencyModal.tsx)
- Add a logo image input field with preview capabilities.
- Implement uploading the selected image file to Supabase Storage `agency-logos` bucket during form submission, updating the agency's `logo_url` attribute.
- Provide a "Remover Logo" action to allow deleting the logo url.

### Backend Endpoints Security

#### [MODIFY] [admin.middleware.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/middleware/admin.middleware.ts)
- Update check to permit both `'admin'` and `'moderator'` roles to access administrative routes.

#### [MODIFY] [admin.routes.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/routes/admin.routes.ts)
- Restrict sensitive endpoints (`/users`, `/transactions`, `/users/:id/role`, and `/users/:id/credits`) strictly to users with `'admin'` role by adding an explicit DB role check inside each request handler.

## Verification Plan

### Automated Verification
- Run `npm run build` in root and `api/` directories to ensure zero compilation or type errors.

### Manual Verification
- Log in as admin and moderator, verify that the header displays a single "Painel Administrativo" link.
- Navigate to `/admin` as moderator and verify that admin-only tabs are hidden, and stats load correctly.
- Test searching/filtering in `/agencias` and refresh the page to verify parameters are preserved in the address bar.
- Edit an agency, upload a new logo, save, and verify that the logo is displayed properly.


---

# Layout Normalization, System Status & Kanban Fix

This section details the layout normalization, adding the system status page, and resolving the Kanban update issue.

## User Review Required

> [!NOTE]
> All normalizations will align containers to `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8` and headers to left-aligned `tracking-tight` structures using the brand's cosmic color gradient and Space Grotesk/Inter font guidelines.

## Proposed Changes

### Database & Backend
- Already applied all pending database migrations (`20260522120000-add-status-history-and-feedbacks.sql`, etc.) on the remote Supabase database. This resolves the 404 error when updating Kanban applications.

### Layout & Page Normalization
- [Analisecurriculo.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Analisecurriculo.tsx): Normalize page width, spacing, background gradient, and left-align the header.
- [Agencias.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Agencias.tsx): Normalize outer container layout, left-align header, and replace green gradient with cosmic indigo gradient.
- [CalculadoraRecesso.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/CalculadoraRecesso.tsx): Normalize outer container width, left-align header, and unify background gradient.
- [Precos.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Precos.tsx): Normalize outer container width, left-align header, and unify background gradient.
- [Configuracoes.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Configuracoes.tsx): Normalize outer container width, left-align header, and unify background gradient.
- [SimuladorEntrevistas.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/SimuladorEntrevistas.tsx): Unify container width, header elements, and background gradient.
- [GeradorCurriculos.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/GeradorCurriculos.tsx): Unify container width, header elements, and background gradient.
- [KanbanCandidaturas.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/KanbanCandidaturas.tsx): Unify background gradient and container spacing.

### System Status & Footer Update
- [NEW] [Status.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Status.tsx): Add system status page showing status of the backend health check (`/api/health`).
- [route.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/route.ts): Register `/status` route.
- [Footer.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/components/Footer.tsx): Update WhatsApp link for Central de Ajuda to `https://wa.me/558199509777`, remove "Em desenvolvimento" toast wrapper from support links, and link Status to `/status`.

---

# Paginação de Agências & Comentários Saudáveis (Nomes, Avatares, Regras e Moderação de Comentários)

Este plano corrige o problema de listagem de agências quando o total de páginas reduz, a exibição de nomes e avatares nos comentários das agências, define restrições para evitar que os comentários virem uma árvore infinita e confusa, e implementa um sistema completo de moderação de comentários pelo administrador e moderador.

## User Review Required

> [!NOTE]
> - **Visualização no Mapa**: No mapa não faz sentido usar paginação, pois o usuário deseja ver todos os locais correspondentes na região. Portanto, no modo Mapa exibiremos todas as agências filtradas de uma vez, mantendo a paginação apenas no modo Lista.
> - **Níveis de Comentários**: Para manter a interface limpa e organizada (sem "árvores malucas"), limitamos as respostas a apenas **1 nível de aninhamento** (Comentário Pai -> Resposta). Respostas não podem receber novas respostas; o botão "Responder" é ocultado para respostas e desativado no backend/verificações.
> - **Moderação de Comentários**:
>   - Adicionamos as colunas `status` (padrão `'approved'`) e `moderation_reason` na tabela `agency_comments` via script de migração direta.
>   - Criamos rotas no backend `api/src/routes/admin.routes.ts` para buscar e atualizar o status de moderação dos comentários (usando a service role key do Supabase Admin).
>   - Usuários comuns e administradores poderão ver os comentários inline com um aviso de remoção (`"Conteúdo removido pelo moderador por violar as regras da comunidade: [motivo]"`), e haverá uma nova aba tanto para o usuário comum (na página da agência) quanto para o administrador (no painel `/admin`) listando os comentários que foram rejeitados/bloqueados.

## Proposed Changes

### Database & Seed

#### [SEED] [seed-vaggon-reviews.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/scratch/seed-vaggon-reviews.ts)
- [x] Script executado com sucesso: Criou a agência **VAGGON** (status: approved, type: agencia_privada, is_verified: true) e inseriu 3 avaliações (uma pendente, uma aprovada e uma rejeitada) associadas ao primeiro perfil de usuário encontrado no banco de dados.

#### [MIGRATION] [run-comments-migration.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/scratch/run-comments-migration.ts)
- [x] Script executado com sucesso: Adicionou as colunas `status` (TEXT, default 'approved') e `moderation_reason` (TEXT) à tabela `agency_comments` usando a conexão pooler via IPv4 (Supavisor) na região `sa-east-1`.

### Backend API

#### [MODIFY] [admin.routes.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/routes/admin.routes.ts)
- **`GET /api/admin/comments`**: Rota protegida (admin/moderator) para listar todos os comentários denunciados (`is_reported = true`) ou bloqueados/rejeitados (`status = 'rejected'`).
- **`PUT /api/admin/comments/:id/moderate`**: Rota protegida (admin/moderator) para aprovar ou rejeitar/bloquear um comentário. Se rejeitado, altera o `status` para `'rejected'`, salva o `moderation_reason` e sobrescreve o conteúdo (`content`) do comentário com a mensagem padrão de moderação, limpando também a flag `is_reported`. Se aprovado, limpa a flag `is_reported`.

### Frontend Components

#### [MODIFY] [Agencias.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Agencias.tsx)
- No modo Lista, adicionar um `useEffect` para validar se a página atual (`currentPage`) excede a quantidade total de páginas (`totalPages`). Se exceder, redefinir para `1` (evitando listagem em branco pós-filtro).
- No modo Mapa, passar a lista completa filtrada (`filteredAgencies`) sem paginação, permitindo que todas as agências elegíveis apareçam no mapa de uma vez.

#### [MODIFY] [AgencyCommentsSection.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/components/agency/AgencyCommentsSection.tsx)
- Modificar a interface `Comment` para comportar `user_name`, `user_avatar`, `status` e `moderation_reason`.
- Em `fetchComments`, extrair os IDs dos usuários de todos os comentários, carregar as informações de perfil (`full_name`, `avatar_url`) da tabela `user_profiles` em lote, e mapear de volta nos comentários.
- Atualizar o layout do comentário no `renderComment` para mostrar o avatar real (com fallback para a inicial do nome) e o nome do usuário.
- Se `comment.status === 'rejected'`, renderizar o texto estilizado em vermelho/cinza `"Conteúdo removido pelo moderador por violar as regras da comunidade: [motivo]"` no lugar do conteúdo, e ocultar os botões de Reação (Like/Dislike) e Resposta.
- Adicionar abas na seção de comentários (usando Shadcn `Tabs`):
  - **Aba "Comentários" (Ativos)**: Exibe os comentários aprovados/ativos (e os moderados inline com o texto de aviso).
  - **Aba "Histórico de Moderação"**: Exibe a lista transparente de todos os comentários dessa agência que foram removidos pela moderação, o nome do autor do comentário (redigido para segurança, ex: "Estudante G***") e a justificativa do moderador.
- Para administradores/moderadores logados:
  - Renderizar um botão "Moderar" (com ícone de escudo ou lixeira) ao lado de cada comentário ativo.
  - Ao clicar, abre uma caixa de diálogo ou prompt solicitando o motivo da remoção e chama o endpoint `PUT /api/admin/comments/:id/moderate` com status `'rejected'`.
- Ocultar o botão "Responder" para o próprio autor do comentário (`comment.user_id === user.id`).
- Lançar alerta caso um usuário não autenticado clique no botão de resposta.
- Em `handleSubmitReply`, adicionar verificações adicionais:
  - Impedir resposta se o autor do comentário pai for o próprio usuário.
  - Impedir resposta se o comentário pai for uma resposta (verificando `parent_id` existente).

#### [MODIFY] [ModeracaoAgencias.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/admin/ModeracaoAgencias.tsx)
- Adicionar uma nova aba principal: **Comentários**.
- Carregar os comentários denunciados ou bloqueados usando a rota `GET /api/admin/comments`.
- Renderizar uma tabela/lista exibindo o nome do usuário, nome da agência, conteúdo original (se ainda não excluído), motivo da denúncia, status atual e justificativa de moderação.
- Fornecer ações rápidas:
  - **Aprovar**: Remove a denúncia e mantém o comentário ativo.
  - **Bloquear/Rejeitar**: Abre um modal/campo para inserir a justificativa de exclusão, substitui o conteúdo e altera seu status para `'rejected'`.

## Verification Plan

### Automated Verification
- Rodar `npm run build` na raiz do projeto e na pasta `api/` para atestar a correção sintática de TypeScript.

### Manual Verification
- Acessar o painel administrativo (`/admin`) e verificar que a aba **Avaliações** exibe as 3 avaliações geradas para a agência **VAGGON** (pendente, aprovada e rejeitada).
- Verificar que a nova aba **Comentários** no painel administrativo exibe os comentários sinalizados.
- Acessar `/agencias` no navegador.
- Filtrar por estado/cidade após avançar para uma página maior e verificar que ela é reiniciada para 1 se o resultado encolher.
- Alternar para o modo Mapa e verificar que todas as agências correspondentes aos filtros aparecem (incluindo VAGGON).
- Na página de detalhes da agência VAGGON:
  - Comentar e responder com perfis diferentes, validando que nomes e avatares carregam corretamente.
  - Como administrador, clicar em "Moderar" em um comentário, inserir um motivo e confirmar que ele é alterado para o aviso e movido para a aba de "Histórico de Moderação".
  - Validar que respostas a comentários moderados e likes/dislikes são desabilitados.
  - Validar que o botão "Responder" some em seus próprios comentários.
  - Validar que é impossível responder a uma resposta de comentário.


---

# Ajuste de Validade dos Créditos para 2 Meses e Reset Geral para 10 Créditos

Este plano altera a validade de créditos (adquiridos ou bônus) de 6 meses para 2 meses e define o saldo de todos os usuários para exatamente 10 créditos.

## User Review Required

> [!IMPORTANT]
> **Sobre o Reset de Créditos (Duas Opções de Abordagem)**:
> 
> * **Opção A (Recomendada - Começo Limpo)**: Excluir todo o histórico da tabela `credit_transactions` e inserir um único registro de bônus de 10 créditos para cada perfil existente. Isso é ideal para a fase Beta pois evita inconsistências matemáticas com transações passadas.
> * **Opção B (Preservar Histórico)**: Calcular o saldo atual de cada usuário e inserir uma transação de ajuste (adição de bônus ou consumo de créditos) para que o saldo atual resulte em exatamente 10.
> 
> *Aguardamos sua resposta sobre qual opção prefere.* (Opção A é recomendada)

## Proposed Changes

### Database Migrations

#### [NEW] [20260531200000_update_expiry_to_two_months.sql](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/supabase/migrations/20260531200000_update_expiry_to_two_months.sql)
- Redefinir a função `add_credits(user_uuid, amount, description, stripe_payment_intent_id)` para utilizar `INTERVAL '2 months'` em vez de `INTERVAL '6 months'`.
- Executar query para atualizar transações de compra existentes:
  ```sql
  UPDATE public.credit_transactions SET expires_at = created_at + INTERVAL '2 months' WHERE type = 'purchase';
  ```
- Executar reset de créditos com base na opção selecionada (A ou B).

### Backend (Rover API)

#### [MODIFY] [rover.routes.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/routes/rover.routes.ts)
- Atualizar a instrução do prompt do Rover que detalha a validade dos créditos de "6 meses" para "2 meses".

### Frontend (UI)

#### [MODIFY] [Precos.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Precos.tsx)
- Substituir textos que informam "6 meses" por "2 meses".

#### [MODIFY] [Creditos.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Creditos.tsx)
- Substituir a validade dos créditos avulsos para "2 meses".

#### [MODIFY] [ConvideAmigos.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/ConvideAmigos.tsx)
- Substituir a validade dos créditos de indicação para "2 meses".

## Verification Plan

### Automated Verification
- Rodar `npm run build` na raiz do projeto e na pasta `api/` para atestar a compilação correta.
- Executar os testes unitários da API (`npm run test` no backend).

### Manual Verification
- Acessar as páginas `/precos`, `/creditos` e `/convide-amigos` e validar visualmente as mensagens sobre o prazo de 2 meses.
- Testar o prompt do Rover perguntando sobre a validade dos créditos e checar se ele responde 2 meses.


---

# Importador de Usuários Externos (Jotform)

Substituir a integração anterior do Supabase pela integração direta com a API do Jotform. O administrador poderá selecionar um formulário ativo do Jotform, carregar todas as submissões, extrair dados do currículo e contatos dos estudantes, e analisar a importação comparando com a base local.

## Proposed Changes

### Backend Endpoints

#### [MODIFY] [env.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/config/env.ts)
- Adicionar `JOTFORM_API_KEY` (string opcional) ao schema de validação.

#### [MODIFY] [admin.routes.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/routes/admin.routes.ts)
- **`GET /api/admin/jotform/forms`**: Busca a lista de todos os formulários ativos do usuário no Jotform.
- **`GET /api/admin/jotform/submissions/:formId`**: Busca as submissões de um formulário específico no Jotform, varre as respostas (`answers`) dinamicamente para extrair Nome, E-mail, Telefone e links de arquivos (Currículos), e retorna uma lista limpa de contatos.

### Frontend Views

#### [MODIFY] [ImportadorUsuarios.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/admin/ImportadorUsuarios.tsx)
- Modificar o fluxo de conexão:
  - Campo para entrada opcional da Chave API do Jotform (usando a do backend como padrão).
  - Seletor de Formulário (combobox que lista os formulários ativos recuperados do Jotform).
  - Tabela com filtros locais de pesquisa, status local (se o e-mail já existe no banco local do Estagionauta) e link direto para download do currículo enviado no Jotform.
  - Painel de cópia de e-mails em lote ou exportação em formato JSON.

## Verification Plan

### Automated Verification
- Rodar `npm run build` na raiz do projeto e na pasta `api/` para verificar erros de build.

### Manual Verification
- Acessar `/admin/importador` como Administrador, inserir a chave de API do Jotform (ou usar a do `.env`), escolher o formulário desejado e validar que a listagem de candidatos e currículos carrega perfeitamente.

---

# 🖊️ Editor de Currículo Otimizado com Visualização Inline e Impressão Nativa

## Resumo do Objetivo
Adicionar suporte a edição manual de texto do currículo gerado por IA para que o usuário possa realizar ajustes finos em tempo real sem consumir novos créditos, utilizando um layout de coluna dupla (Edição Markdown / Preview A4), com persistência no banco de dados e impressão em PDF de alta qualidade via browser print.

## Decisões Confirmadas (Alinhadas com o Usuário)
- **Editor**: Editor de Markdown em Split Screen (lado a lado com o preview) para manter a compatibilidade direta com a estrutura de texto/markdown do banco de dados, sem o overhead de conversão do EditorJS.
- **Score/Checklist**: Removido do escopo por recomendação do usuário para evitar inconsistências com o módulo principal de "Análise de Currículo".
- **Impressão**: Impressão nativa do navegador (`window.print()`) utilizando estilos de mídia CSS `@media print` para ocultar os elementos de navegação e formatar o currículo em PDF vetorial/selecionável de alta definição.

## Alterações Propostas

### 1. Backend

#### [MODIFY] [generator.routes.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/routes/generator.routes.ts)
- **`PUT /api/generator/:id`**: Rota protegida por autenticação para salvar o conteúdo editado do currículo. Valida os campos `content` e `title` usando Zod e atualiza o registro na tabela `generated_resumes`.

### 2. Frontend

#### [MODIFY] [GeradorCurriculos.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/GeradorCurriculos.tsx)
- Adicionar estado `isEditingText` (boolean) e `editContent` (string) para gerenciar o modo de edição de texto.
- No modo de visualização (`currentView === "view"`), adicionar um botão **"Editar Texto"** na barra de ações.
- Quando o modo de edição estiver ativo:
  - Exibir layout de duas colunas:
    - **Esquerda**: Área de texto (`textarea` estilizada com fonte mono, bordas suaves, rolagem independente) pré-preenchida com o conteúdo markdown atual do currículo.
    - **Direita**: O preview A4 renderizando as edições em tempo real.
  - Na barra de ações superior, exibir os botões **"Salvar"** (chama o endpoint `PUT` no backend, salva as alterações localmente e desativa a edição) e **"Cancelar"** (descarta as edições locais).
- Adicionar um ID exclusivo ao container do currículo (`id="resume-print-area"`) para uso do CSS de impressão.
- Substituir o botão "Exportar PDF" por duas opções (ou adicionar uma nova):
  - **"Exportar PDF (Imagem)"**: A lógica existente com jsPDF para download imediato.
  - **"Imprimir PDF (Nativo/Texto)"**: Chama `window.print()` abrindo o painel do navegador para salvamento em alta definição selecionável.

#### [MODIFY] [index.css](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/index.css)
- Adicionar regras `@media print` personalizadas:
  - Ocultar `header`, `footer`, botões, modais, drawer e elementos não-currículo (`display: none !important`).
  - Isolar e redimensionar `#resume-print-area` para ocupar exatamente as dimensões físicas da folha A4 (`210mm` x `297mm`) com margens e fundo branco puro.

## Plano de Verificação

### Testes Manuais
1. Gerar ou selecionar um currículo salvo e clicar em **"Editar Texto"**.
2. Modificar algumas linhas de texto no painel esquerdo e verificar se o preview no painel direito atualiza instantaneamente.
3. Clicar em **"Cancelar"** e garantir que as alterações foram descartadas.
4. Clicar em **"Editar Texto"** de novo, fazer alterações, clicar em **"Salvar"** e validar a persistência após recarregar.
5. Clicar em **"Imprimir PDF"** e verificar se o diálogo de impressão exibe apenas a folha do currículo de forma limpa e com texto selecionável.

---

# FASE 2.9 — Rover Agencies Interaction Tools

## Resumo do Objetivo
Implementar um conjunto de ferramentas (Rover tools) que permitam ao assistente de IA Rover realizar ações relacionadas a agências de integração de estágio no banco de dados. Essas ações incluem: buscar agências por estado, cidade, tipo ou nome; ver detalhes e avaliações aprovadas de uma agência; enviar avaliações (com nota 1-5 e comentário de no mínimo 20 caracteres); e sugerir/cadastrar novas agências.

## Decisões Confirmadas
- **Escopo**: Foco estrito em buscar agências, exibir avaliações/comentários aprovados, enviar avaliações (pendentes de moderação) e cadastrar novas agências.
- **Segurança**: Uso rigoroso de `supabaseAdmin` no backend associando o `created_by` / `user_id` ao ID autenticado do usuário vindo da sessão (evitando spoofing).
- **Validações**: Zod nos inputs das rotas/tools e checagem de tamanho mínimo de 20 caracteres para avaliações.

## Alterações Propostas

### 1. Backend Tools

#### [NEW] [search_agencies.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/tools/search_agencies.ts)
- Ferramenta para buscar agências aprovadas.
- Parâmetros:
  - `query` (string, opcional): Busca por nome ou descrição.
  - `state` (string, opcional): Estado de 2 letras (ex: 'PE').
  - `city` (string, opcional): Nome da cidade (ex: 'Recife').
  - `agencyType` (string, opcional): Tipo de agência (faculdade, consultoria, agencia_privada, orgao_publico, instituto, fundacao, outro).

#### [NEW] [get_agency_details.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/tools/get_agency_details.ts)
- Ferramenta para recuperar detalhes e avaliações aprovadas de uma agência.
- Parâmetros:
  - `agencyId` (string, UUID): ID da agência.

#### [NEW] [submit_agency_review.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/tools/submit_agency_review.ts)
- Ferramenta para enviar uma avaliação de 1 a 5 estrelas com comentário.
- Valida se o usuário já avaliou a agência anteriormente (só permite uma avaliação por usuário/agência).
- Parâmetros:
  - `agencyId` (string, UUID): ID da agência.
  - `rating` (number): De 1 a 5.
  - `comment` (string): Comentário justificativo (mínimo 20, máximo 1000 caracteres).

#### [NEW] [create_agency.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/tools/create_agency.ts)
- Ferramenta para sugerir/cadastrar uma nova agência (inserção em estado 'pending').
- Parâmetros:
  - `name` (string): Nome da agência.
  - `description` (string): Descrição.
  - `email` (string): E-mail.
  - `phone` (string): Telefone.
  - `cep` (string, opcional): CEP.
  - `address` (string): Endereço completo.
  - `city` (string): Cidade.
  - `state` (string): Estado (2 letras).
  - `agencyType` (string): Tipo de agência.
  - `website` (string, opcional): Website.
  - `instagram` (string, opcional): Instagram.
  - `latitude` (number, opcional)
  - `longitude` (number, opcional)

#### [MODIFY] [registry.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/tools/registry.ts)
- Registrar as 4 novas tools na lista `roverTools` e no `switch/case` de `executeRoverTool`.

#### [MODIFY] [rover.routes.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/routes/rover.routes.ts)
- Atualizar a instrução do sistema (System Prompt) com as novas regras sobre quando chamar as ferramentas de agências.

## Plano de Verificação

### Testes Automatizados
- Criar testes unitários em `api/tests/rover_agencies_tools.spec.ts` cobrindo:
  - Execução bem-sucedida de `search_agencies` com filtros.
  - Execução de `get_agency_details` buscando dados e avaliações.
  - Envio de avaliação e bloqueio de avaliações duplicadas.
  - Criação de uma nova agência no estado 'pending'.

### Testes Manuais
- Iniciar chat com o Rover no painel e testar os seguintes comandos em português:
  1. "Busque agências em Recife"
  2. "Quais são as avaliações da agência X?"
  3. "Avalie a agência Y com nota 4 e comentário: Adorei o atendimento rápido e as vagas de estágio ofertadas."
  4. "Cadastre a agência Teste CIEE no endereço Rua das Flores 123"

---

# Remoção do Currículo Público e Simplificação de Identificadores

Este plano descreve a remoção completa do identificador do currículo público (`curriculo_slug`) e das páginas/modais associados a essa funcionalidade para simplificar o código, reduzir a complexidade e eliminar validações desnecessárias.

## User Review Required

> [!IMPORTANT]
> - **Exclusão de Páginas e Modais**: A página de visualização do perfil público (`src/pages/Curriculo.tsx`) e o modal de compartilhamento do currículo (`src/components/modals/ShareCurriculoModal.tsx`) serão deletados por completo.
> - **Remoção de Inputs de Perfil**: A seção e inputs relacionados a `curriculo_slug` serão removidos da página de perfil do usuário (`src/pages/Perfil.tsx`).
> - **Acesso ao Perfil de Outros Usuários**: Com a remoção da política baseada no `curriculo_slug`, os perfis de usuários não autenticados ou de terceiros serão protegidos de visualização de forma muito mais estrita, sendo acessíveis apenas ao próprio usuário e aos moderadores/administradores da plataforma.
> - **Preservação de Envio de Relatório de Análise por Email**: A funcionalidade de compartilhar o relatório de análise de currículo por e-mail (usando UUIDs/IDs das análises) em `ResultadoCurriculo.tsx` continuará operando normalmente. Para manter a compatibilidade com a assinatura da API `/api/email/send`, manteremos o campo `curriculo_slug` como opcional/nulo na API de e-mail e nos schemas.

## Proposed Changes

### Database Migration

#### [NEW] [20260604170000_remove_curriculo_slug.sql](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/supabase/migrations/20260604170000_remove_curriculo_slug.sql)
- Criar migração que remove o índice `idx_user_profiles_curriculo_slug` e a coluna `curriculo_slug` da tabela `public.user_profiles`.
- Atualizar a política RLS `"Users can view all profiles"` da tabela `public.user_profiles` para remover a verificação `curriculo_slug IS NOT NULL`, restringindo as permissões para:
  `auth.uid() = id OR public.is_admin_or_moderator(auth.uid())`.

### Frontend Pages & Routes

#### [DELETE] [Curriculo.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Curriculo.tsx)
- Excluir o arquivo da página de visualização do currículo público.

#### [DELETE] [ShareCurriculoModal.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/components/modals/ShareCurriculoModal.tsx)
- Excluir o modal de compartilhamento do currículo público.

#### [MODIFY] [route.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/route.ts)
- Remover o import lazy de `Curriculo` (linha 30).
- Remover a rota `{ path: "/curriculo/:slug", component: Curriculo }` (linha 163).

#### [MODIFY] [Perfil.tsx](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/src/pages/Perfil.tsx)
- Remover os estados `slug`, `slugStatus`, `slugError` e seus efeitos/funções de verificação (`checkSlug`, `suggestSlug`).
- Remover a seção HTML/JSX de "Identificador do Currículo Público" (linhas 349-383).
- Remover o campo `curriculo_slug` da lógica de comparação de alterações (`isDirty`) e do payload de salvamento (`supabase.update`).
- Simplificar o botão "Salvar Alterações" removendo as validações relativas ao estado do slug.
### Backend Services & Tools

#### [MODIFY] [check_profile.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/tools/check_profile.ts)
- Remover a checagem de `curriculo_slug` da ferramenta do Rover que analisa o preenchimento do perfil.
#### [MODIFY] [rover.routes.ts](file:///c:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/api/src/routes/rover.routes.ts)
- Atualizar o System Prompt (`systemPrompt`) para instruir o Rover a responder com tom de conversa natural, empático e adequado para estudantes universitários brasileiros. Incluir regras explícitas para lidar com expressões informais ("top da bagaceira", "massa", etc.) e gírias de forma adaptativa.
- Ajustar as diretrizes de execução para que, quando uma ferramenta (como `submit_agency_review`) for executada com sucesso, o Rover formule uma mensagem natural de confirmação (ex: "Prontinho! Acabei de enviar...") em vez de respostas robóticas ou templates.
- Implementar um mecanismo de contingência conversacional: caso a chamada de completação (após loops de ferramenta) retorne conteúdo vazio (`content: null` ou `""`) e sem novas `tool_calls`, disparar uma chamada de backup para o Groq/OpenAI sem a definição de ferramentas (`tools: undefined`). Isso forçará o modelo a responder textualmente à conversa, eliminando o reset repentino para o menu/prompt de boas-vindas.
- Caso ocorra algum erro persistente ou resposta em branco no backup, retornar uma mensagem de erro conversacional amigável: "Entendi o seu pedido, mas não consegui formular uma resposta específica no momento. Como posso te ajudar?" em vez do menu de boas-vindas padrão.

## Verification Plan

### Automated Tests
- Rodar `npm run build` na raiz do projeto para atestar a correção de types e compilação do frontend.
- Rodar `npm run build` na pasta `api/` para atestar a compilação do backend hono.
- Executar os testes unitários e de integração do backend: `npm run test` na pasta `api/` (garantindo que todas as 53 specs do Vitest passem sem erros).

### Manual Verification
- Acessar a página de `/perfil` logado e verificar que a seção de "Identificador do Currículo Público" não é mais exibida e que a edição de perfil continua salvando os demais campos com sucesso.
- Acessar a página `/analise/:id` e clicar em compartilhar a análise de currículo por e-mail para verificar se o envio de e-mail via Brevo continua funcionando normalmente.
- Testar no chat do Rover com o usuário `mccartney.shalom@gmail.com` as seguintes interações:
  1. Perguntar "Procure agências em Recife" e verificar se ele exibe a lista com tom de voz natural e amigável.
  2. Dizer "atualize avalie o CIEE Pernambuco com 5 estrelas de que eles são top da bagaceira" e verificar se o Rover chama `submit_agency_review` com sucesso, exibe uma mensagem calorosa e natural de confirmação, e NÃO reseta para o menu de boas-vindas.
  3. Enviar gírias de teste e verificar se ele responde de forma adaptativa e inteligente, sem recusar a interação por questões de sensibilidade de gírias.


