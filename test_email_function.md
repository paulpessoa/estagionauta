# Teste da Edge Function de Email

## 🔍 **Diagnóstico do Problema**

O problema pode estar em:
1. **Tabela `email_logs`** não existe ou tem estrutura incorreta
2. **Permissões RLS** bloqueando inserção
3. **Edge Function** com erro silencioso
4. **Configuração** do Supabase

## 🛠️ **Passos para Diagnosticar**

### **1. Verificar Tabela no Supabase**
Execute no SQL Editor:
```sql
-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'email_logs'
) as table_exists;

-- Verificar estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
ORDER BY ordinal_position;
```

### **2. Verificar Logs da Edge Function**
1. Vá para **Supabase Dashboard**
2. **Logs > Edge Functions**
3. Procure por `send-curriculum-email`
4. Verifique erros recentes

### **3. Testar Inserção Manual**
```sql
-- Testar inserção direta
INSERT INTO public.email_logs (
    to_email,
    from_email,
    subject,
    status,
    provider,
    template_name
) VALUES (
    'teste@exemplo.com',
    'noreply@estagionauta.com.br',
    'Teste Manual',
    'sent',
    'brevo',
    'test'
);

-- Verificar se inseriu
SELECT * FROM public.email_logs ORDER BY created_at DESC LIMIT 1;
```

### **4. Verificar Políticas RLS**
```sql
-- Verificar políticas
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'email_logs';
```

## 🧪 **Teste da Edge Function**

### **1. Teste via Console do Navegador**
```javascript
// Substitua com suas credenciais
const SUPABASE_URL = 'sua_url_do_supabase'
const SUPABASE_ANON_KEY = 'sua_chave_anonima'

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Fazer login primeiro
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'seu-email@gmail.com',
  password: 'sua-senha'
})

// Testar Edge Function
const { data, error } = await supabase.functions.invoke('send-curriculum-email', {
  body: {
    toEmails: ['seu-email@gmail.com'],
    subject: 'Teste de Log',
    message: 'Testando logs...',
    profile: {
      id: user.id,
      full_name: 'Teste',
      curriculo_slug: 'teste'
    },
    curriculumUrl: 'https://estagionauta.com.br/curriculo/teste'
  }
})

console.log('Resultado:', data)
console.log('Erro:', error)
```

### **2. Teste via cURL**
```bash
curl -X POST 'https://ptogsfpkptzpuvdluxzf.supabase.co/functions/v1/send-curriculum-email' \
  -H 'Authorization: Bearer SEU_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "toEmails": ["teste@exemplo.com"],
    "subject": "Teste de Log",
    "message": "Testando logs...",
    "profile": {
      "id": "user-id",
      "full_name": "Teste",
      "curriculo_slug": "teste"
    },
    "curriculumUrl": "https://estagionauta.com.br/curriculo/teste"
  }'
```

## 🔧 **Soluções Comuns**

### **Problema 1: Tabela não existe**
```sql
-- Criar tabela
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email VARCHAR NOT NULL,
    from_email VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'pending',
    provider VARCHAR DEFAULT 'brevo',
    provider_id VARCHAR,
    template_name VARCHAR,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    curriculum_slug TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Problema 2: RLS bloqueando**
```sql
-- Permitir inserção da service role
CREATE POLICY "Allow service role to insert email logs" ON public.email_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);
```

### **Problema 3: Colunas faltando**
```sql
-- Adicionar colunas
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS curriculum_slug TEXT;
```

## 📊 **Verificação de Logs**

### **1. Logs da Edge Function**
- **Dashboard > Logs > Edge Functions**
- **Função:** `send-curriculum-email`
- **Procurar por:** "Error saving email history"

### **2. Logs do Banco**
```sql
-- Verificar logs recentes
SELECT 
    id,
    to_email,
    from_email,
    subject,
    status,
    created_at,
    error_message
FROM public.email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### **3. Logs de Erro**
```sql
-- Verificar apenas erros
SELECT 
    id,
    to_email,
    subject,
    status,
    error_message,
    created_at
FROM public.email_logs 
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## 🎯 **Próximos Passos**

1. **Execute o script SQL** para verificar/criar a tabela
2. **Teste inserção manual** no banco
3. **Verifique logs** da Edge Function
4. **Teste envio real** de email
5. **Verifique logs** em `/email-logs`

## 📞 **Se o Problema Persistir**

1. **Compartilhe os logs** da Edge Function
2. **Compartilhe o resultado** do teste manual
3. **Verifique se** o domínio está configurado no Brevo
4. **Teste com** email verificado no Brevo 