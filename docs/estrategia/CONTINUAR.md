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

Rodada 1: 20 UFs com pesquisa parcial (cerca de 8 buscas cada, por causa da cota). As rodadas seguintes completam a lista.

| UF | Rodada 1 | Pendente |
|---|---|---|
| AC, AM, AP, PA, RO, RR, TO | não iniciada | lista inteira |
| AL, BA, CE, DF, ES, GO, MA, MG, MS, MT, PB, PE, PI, PR, RJ, RN, RS, SC, SE, SP | parcial | agências privadas, centrais das universidades, iniciativas de Instagram/WhatsApp, contatos |

Atualize esta tabela a cada onda.
