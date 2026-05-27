# AGENTS.md — Estagionauta

Behavioral guidelines for AI coding agents working on this project.
Merge with tool-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create dead code, clean it up. When they don't, leave it alone.

## 4. Goal-Driven Execution

**Define success criteria first. Write tests. Verify.**

Before coding:
- State what "done" looks like in measurable terms.
- Write the test first when practical.
- After implementing, verify against your criteria.

---

## Project Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + TypeScript + Tailwind CSS + Shadcn/UI |
| Backend | Hono.js + TypeScript (in `/api`) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (OTP / Magic Link / OAuth) |
| Payments | Stripe (Checkout + Webhooks) |
| AI | OpenAI GPT-4 (server-side only) |
| Email | Brevo (server-side only) |
| Deploy | Vercel (frontend) + Railway (backend) |

## Monorepo Structure

```
estagionauta/
├── src/          ← Frontend (Vite + React)
├── api/          ← Backend (Hono.js)
├── shared/       ← Shared types between frontend & backend
├── supabase/     ← Migrations & config
└── DESIGN.md     ← Visual design system
```

## Security Rules (CRITICAL)

1. **Never expose secrets in the frontend**
   - No `VITE_` prefix for: OpenAI key, Stripe secret key, Supabase service role key
   - These MUST only exist in the backend (`api/`) environment

2. **All business logic on the backend**
   - Credit management → backend only
   - Payment processing → backend only (price defined server-side)
   - AI calls → backend only
   - Email sending → backend only

3. **Input validation everywhere**
   - Use Zod schemas for all API inputs
   - Validate on both frontend (UX) and backend (security)

4. **Supabase RLS**
   - Every table MUST have Row Level Security enabled
   - Never use `USING (true)` on sensitive tables
   - `add_credits` RPC must only accept calls from service role

5. **CORS**
   - Backend must restrict CORS to `https://estagionauta.com.br` and `http://localhost:5173`
   - Never use `Access-Control-Allow-Origin: *` in production

## Code Conventions

- **Language**: Portuguese for user-facing content, English for code (variables, functions, comments)
- **Components**: Functional components with hooks, no class components
- **State**: React Query for server state, React state for UI state
- **Styling**: Tailwind CSS utilities + Shadcn/UI components
- **Types**: Strict TypeScript — no `any`, prefer explicit types
- **Imports**: Absolute imports via `@/` alias
- **Files**: kebab-case for files, PascalCase for components, camelCase for functions/variables

## What NOT to do

- Don't call Supabase RPC for credits from the frontend
- Don't hardcode API keys or URLs in source files
- Don't create duplicate Supabase clients
- Don't add dependencies without justification
- Don't write code that only works in development (e.g., `localhost` URLs without env vars)

---

## Active Plan, Progress & Learnings

This section is automatically loaded into the agent's context via system rules. Keep it updated to preserve project memory and save context tokens.

### 1. Active Implementation Plan Summary
- **Goal**: Refactor Estagionauta into a monorepo (`/src` frontend, `/api` Hono.js backend, `/shared/types` shared types, `/supabase` migrations).
- **Security Principles**: No `VITE_` secrets on frontend, credit management and AI calls strictly backend, Supabase RLS enabled on all tables, revoking execution on sensitive database RPCs (e.g. `add_credits`).
- **Detailed Documents**:
  - Full specs in [implementation_plan.md](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/implementation_plan.md)
  - Detailed task progress in [task.md](file:///C:/Users/paulm/OneDrive/Ambiente%20de%20Trabalho/PROJETOS/estagionauta/task.md)

### 2. Status Checklist
- [x] **FASE 0: Preparar Beta**: Renomear Kanban para Candidaturas, esconder afiliados, simplificar preços, habilitar PIX no Stripe, créditos de boas-vindas para 5, logs de email no admin.
- [/] **FASE 1: Monetização Robusta**: Validade de créditos (6 meses, FIFO), Stripe price IDs novos, Referral básico.
- [ ] **FASE 2: Copilot WebAgent MVP**: Hono copilot routes, registry, tools (calculadora, currículo, perfil, créditos), DRAWER frontend, logs de abusos e rate limiting.
- [ ] **FASE 3: Avaliações + Recompensas**: Moderação de agências, avaliações e recompensas.
- [ ] **FASE 4: Testes & CI/CD**: Testes automatizados e estabilidade.

### 3. Log of Learnings & Configuration
- **Credits & Quota Checks in Antigravity**:
  - In the IDE: Check model credits via **Settings (gear icon) → Models** (where "AI Credit Overages" settings reside).
  - In the IDE UI: Look at the status bar at the bottom.
  - Command Line: Use the `fuelcheck` tool or install `antigravity-usage` to inspect remaining quotas.
- **Project Configuration**:
  - Frontend env vars: Configured via `.env` in the root (do not commit to Git).
  - Backend env vars: Configured via `api/.env` (based on `api/.env.example`).
  - Shared types: Extracted to `/shared/types` to avoid type duplication and keep frontend and backend in sync.
  - CORS Local Setup: Hono backend API must explicitly allow `http://localhost:8080` in development since the Vite frontend is configured on that port. Without it, local browser e2e testing will face CORS errors on credits/simulator endpoints.
  - Credit RPC Validation: The `consume_credits` RPC takes `user_uuid`, `amount`, and `description` parameters. The new `tests/simulator.spec.ts` successfully logs in, starts an interview (consuming 1 credit), and asserts that the credit decrement is exact.
- **Git Commit Workflow**:
  - Every time we finish a task/phase, we stage files (`git add`), verify diffs, commit, and document the changes here.

