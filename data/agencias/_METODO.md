# Método de validação de agências por UF

Cada UF tem um arquivo `<UF>.json` gerado por um agente de pesquisa usando **apenas consultas públicas**
(busca web). Nenhuma API paga (Gemini, Google Places etc.) foi usada. Estes arquivos são a
**lista de referência**: o script `api/scripts/agencies/reconcile-reference.mjs` compara essa lista com a
tabela `agencies` do Supabase e aponta o que falta, o que diverge e o que está duvidoso — **sem gravar nada**.

## O que conta como "agência" no Estagionauta

Qualquer organização que **ajuda estudantes a conseguir estágio** e atende o público da UF:

- Agentes de integração (Lei 11.788/2008): CIEE, IEL, NUBE, Super Estágios, ISBET, Mudes, Abre, CEE, Agiel etc. — **só a unidade física ou o atendimento oficial dentro da UF**.
- Agências privadas / consultorias regionais de estágio.
- Centrais / coordenações de estágio de universidades **que atendem estudantes** (públicas e privadas grandes).
- Órgãos públicos com programa de estágio próprio relevante (ex.: secretarias de administração estaduais, TJ, MP) — só se tiverem canal de atendimento.
- **Iniciativas sem endereço físico** (atendimento por WhatsApp, Instagram, online) que atendem muita gente na UF — ex.: NUDEP (Recife). Use `atendimento: "whatsapp"` ou `"online"` e `address: null`.

## Formato do arquivo `<UF>.json`

```json
{
  "uf": "PE",
  "estado": "Pernambuco",
  "validado_em": "2026-10-21",
  "metodo": "WebSearch público (sem APIs pagas)",
  "agencias": [
    {
      "name": "CIEE Pernambuco",
      "agency_type": "instituto",
      "rede_nacional": "CIEE",
      "city": "Recife",
      "address": "Rua ..., nº, bairro, Recife - PE, CEP",
      "atendimento": "presencial",
      "phone": "(81) 0000-0000",
      "whatsapp": null,
      "email": null,
      "website": "https://...",
      "instagram": "@...",
      "status_validacao": "confirmada",
      "evidencias": ["https://fonte1", "https://fonte2"],
      "observacoes": "texto curto"
    }
  ],
  "descartadas": [{ "name": "...", "motivo": "fechou / outro estado / não é de estágio" }],
  "notas": "lacunas e o que precisa de checagem humana"
}
```

Campos:

- `agency_type`: `instituto` (agente de integração sem fins lucrativos), `agencia_privada`, `consultoria`, `faculdade`, `orgao_publico`, `fundacao`, `outro`.
- `atendimento`: `presencial` | `online` | `whatsapp` | `misto`.
- `status_validacao`:
  - `confirmada` — 2+ fontes independentes OU site oficial atual mostrando a unidade/contato.
  - `provavel` — 1 fonte crível, recente.
  - `nao_confirmada` — citada mas sem prova atual (pode ter fechado). Precisa de humano.
- **Nunca invente** telefone, e-mail, endereço ou Instagram. Se não apareceu em fonte, use `null`.

## Regras

1. Estado da agência = onde ela atende, não onde fica a sede nacional.
2. Uma entrada por unidade relevante (capital + polos do interior com atendimento próprio).
3. Rede nacional sem unidade na UF → não entra (ou entra em `descartadas` com o motivo).
4. Rejeitar nunca apaga no banco: o reconcile só sugere; a decisão é humana.
