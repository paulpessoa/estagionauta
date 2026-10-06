# Kit de divulgação — Região Metropolitana do Recife

Plano completo: [`PLANO_PROXIMOS_PASSOS.html`](./PLANO_PROXIMOS_PASSOS.html).
Cupons: migration `supabase/migrations/20261006000000_seed_recife_campaign_coupons.sql` (15 créditos, válidos até 31/12/2026).

## 1. Links por canal

Quem abre o link e depois entra na conta ganha o cupom **automaticamente** (ver `src/lib/campaign.ts`). A sessão do Clarity fica marcada com o `canal`.

| Canal | Link |
|---|---|
| UFPE | `https://estagionauta.com.br/?cupom=UFPE15&utm_source=ufpe` |
| UFRPE | `https://estagionauta.com.br/?cupom=UFRPE15&utm_source=ufrpe` |
| UPE | `https://estagionauta.com.br/?cupom=UPE15&utm_source=upe` |
| UNICAP | `https://estagionauta.com.br/?cupom=UNICAP15&utm_source=unicap` |
| IFPE | `https://estagionauta.com.br/?cupom=IFPE15&utm_source=ifpe` |
| CESAR School | `https://estagionauta.com.br/?cupom=CESAR15&utm_source=cesar` |
| UNINASSAU | `https://estagionauta.com.br/?cupom=NASSAU15&utm_source=uninassau` |
| Porto Digital / meetups | `https://estagionauta.com.br/?cupom=PORTO15&utm_source=porto` |
| Oficinas presenciais (QR code) | `https://estagionauta.com.br/?cupom=OFICINA15&utm_source=oficina` |
| Grupos de vagas (WhatsApp/Telegram) | `https://estagionauta.com.br/?cupom=VAGASPE15&utm_source=grupos` |
| Instagram/TikTok (link na bio) | `https://estagionauta.com.br/?cupom=INSTA15&utm_source=instagram` |
| Agências integradoras | `https://estagionauta.com.br/?cupom=AGENCIA15&utm_source=agencias` |

> Dica: encurte cada link (ex.: bit.ly/estagionauta-ufpe) e gere um QR code para os slides da oficina.

## 2. Mensagens prontas

### 2.1 Para centro acadêmico / empresa júnior (WhatsApp ou Instagram)

> Oi, pessoal do [CA/EJ]! Sou o Paul, criador do **Estagionauta**, uma plataforma recifense e gratuita para ajudar estudantes a conseguir estágio: análise de currículo com IA, simulador de entrevista e calculadora de recesso.
>
> Queria oferecer uma **oficina gratuita de 40 min** para os estudantes de [curso]: "Currículo de estágio que passa no filtro". É prática, cada um sai com o currículo revisado e ganha 15 créditos na plataforma.
>
> Pode ser presencial ou online, no horário que for melhor para vocês. Topam conversar?

### 2.2 Para coordenação de estágio (e-mail)

**Assunto:** Ferramenta gratuita para estagiários: calculadora de recesso (Lei 11.788)

> Olá, [nome],
>
> Sou Paul Pessoa, de Recife, e desenvolvi o Estagionauta para ajudar estudantes na busca e na gestão do estágio.
>
> Uma das ferramentas, a **Calculadora de Recesso**, é gratuita e não exige cadastro: o estudante informa a data de início e a bolsa e vê quantos dias de recesso tem direito, conforme a Lei do Estágio. Achei que poderia ajudar a coordenação a responder uma dúvida que aparece muito.
>
> Link: https://estagionauta.com.br/calculadora?utm_source=coordenacao
>
> Se fizer sentido, posso também oferecer uma oficina gratuita de currículo para as turmas. Fico à disposição.
>
> Abraço,
> Paul

### 2.3 Para grupos de vagas (post semanal — conteúdo antes do link)

> 📄 **3 erros que vi em currículos de estágio esta semana**
> 1. Objetivo genérico ("busco oportunidade de crescimento") → diga a área e o tipo de estágio.
> 2. Projetos da faculdade escondidos no fim → para quem não tem experiência, projeto **é** experiência.
> 3. Currículo de 3 páginas → estágio pede 1 página.
>
> Quer uma análise do seu com IA, de graça? 15 créditos com este link:
> https://estagionauta.com.br/?cupom=VAGASPE15&utm_source=grupos

### 2.4 Para agência integradora

> Olá, equipe [agência]! O perfil de vocês já aparece no Estagionauta, um mapa de agências de estágio com avaliações de estudantes da RMR.
>
> Vocês podem **assumir o perfil** para atualizar contatos e responder avaliações, sem custo. Em troca, pedimos só que divulguem a plataforma aos candidatos: eles ganham 15 créditos para revisar o currículo antes de se candidatar às suas vagas.
>
> Link para candidatos: https://estagionauta.com.br/?cupom=AGENCIA15&utm_source=agencias

### 2.5 Pedido de feedback (enviar 3 dias após o cadastro)

> Oi, [nome]! Vi que você testou o Estagionauta 🚀 Topa me responder 3 perguntas rápidas? (leva 1 min)
> 1. O que você foi fazer lá primeiro?
> 2. O que mais ajudou e o que atrapalhou?
> 3. Você indicaria a um colega? Por quê?
>
> Se quiser, posso marcar 15 min de conversa — te dou mais 10 créditos como agradecimento.

## 3. Roteiro da oficina (40 min)

| Min | Bloco |
|---|---|
| 0–5 | Quem sou eu + por que o estágio é difícil de conseguir (dados rápidos) |
| 5–15 | Os 5 erros mais comuns em currículo de estágio (exemplos reais, anonimizados) |
| 15–30 | Mão na massa: todo mundo abre o QR code (`OFICINA15`), sobe o currículo e lê a análise |
| 30–37 | 2 voluntários mostram o antes e depois; dúvidas |
| 37–40 | Calculadora de recesso + simulador de entrevista; pedir feedback |

Leve: QR code grande no slide, 2 currículos de exemplo para quem não trouxe, lista para coletar e-mails de quem quer ser entrevistado.

## 4. Acompanhar resultados

Cadastros e resgates por canal (SQL Editor do Supabase):

```sql
select c.code,
       count(r.id)                                   as resgates,
       count(r.id) filter (where r.redeemed_at > now() - interval '7 days') as ultimos_7_dias
from coupons c
left join coupon_redemptions r on r.coupon_code = c.code
where c.code like '%15'
group by c.code
order by resgates desc;
```

No Clarity: **Filtros → Tags personalizadas → canal** e **Eventos inteligentes**: `cadastro_concluido`, `analise_curriculo_concluida`, `simulacao_iniciada`, `cupom_resgatado`.
