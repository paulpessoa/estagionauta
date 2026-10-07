# E-mail (Brevo)

Envio de e-mails transacionais da API (`api/src/routes/email.routes.ts`, `api/src/tools/invite_friend.ts`, `api/src/routes/admin.routes.ts`). Este documento substitui os antigos `README_EMAIL_CONFIGURATION`, `README_EMAIL_FINAL_SETUP`, `README_EMAIL_VERIFICATION` e `BREVO_DOMAIN_SETUP`, que descreviam uma Edge Function e remetentes que não existem mais.

## Como funciona

- **Remetente:** `Estagionauta <BREVO_SENDER_EMAIL>`. O padrão é `contato@estagionauta.com.br` (`api/src/config/env.ts`).
- **Compartilhar currículo** (`POST /api/email/send`, exige login):
  - só o dono do currículo pode enviar (`profile.id` precisa ser o usuário logado), senão 403;
  - no máximo 5 destinatários por envio, enviados um a um;
  - `Reply-To` e `CC` são o e-mail do usuário, para que ele receba a cópia e as respostas;
  - sem `BREVO_API_KEY` a rota responde 503.
- **Logs:** cada envio grava uma linha em `email_logs` (`status` `sent`/`failed`/`pending`, `provider_id` do Brevo, `error_message`). A página `/email-logs` lista, filtra por status, data e busca, e exporta CSV.

## Configuração no Brevo

1. Em **Settings > Senders, Domains & Dedicated IPs**, verifique o domínio `estagionauta.com.br` (ou ao menos o remetente de `BREVO_SENDER_EMAIL`).
2. Configure no DNS o SPF (`v=spf1 include:spf.brevo.com ~all`) e o DKIM indicado pelo Brevo. Sem isso o e-mail sai por `brevosend.com` e cai em spam.
3. Defina `BREVO_API_KEY` e, se quiser outro remetente, `BREVO_SENDER_EMAIL` no ambiente da API (Cloud Run).
4. Os templates transacionais do Brevo (por exemplo "Estagionauta — Pedido de feedback", id 6) têm remetente próprio: confira que usam o domínio verificado, não um Gmail.

O plano gratuito permite 300 e-mails por dia e não tem relatórios avançados.

## Verificar um envio

- **Na plataforma:** `/email-logs`, ou o status mostrado no modal de compartilhamento.
- **No Brevo:** **Transactional > Logs**, buscando pelo `provider_id` ou pelo destinatário.
- **No banco:**

```sql
SELECT to_email, subject, status, created_at, sent_at, error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;

SELECT status, COUNT(*) AS total
FROM email_logs
GROUP BY status;
```

## Problemas comuns

| Sintoma | O que checar |
| --- | --- |
| E-mail não chega | Domínio verificado, SPF/DKIM, pasta de spam, limite diário de 300 |
| Remetente aparece como `brevosend.com` | Domínio/remetente não verificado no Brevo |
| 403 ao compartilhar | Usuário logado não é o dono do currículo |
| 503 ao compartilhar | `BREVO_API_KEY` ausente no ambiente |
| `/email-logs` vazia | Erros `Error saving email log to DB` no log da API; confira as colunas de `email_logs` |
