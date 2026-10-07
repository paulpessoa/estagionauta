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
