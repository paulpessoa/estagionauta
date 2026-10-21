# Pipeline de agências por região

Varre o Google Maps, classifica, enriquece contatos e grava no Supabase. Tudo roda de `api/` (precisa de `api/.env`).
Saídas ficam em `output-<região>/` (ignoradas pelo Git).

## Passos (exemplo Centro-Oeste)

```bash
cd api
D=scripts/agencies/output-centro-oeste; mkdir -p $D
(cd $D && node ../run/sweep-centro-oeste.mjs ../../../.env raw.json)   # varredura Google Places
STATES=GO,MT,MS node scripts/agencies/run/backup.mjs $D                # backup das linhas atuais da região
STATES=GO,MT,MS bash scripts/agencies/run/region.sh $D                 # lookup, classify, siteinfo, plan, enrich2
# revise $D/plan.json (contagens por status) antes de gravar
node scripts/agencies/run/apply.mjs $D                                 # grava no Supabase
node scripts/agencies/run/retry.mjs $D                                 # reaplica só o que falhou (rede)
```

Regiões (STATES): Sul PR,SC,RS · Sudeste ES,MG,RJ,SP · Nordeste AL,BA,CE,DF,MA,PB,PE,PI,RN,SE · Norte AC,AM,AP,PA,RO,RR,TO · Centro-Oeste GO,MT,MS.

## Regras
- Rejeitar nunca apaga: só muda `status` para `rejected` (reversível).
- Estado vem do endereço do Google, não da busca.
- `apply.mjs` também zera `logo_url` que contenha `key=`.

## Revisão registro a registro (sem APIs pagas)

Fluxo para revisar **cada agência já cadastrada**, remover as falsas/inexistentes e completar contatos
(WhatsApp, Instagram, site, e-mail, logo). Detalhes do formato em [`data/agencias/_METODO.md`](../../../data/agencias/_METODO.md).

```bash
cd api
node scripts/agencies/export-for-review.mjs PE,PB      # 1. exporta a base atual → data/agencias/db/<UF>.json (commitar)
# 2. agentes revisam cada registro via busca pública → data/agencias/review/<UF>.json
node scripts/agencies/apply-review.mjs PE              # 3. dry run: mostra o que mudaria
node scripts/agencies/apply-review.mjs PE --apply      # 4. grava (faz backup antes em output-review/)
node scripts/agencies/reconcile-reference.mjs PE       # opcional: compara com a lista de referência data/agencias/<UF>.json
```

- `rejeitar` não apaga: muda `status` para `rejected` (reversível).
- `atualizar` só preenche/corrige campos com evidência; nunca apaga um valor existente.
- `revisar_humano` não altera nada.
