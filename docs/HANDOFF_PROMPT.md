# Prompt de continuação (cole no seu agente/IDE local)

> Repositórios: `paulpessoa/estagionauta` e `paulpessoa/estagionauta-mcp`, branch `ccr-2232d10f-ye9wjg` nos dois.
> Faça `git fetch && git checkout ccr-2232d10f-ye9wjg` antes de começar.

---

Você vai continuar o trabalho no Estagionauta (SaaS para estudantes de estágio: Vite + React + TS no front, Hono.js em `api/`, Supabase, MCP em Cloudflare Workers no repo `estagionauta-mcp`). Siga o `AGENTS.md` (mudanças cirúrgicas, simplicidade e verificar antes de concluir).

## 1. Primeiro valide o que já foi feito

Rode e confirme que tudo passa:

```bash
# estagionauta
npm ci && npm run lint && npm run typecheck && npm run build
cd api && npm ci && npm run build && npm test   # precisa das variáveis do api/.env.example (ver .github/workflows/ci.yml)

# estagionauta-mcp
npm ci --legacy-peer-deps && npm run build && npm test   # 8 testes
```

Commits desta sessão (revise o diff de cada um):

**estagionauta**
1. `fix: broken admin feedback reply, jotform feedback route and agency map ordering`
   - `ModeracaoAgencias.tsx`: `apiClient(...)` era chamado como função e a rota estava sem `/api`. Agora usa `apiClient.post('/api/admin/reply-email')`.
   - `Feedback.tsx`: rota corrigida para `/api/admin/feedback-jotform`.
   - `MapaAgencias.tsx`: um `useEffect` usava `filteredAgencies` antes da declaração.
   - Chave do Google Maps tirada do código. A API avisa no log se `BYOK_ENCRYPTION_KEY` for a chave padrão em produção.
2. `chore: regenerate Supabase types, capture schema drift, typecheck in CI`
   - Migration `supabase/migrations/20260524235900_sync_schema_drift.sql`, idempotente: `app_role`, `app_permission`, `user_roles`, `role_permissions`, `feedbacks` (+ colunas `status`/`source`). Esses objetos existiam em produção, mas não nas migrations.
   - `src/integrations/supabase/types.ts` regenerado a partir das migrations (Postgres local + postgres-meta).
   - `EmailLogs.tsx` filtrava por `profile_id`, coluna que não existe. Corrigido.
   - Removidos `AgencyFilters.tsx` e `GoogleMap.tsx`, que não eram usados.
   - Script `npm run typecheck` e step no CI.
   - `api/scripts/rotate_byok_key.cjs`: re-cifra as chaves BYOK (simula por padrão; `--apply` grava).
3. `feat: campaign links with auto-redeemed coupons and funnel events`
   - `src/lib/campaign.ts`: lê `?cupom=` e `?utm_source=`, guarda no localStorage e resgata via `/api/credits/redeem` depois do login. Marca a sessão no Clarity com `canal` e emite os eventos `cadastro_concluido`, `analise_curriculo_concluida`, `simulacao_iniciada` e `cupom_resgatado`.
   - **Ainda não testado com Supabase real:** validar o resgate automático logando com `?cupom=UFPE15`.
4. `docs: Recife outreach kit, campaign coupons and updated plan`
   - Migration `20261006000000_seed_recife_campaign_coupons.sql`: 12 cupons de 15 créditos, válidos até 31/12/2026.
   - `docs/DIVULGACAO_RECIFE.md` (links, mensagens, roteiro da oficina, SQL de acompanhamento) e `docs/PLANO_PROXIMOS_PASSOS.html`.

**estagionauta-mcp**
1. `ci: add PR build/test workflow and tool tests`: vitest em `test/tools.test.ts`, `.github/workflows/ci.yml` e teste antes do deploy.
2. `feat: accept auth token from the MCP connection`: as tools autenticadas usam o header `Authorization` (Worker) ou `ESTAGIONAUTA_TOKEN` (stdio) quando o argumento `token` não vem. O argumento continua funcionando.

## 2. Ações manuais (produção — só o Paul)

- [ ] Ver no Cloud Run se `BYOK_ENCRYPTION_KEY` está definida. Se não estiver, gerar uma chave nova e rodar `OLD_BYOK_KEY=<padrão do .env.example> NEW_BYOK_KEY=<nova> node api/scripts/rotate_byok_key.cjs`. Conferir a simulação, rodar com `--apply` e atualizar a variável no Cloud Run logo em seguida.
- [ ] Trocar a chave do Google Maps (a antiga continua no histórico do git), restringir ao domínio `estagionauta.com.br/*`, atualizar na Vercel e revogar a antiga.
- [ ] Fazer o merge da branch e rodar `supabase db push --include-all`. A migration de correção tem data anterior às já aplicadas.
- [ ] Verificar o domínio no Brevo e trocar o remetente do template "Estagionauta — Pedido de feedback" (id 6), que hoje usa o Gmail.

## 3. Próximas tarefas de código (em ordem)

1. **Validar o fluxo de campanha** em staging: abrir `/?cupom=UFPE15&utm_source=ufpe`, cadastrar, logar e conferir o crédito e o toast. Se `/api/credits/redeem` não respeitar `max_uses`/`expires_at`, corrigir a função `redeem` no backend.
2. **MCP com OAuth**: substituir o JWT manual por OAuth (`@cloudflare/workers-oauth-provider` com Supabase Auth), para funcionar como conector no claude.ai. Manter compatibilidade com o header e escrever testes.
3. **Bundle**: a página `ResultadoCurriculo` carrega o chunk `vendor-jspdf` de forma estática. Trocar os imports de `jspdf`/`html2canvas` por `import()` dinâmico dentro de `handleDownloadPDF` e revisar `manualChunks` em `vite.config.ts`. Conferir no build que o chunk da página não importa mais `vendor-jspdf` de forma estática. (Tentei isso na sessão, mas o `manualChunks` ainda deixava um import estático; descartei.)
4. **28 warnings de `react-hooks/exhaustive-deps`**: envolver os fetchers em `useCallback` ou migrar para React Query, um arquivo por commit, testando cada página.
5. **Docs**: mover `task.md` e `implementation_plan.md` para `docs/` e unificar os READMEs de e-mail.
6. `src/components/ui/curriculum-pdf.tsx` parece não ser usado. Confirmar e remover.

## 4. Divulgação (não é código)

Cronograma de 6 semanas na Google Agenda (segundas às 9h, de 12/10 a 16/11). Base de contatos no Notion: "Estagionauta — Divulgação RMR". Metas: 100 cadastros, 40 primeiras análises e 15 entrevistas de feedback.
