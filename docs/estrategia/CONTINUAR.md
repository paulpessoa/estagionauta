# Como continuar (prompt de retomada)

Estado em 21/10/2026, sessão noturna. Copie o prompt abaixo numa nova sessão do Claude Code
(com os repositórios `paulpessoa/estagionauta` e `paulpessoa/estagionauta-mcp`).

## Branches e PRs desta rodada

| Repo | Branch | Conteúdo |
|---|---|---|
| estagionauta | `claude/fervent-allen-eqpt5j` | `docs/estrategia/`: plano de negócios, plano de marketing, revisão de produto + extensão, este arquivo |
| estagionauta | `claude/agencias-validacao-uf` | `data/agencias/<UF>.json` (listas de referência), `_METODO.md`, scripts `export-for-review`, `apply-review`, `reconcile-reference` |
| estagionauta-mcp | `claude/fervent-allen-eqpt5j` | Corrige a URL da API: saiu do Cloud Run (403) para o Render. **Confirmar o hostname do Render antes do merge.** |

## Limitações encontradas

- O container da nuvem **não acessa** Supabase, Render nem o site (rede restrita). O WebFetch também falhou (DNS). Só o WebSearch funcionou.
- O WebSearch tem cota de cerca de 200 buscas por turno, compartilhada entre os agentes, e dá `too_many_requests` com buscas paralelas. Por isso a pesquisa roda em ondas de até 7 agentes, com buscas sequenciais.
- Sem acesso ao banco, a revisão "registro a registro" depende do export: rode localmente
  `cd api && node scripts/agencies/export-for-review.mjs` e commite `data/agencias/db/*.json` no branch `claude/agencias-validacao-uf`.

## Prompt de retomada

```
Continue o trabalho do Estagionauta da sessão anterior. Leia primeiro:
- docs/estrategia/CONTINUAR.md (branch claude/fervent-allen-eqpt5j)
- data/agencias/_METODO.md e api/scripts/agencies/README.md (branch claude/agencias-validacao-uf)

Objetivo 1, revisão das agências por UF, partindo da base cadastrada:
- Se existir data/agencias/db/<UF>.json (export do banco), crie 1 agente por UF (modelo sonnet,
  no máximo 7 por vez, buscas WebSearch sequenciais, sem Gemini nem APIs pagas). Cada agente
  revisa CADA registro e escreve data/agencias/review/<UF>.json com manter/atualizar/rejeitar/revisar_humano,
  completando WhatsApp, Instagram, site, e-mail e logo quando houver fonte. Também adiciona em "novas"
  as agências da lista de referência <UF>.json que faltam no banco.
- Se não existir o export, complete as listas de referência data/agencias/<UF>.json
  (as UFs marcadas como pendentes na tabela abaixo).
- Prioridade: PE (garantir ABRE Recife e NUDEP, @nudepestagios, atendimento por WhatsApp), depois SP, RJ, MG, BA, RS, PR.
- Commite em pedaços pequenos (1 commit por onda) no branch claude/agencias-validacao-uf.

Objetivo 2, produto: siga a "Ordem de execução" em docs/estrategia/revisao-de-produto.html,
um PR pequeno por item (ex.: apagar src/pages/MapaAgencias.tsx, que não tem rota).

Não aplique nada no banco: o Paul roda apply-review.mjs localmente (dry-run primeiro).
```

## Progresso das listas de referência (`data/agencias/<UF>.json`)

Todas as 27 UFs têm lista. Entradas (confirmadas) após a rodada indicada.

| Rodada | UFs | Entradas (confirmadas) |
|---|---|---|
| 2 (completada) | PE 16 (4) · SP 26 (3) · RJ 19 (2) · MG 14 (3) · BA 17 (2) · RS 20 (4) · PR 22 (14) | PE: NUDEP confirmado, ABRE Recife provável (existe como "Recife Mercado de Trabalho e Serviços Administrativos Ltda", sem contatos) |
| 1 (Norte, nova) | AC 7 (1) · AM 4 (1) · AP 9 (1) · PA 6 (1) · RO 7 (1) · RR 8 (1) · TO 7 (2) | falta contato quase em todas |
| 1 (parcial, ainda para a rodada 2) | SC 7 (0) · CE 7 (2) · DF 5 (3) · GO 5 (2) · ES 5 (3) · MA 5 (1) · PI 6 (1) · RN 3 (0) · PB 12 (3) · AL 4 (0) · SE 3 (1) · MT 7 (0) · MS 3 (0) | próxima onda |

Pendências conhecidas: WhatsApp do NUDEP; extrair a lista inteira do PDF de agentes conveniados da UFPE; conferir por telefone o endereço do CIEE Curitiba e do CIEE SP (Tabapuã 445 vs 540); validar URL/telefone do portal Imap (Curitiba).
Contatos vindos de Reclame Aqui, diretórios ou imprensa estão marcados nas `notas` de cada JSON e precisam de checagem humana.
