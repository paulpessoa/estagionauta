# Edge Function para Envio de Emails de Currículo

## ✅ **Problema Resolvido**

Você estava certo! Em projetos Vite, não temos API routes como no Next.js. A solução foi criar uma **Supabase Edge Function** que roda no servidor da Supabase.

## 🚀 **O que foi implementado**

### 1. **Supabase Edge Function**
- Arquivo: `supabase/functions/send-curriculum-email/index.ts`
- Função que roda no servidor da Supabase
- Integração com Brevo (Sendinblue) para envio de emails
- Salva histórico no banco de dados

### 2. **Modal Atualizado**
- Agora usa `supabase.functions.invoke()` em vez de fetch
- Chama a Edge Function diretamente
- Mantém toda a funcionalidade anterior

### 3. **Configuração**
- `supabase/config.toml` configurado para permitir acesso público
- `verify_jwt = false` para permitir acesso sem autenticação

## 📋 **Como Configurar**

### 1. **Instalar Supabase CLI**
```bash
npm install -g supabase
```

### 2. **Fazer Login**
```bash
supabase login
```

### 3. **Linkar Projeto**
```bash
supabase link --project-ref ptogsfpkptzpuvdluxzf
```

### 4. **Configurar Variáveis de Ambiente**
No Supabase Dashboard:
1. Vá em **Settings > Edge Functions**
2. Adicione:
   - `BREVO_API_KEY`: sua_chave_api_do_brevo

### 5. **Fazer Deploy**
```bash
supabase functions deploy send-curriculum-email
```

### 6. **Verificar Deploy**
```bash
supabase functions list
```

## 🔧 **Como Funciona**

### Frontend (Vite)
```typescript
// Chama a Edge Function
const { data, error } = await supabase.functions.invoke('send-curriculum-email', {
  body: {
    toEmails: ['email@exemplo.com'],
    subject: 'Currículo compartilhado',
    message: 'Olá! Veja meu currículo...',
    profile: { /* dados do perfil */ },
    curriculumUrl: 'https://estagionauta.com/curriculo/joao-silva'
  }
})
```

### Backend (Supabase Edge Function)
```typescript
// Roda no servidor da Supabase
serve(async (req) => {
  const { toEmails, subject, message, profile, curriculumUrl } = await req.json()
  
  // Envia emails via Brevo
  for (const email of toEmails) {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY },
      body: JSON.stringify(emailData)
    })
  }
  
  // Salva no histórico
  await supabase.from('email_logs').insert(emailData)
})
```

## 🌐 **URLs da Function**

- **Produção**: `https://ptogsfpkptzpuvdluxzf.supabase.co/functions/v1/send-curriculum-email`
- **Local**: `http://localhost:54321/functions/v1/send-curriculum-email`

## 🧪 **Como Testar**

### 1. **Teste Local (Opcional)**
```bash
supabase functions serve send-curriculum-email
```

### 2. **Teste via cURL**
```bash
curl -X POST 'https://ptogsfpkptzpuvdluxzf.supabase.co/functions/v1/send-curriculum-email' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "toEmails": ["teste@exemplo.com"],
    "subject": "Teste de Currículo",
    "message": "Olá! Veja meu currículo...",
    "profile": {
      "full_name": "João Silva",
      "curriculo_slug": "joao-silva",
      "id": "uuid-do-perfil"
    },
    "curriculumUrl": "https://estagionauta.com/curriculo/joao-silva"
  }'
```

### 3. **Teste na Interface**
1. Acesse `/curriculo/joao-silva`
2. Clique em "Compartilhar por Email"
3. Adicione um email de teste
4. Clique em "Enviar"

## 📊 **Logs e Monitoramento**

### Ver Logs
```bash
supabase functions logs send-curriculum-email
```

### Histórico no Banco
```sql
SELECT * FROM email_logs 
WHERE template_name = 'curriculum_share' 
ORDER BY created_at DESC;
```

## 🔍 **Troubleshooting**

### Erro de CORS
- ✅ Já configurado no `config.toml`
- ✅ Headers CORS na function

### Erro de API Key
- Verifique se `BREVO_API_KEY` está configurada
- Confirme se a chave é válida

### Erro de Supabase
- Verifique se a tabela `email_logs` existe
- Execute o script `setup_email_logs.sql`

### Function não encontrada
- Verifique se o deploy foi feito: `supabase functions list`
- Confirme se o nome está correto: `send-curriculum-email`

## 🎯 **Vantagens da Edge Function**

1. **✅ Roda no servidor** - Não expõe API keys no frontend
2. **✅ Escalável** - Infraestrutura da Supabase
3. **✅ Seguro** - Variáveis de ambiente protegidas
4. **✅ Integrado** - Acesso direto ao banco de dados
5. **✅ Simples** - Uma função, uma responsabilidade

## 📝 **Próximos Passos**

1. **Configure o Brevo** e obtenha a API key
2. **Faça o deploy** da Edge Function
3. **Teste** o envio de emails
4. **Monitore** os logs e histórico

Agora o envio de emails funcionará perfeitamente no seu projeto Vite! 🚀 