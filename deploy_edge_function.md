# Deploy da Edge Function para Envio de Emails

## 1. Instalar Supabase CLI (se não tiver)

```bash
npm install -g supabase
```

## 2. Fazer Login no Supabase

```bash
supabase login
```

## 3. Linkar o Projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

## 4. Configurar Variáveis de Ambiente

No Supabase Dashboard:
1. Vá em Settings > Edge Functions
2. Adicione as variáveis:
   - `BREVO_API_KEY`: sua_chave_api_do_brevo

## 5. Fazer Deploy da Function

```bash
supabase functions deploy send-curriculum-email
```

## 6. Verificar se Deployou

```bash
supabase functions list
```

## 7. Testar a Function

```bash
# Teste local (opcional)
supabase functions serve send-curriculum-email

# Ou teste via curl
curl -X POST 'https://SEU_PROJECT_REF.supabase.co/functions/v1/send-curriculum-email' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "toEmails": ["teste@exemplo.com"],
    "subject": "Teste",
    "message": "Teste de email",
    "profile": {
      "full_name": "João Silva",
      "curriculo_slug": "joao-silva"
    },
    "curriculumUrl": "https://estagionauta.com/curriculo/joao-silva"
  }'
```

## 8. Configurar CORS (se necessário)

Se der erro de CORS, adicione no `supabase/config.toml`:

```toml
[functions.send-curriculum-email]
verify_jwt = false
```

## 9. Verificar Logs

```bash
supabase functions logs send-curriculum-email
```

## URLs da Function

- **Produção**: `https://SEU_PROJECT_REF.supabase.co/functions/v1/send-curriculum-email`
- **Local**: `http://localhost:54321/functions/v1/send-curriculum-email`

## Troubleshooting

### Erro de CORS
- Verifique se a function está configurada corretamente
- Confirme se o `verify_jwt` está como `false` se não precisar de autenticação

### Erro de API Key
- Verifique se a variável `BREVO_API_KEY` está configurada
- Confirme se a chave é válida

### Erro de Supabase
- Verifique se as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas
- Confirme se a tabela `email_logs` existe 